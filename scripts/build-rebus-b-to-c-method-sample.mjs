import fs from 'node:fs';
import path from 'node:path';

const inputPath=process.argv[2]||'data/rebus-phoneme-fragment-index.json';
const outputPath=process.argv[3]||'data/rebus-b-to-c-method-sample.json';
const reportPath=process.argv[4]||'docs/REBUS_B_TO_C_SAMPLE_SELECTION.md';

const source=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const schema=Object.fromEntries(source.rowSchema.map((key,index)=>[key,index]));
const rows=source.fragmentRows||[];
const controlsPositive=['chien','chat','train','voiture','bébé','œil','pied','soleil','cheval','porte','livre','mer','scie','pie','lit','nid','route','pomme','table','nez'];
const controlsPriorMiss=['maman','bureau','prison','tour','visage','but','dossier','vaisseau','cerveau','journal','planète','village','papier','monstre','os','bâton','goutte'];
const controlsNegative=['idée','raison','justice','effet','cause','système','problème','liberté','qualité','niveau','valeur','besoin','concept','principe','théorie','opinion','avenir','vérité','importance','possibilité'];
const controlKind=new Map([...controlsPositive.map(w=>[w,'positive_known']),...controlsPriorMiss.map(w=>[w,'positive_prior_miss']),...controlsNegative.map(w=>[w,'negative_abstract'])]);
const normalizeWord=value=>String(value||'').trim().toLocaleLowerCase('fr-FR').normalize('NFC');
const stableHash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const nounLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='NOM';
const verbLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='VER';
const adjLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='ADJ';
const posBucket=pos=>nounLike(pos)?'noun':verbLike(pos)?'verb':adjLike(pos)?'adjective':'other';

const relations=[];
for(const raw of rows){
  const ipa=raw[schema.ipa];
  const occurrenceCount=Number(raw[schema.occurrenceCount])||0;
  const unitCounts=raw[schema.unitCounts]||[];
  const categories=raw[schema.categories]||[];
  const words=raw[schema.exactLexicalCandidates]||[];
  for(const item of words){
    const [word,pos,frequency,syllableCount,candidateCategories]=item;
    relations.push({
      ipa,word,pos:pos||null,frequency:Number(frequency)||0,syllableCount:Number(syllableCount)||null,
      candidateCategories:candidateCategories||[],occurrenceCount,unitCount:Math.min(...unitCounts.map(Number).filter(Number.isFinite)),
      fragmentCategories:categories,exactWordCount:words.length,nounExactWordCount:words.filter(candidate=>nounLike(candidate[1])).length
    });
  }
}

function percentileMap(values){
  const sorted=[...values].sort((a,b)=>a-b);return value=>{
    if(!sorted.length)return 0;let lo=0,hi=sorted.length;while(lo<hi){const mid=(lo+hi)>>1;if(sorted[mid]<=value)lo=mid+1;else hi=mid;}return lo/sorted.length;
  };
}
const freqPct=percentileMap(relations.map(r=>Math.log1p(r.frequency)));
const reusePct=percentileMap(relations.map(r=>Math.log1p(r.occurrenceCount)));
for(const r of relations){r.lexicalFrequencyPercentile=Number(freqPct(Math.log1p(r.frequency)).toFixed(4));r.phoneticReusePercentile=Number(reusePct(Math.log1p(r.occurrenceCount)).toFixed(4));}

const byWord=new Map();
for(const r of relations){const key=normalizeWord(r.word);if(!byWord.has(key))byWord.set(key,[]);byWord.get(key).push(r);}
const byIpa=new Map();for(const r of relations){if(!byIpa.has(r.ipa))byIpa.set(r.ipa,[]);byIpa.get(r.ipa).push(r);}

const selected=new Map();
const add=(r,reason)=>{if(!r)return;const key=`${r.ipa}\u0000${normalizeWord(r.word)}`;const current=selected.get(key)||{...r,selectionReasons:[]};if(!current.selectionReasons.includes(reason))current.selectionReasons.push(reason);selected.set(key,current);};

// Controls are inclusion-only: they never influence scoring or grade rules.
for(const [word,kind] of controlKind){const candidates=(byWord.get(word)||[]).sort((a,b)=>b.frequency-a.frequency||b.occurrenceCount-a.occurrenceCount);for(const r of candidates.slice(0,2))add(r,`control:${kind}`);}

// Multi-homophone sound groups: structural preselection only, no claim of distinct visual concepts.
const multiGroups=[...byIpa.entries()].filter(([,rels])=>new Set(rels.map(r=>normalizeWord(r.word))).size>=2).map(([ipa,rels])=>({ipa,rels,wordCount:new Set(rels.map(r=>normalizeWord(r.word))).size,nounCount:rels.filter(r=>nounLike(r.pos)).length,occurrenceCount:Math.max(...rels.map(r=>r.occurrenceCount)),unitCount:Math.min(...rels.map(r=>r.unitCount))})).sort((a,b)=>b.nounCount-a.nounCount||b.occurrenceCount-a.occurrenceCount||a.unitCount-b.unitCount||b.wordCount-a.wordCount).slice(0,70);
for(const group of multiGroups){for(const r of group.rels.sort((a,b)=>Number(nounLike(b.pos))-Number(nounLike(a.pos))||b.frequency-a.frequency).slice(0,5))add(r,'stratum:multi_homophone');}

// Deterministic structural strata over all B relations.
const strata=new Map();
for(const r of relations){
  const units=r.unitCount<=2?'u1_2':r.unitCount<=4?'u3_4':'u5_8';
  const syllables=(r.syllableCount||9)<=1?'s1':r.syllableCount===2?'s2':'s3plus';
  const fq=r.lexicalFrequencyPercentile>=0.8?'freq_high':r.lexicalFrequencyPercentile<=0.2?'freq_low':'freq_mid';
  const key=[units,syllables,fq,posBucket(r.pos)].join('|');if(!strata.has(key))strata.set(key,[]);strata.get(key).push(r);
}
for(const [key,bucket] of [...strata.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){bucket.sort((a,b)=>stableHash(`${a.ipa}|${a.word}`)-stableHash(`${b.ipa}|${b.word}`));for(const r of bucket.slice(0,3))add(r,`stratum:${key}`);}

// A discovery queue that is deliberately semantic-agnostic: frequent, reusable, compact nouns not already selected.
const discovery=relations.filter(r=>nounLike(r.pos)&&r.unitCount<=6&&r.syllableCount<=2).sort((a,b)=>(b.phoneticReusePercentile+b.lexicalFrequencyPercentile)-(a.phoneticReusePercentile+a.lexicalFrequencyPercentile)||a.unitCount-b.unitCount||stableHash(`${a.ipa}|${a.word}`)-stableHash(`${b.ipa}|${b.word}`));
for(const r of discovery){if([...selected.values()].filter(x=>x.selectionReasons.includes('stratum:discovery_queue')).length>=70)break;const key=`${r.ipa}\u0000${normalizeWord(r.word)}`;if(!selected.has(key))add(r,'stratum:discovery_queue');}

let sample=[...selected.values()];
// Keep all controls and multi-homophone rows; cap purely random strata first if needed.
if(sample.length>420){const protectedRows=sample.filter(r=>r.selectionReasons.some(reason=>reason.startsWith('control:')||reason==='stratum:multi_homophone'||reason==='stratum:discovery_queue'));const remainder=sample.filter(r=>!protectedRows.includes(r)).sort((a,b)=>stableHash(`${a.ipa}|${a.word}`)-stableHash(`${b.ipa}|${b.word}`));sample=[...protectedRows,...remainder.slice(0,Math.max(0,420-protectedRows.length))];}
sample.sort((a,b)=>a.ipa.localeCompare(b.ipa,'fr')||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));

const stats={
  sourceFragmentCount:source.stats?.fragmentCount||rows.length,
  sourceSoundWithExactWordCount:source.stats?.withExactLexicalCandidateCount||null,
  sourceExactRelationCount:source.stats?.exactLexicalRelationCount||relations.length,
  flattenedExactRelationCount:relations.length,
  sampleRelationCount:sample.length,
  sampleSoundCount:new Set(sample.map(r=>r.ipa)).size,
  controlsRequested:controlKind.size,
  controlsFound:[...controlKind.keys()].filter(word=>byWord.has(word)).length,
  multiHomophoneSoundGroupsInSample:new Set(sample.filter(r=>r.selectionReasons.includes('stratum:multi_homophone')).map(r=>r.ipa)).size,
  posDistribution:Object.fromEntries(['noun','verb','adjective','other'].map(bucket=>[bucket,sample.filter(r=>posBucket(r.pos)===bucket).length])),
  unitDistribution:Object.fromEntries(['1-2','3-4','5-8'].map(label=>[label,sample.filter(r=>label==='1-2'?r.unitCount<=2:label==='3-4'?r.unitCount>=3&&r.unitCount<=4:r.unitCount>=5).length])),
  syllableDistribution:Object.fromEntries(['1','2','3+'].map(label=>[label,sample.filter(r=>label==='1'?r.syllableCount===1:label==='2'?r.syllableCount===2:(r.syllableCount||9)>=3).length]))
};
const report={formatVersion:1,generatedAt:new Date().toISOString(),status:'analysis_only_B_to_C_method_sample',policy:{unit:'exact SOUND + exact WORD + visual SENSE/CONCEPT; this file samples B relations only and does not assert a visual concept.',controls:'Control words affect inclusion only, never score or grade.',activation:'No candidate here creates or activates a representation.',humanEvidence:'none'},source:{path:inputPath,stats:source.stats},stats,sample};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
const lines=['# B → C — sélection reproductible du banc d’essai','',`- Relations B exhaustives : ${stats.sourceExactRelationCount}.`,`- Sons B avec au moins un mot exact : ${stats.sourceSoundWithExactWordCount}.`,`- Relations retenues dans le banc d’essai : ${stats.sampleRelationCount}.`,`- Sons distincts dans le banc d’essai : ${stats.sampleSoundCount}.`,`- Contrôles trouvés : ${stats.controlsFound}/${stats.controlsRequested}.`,`- Sons multi-homophones structurels échantillonnés : ${stats.multiHomophoneSoundGroupsInSample}.`,'','## Principe','', 'Cette sélection ne qualifie **aucun** mot comme représentation. Elle construit seulement un échantillon B diversifié à annoter ensuite au niveau **SON exact + MOT exact + SENS/CONCEPT visuel**. Les contrôles servent uniquement à vérifier la méthode et ne modifient aucun score.','','## Distribution','',`- POS : ${JSON.stringify(stats.posDistribution)}.`,`- Longueur phonétique : ${JSON.stringify(stats.unitDistribution)}.`,`- Syllabes lexicales : ${JSON.stringify(stats.syllableDistribution)}.`,'','## Raisons de sélection','', '- contrôles positifs connus ;','- faux négatifs historiques à retester ;','- contrôles abstraits négatifs ;','- sons à homophones multiples ;','- strates longueur × syllabes × fréquence × POS ;','- file de découverte structurale : noms courts, fréquents et phonétiquement réutilisables.','','> Les scores sémantiques (concrétude, dessinabilité, dénomination attendue, ambiguïté) ne sont volontairement pas inventés par ce script.'];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
