import fs from 'node:fs';
import {normalizeIPA,segmentTargetWithLexicon,rankDecompositions} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const pictogramPath=process.argv[3]||'data/lexicon-seed.json';
const outputPath=process.argv[4]||'data/coverage-report.json';

const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const pictograms=JSON.parse(fs.readFileSync(pictogramPath,'utf8'));
const entries=Array.isArray(lexique)?lexique:(lexique.entries||[]);
const active=pictograms.filter(p=>p.active!==false&&p.ipa&&p.label);
const known=active.map(p=>({...p,normalizedIPA:normalizeIPA(p.ipa)}));

function frequencyWeight(entry){
  const f=Number(entry.frequency)||0;
  return Math.log10(1+f)+1;
}

function candidateLabelScore(entry){
  const pos=String(entry.pos||'').toUpperCase();
  const nounBoost=pos.startsWith('NOM')?4:0;
  const interjectionBoost=pos.startsWith('ONO')?1:0;
  return nounBoost+interjectionBoost+Math.log10(1+(Number(entry.frequency)||0));
}

const exactIpaIndex=new Map();
for(const entry of entries){
  if(!entry?.word||!entry?.ipa)continue;
  const ipa=normalizeIPA(entry.ipa);
  if(!ipa)continue;
  const bucket=exactIpaIndex.get(ipa)||[];
  bucket.push(entry);
  exactIpaIndex.set(ipa,bucket);
}
for(const bucket of exactIpaIndex.values()){
  bucket.sort((a,b)=>candidateLabelScore(b)-candidateLabelScore(a)||String(a.word).localeCompare(String(b.word),'fr'));
}

function exactWholeWordCandidates(ipa,limit=12){
  const seen=new Set();
  const out=[];
  for(const entry of exactIpaIndex.get(ipa)||[]){
    const key=String(entry.word).toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    out.push({
      word:entry.word,
      ipa:entry.ipa,
      pos:entry.pos||'',
      frequency:Number(entry.frequency)||0,
      noun:String(entry.pos||'').toUpperCase().startsWith('NOM')
    });
    if(out.length>=limit)break;
  }
  return out;
}

function canSegmentRange(target,start,end,maxPieces=4){
  const memo=new Map();
  function walk(offset,pieces){
    if(offset===end)return [];
    if(offset>end||pieces>=maxPieces)return null;
    const key=`${offset}:${pieces}`;
    if(memo.has(key))return memo.get(key);
    for(const item of known){
      const ipa=item.normalizedIPA;
      if(ipa&&target.startsWith(ipa,offset)&&offset+ipa.length<=end){
        const rest=walk(offset+ipa.length,pieces+1);
        if(rest){const result=[item,...rest];memo.set(key,result);return result;}
      }
    }
    memo.set(key,null);return null;
  }
  return walk(start,0);
}

function oneGapCandidates(target,maxPieces=4,maxGapChars=6){
  const out=[];
  for(let start=0;start<target.length;start++){
    const left=canSegmentRange(target,0,start,maxPieces);
    if(start>0&&!left)continue;
    for(let end=start+1;end<=Math.min(target.length,start+maxGapChars);end++){
      const right=canSegmentRange(target,end,target.length,maxPieces);
      if(end<target.length&&!right)continue;
      const gap=target.slice(start,end);
      if(!gap)continue;
      const used=(left?.length||0)+(right?.length||0);
      if(used===0)continue;
      out.push({gap,left:left||[],right:right||[]});
    }
  }
  return out;
}

const constructible=[];
const constructibleMultiPiece=[];
const gaps=new Map();
for(const entry of entries){
  if(!entry?.word||!entry?.ipa)continue;
  const target=normalizeIPA(entry.ipa);
  if(!target)continue;
  const decompositions=rankDecompositions(segmentTargetWithLexicon(target,active,4));
  if(decompositions.length){
    const record={
      word:entry.word,
      ipa:entry.ipa,
      frequency:Number(entry.frequency)||0,
      pos:entry.pos||'',
      decomposition:decompositions[0].map(x=>x.id||x.label)
    };
    constructible.push(record);
    if(record.decomposition.length>=2)constructibleMultiPiece.push(record);
    continue;
  }
  const weight=frequencyWeight(entry);
  const seen=new Set();
  for(const candidate of oneGapCandidates(target)){
    const gap=candidate.gap;
    if(seen.has(gap))continue;
    seen.add(gap);
    const record=gaps.get(gap)||{ipa:gap,unlockCount:0,weightedGain:0,examples:[]};
    record.unlockCount+=1;
    record.weightedGain+=weight;
    if(record.examples.length<12){
      record.examples.push({
        word:entry.word,
        ipa:entry.ipa,
        frequency:Number(entry.frequency)||0,
        frame:[...candidate.left.map(x=>x.id||x.label),`[${gap}]`,...candidate.right.map(x=>x.id||x.label)]
      });
    }
    gaps.set(gap,record);
  }
}

const missingSounds=[...gaps.values()]
  .sort((a,b)=>b.weightedGain-a.weightedGain||b.unlockCount-a.unlockCount)
  .slice(0,100)
  .map((x,index)=>{
    const exactLabels=exactWholeWordCandidates(x.ipa);
    const nounLabels=exactLabels.filter(label=>label.noun);
    return {
      ...x,
      rank:index+1,
      weightedGain:Number(x.weightedGain.toFixed(3)),
      exactWholeWordCandidates:exactLabels,
      exactNounCandidates:nounLabels,
      hasExactNounCandidate:nounLabels.length>0
    };
  });

constructible.sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
constructibleMultiPiece.sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
const uniqueWordForms=new Set(entries.filter(x=>x?.word).map(x=>String(x.word).toLowerCase()));
const uniqueConstructible=new Set(constructible.map(x=>String(x.word).toLowerCase()));
const uniqueMultiPiece=new Set(constructibleMultiPiece.map(x=>String(x.word).toLowerCase()));

const report={
  generatedAt:new Date().toISOString(),
  source:lexique.source||lexiquePath,
  pictogramCount:active.length,
  lexicalEntryCount:entries.length,
  uniqueWordFormCount:uniqueWordForms.size,
  strictConstructibleCount:constructible.length,
  strictConstructibleUniqueWordCount:uniqueConstructible.size,
  strictMultiPieceCount:constructibleMultiPiece.length,
  strictMultiPieceUniqueWordCount:uniqueMultiPiece.size,
  strictCoverage:entries.length?Number((constructible.length/entries.length).toFixed(6)):0,
  strictMultiPieceCoverage:entries.length?Number((constructibleMultiPiece.length/entries.length).toFixed(6)):0,
  methodology:{
    strict:'Un mot est constructible uniquement si sa forme phonétique entière est la concaténation de dénominations complètes de pictogrammes actifs.',
    multiPiece:'La métrique multi-pièces exclut les simples homophones d’un seul pictogramme et correspond mieux à un vrai rébus.',
    missingSoundRanking:'Pour chaque mot non constructible, recherche d’un unique segment sonore manquant entouré de segments déjà constructibles. Le score privilégie les mots fréquents.',
    wholeWordCandidate:'Pour chaque segment manquant, recherche dans Lexique 4 des formes dont la prononciation entière correspond exactement au segment. Les noms sont priorisés mais doivent encore passer un contrôle d’imageabilité et de stabilité de dénomination.',
    caution:'Un segment bien classé ou un homophone exact n’autorise pas automatiquement un pictogramme. Il doit être concret, représentable, stable, reconnaissable et validé.'
  },
  constructible:constructible.slice(0,500),
  constructibleMultiPiece:constructibleMultiPiece.slice(0,500),
  missingSounds
};

fs.writeFileSync(outputPath,JSON.stringify(report,null,2));
console.log(`Coverage: ${constructible.length}/${entries.length}; multi-piece: ${constructibleMultiPiece.length}`);
console.log(`Top missing sounds: ${missingSounds.slice(0,10).map(x=>`${x.ipa} (${x.unlockCount})`).join(', ')}`);
console.log(`Report -> ${outputPath}`);
