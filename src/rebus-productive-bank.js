import {normalizeIPA} from './phonetic-engine.js';

const tupleObject=(schema,row)=>Object.fromEntries(schema.map((key,index)=>[key,row[index]]));

function ensureSound(index,ipa){
  const key=normalizeIPA(ipa);
  if(!key)return null;
  if(!index.has(key))index.set(key,{
    ipa:key,
    exactWords:[],
    representations:[],
    visibleConventions:[],
    priority:null,
    syllableSpan:null
  });
  return index.get(key);
}

const uniquePush=(array,value,key=value=>JSON.stringify(value))=>{
  const token=key(value);
  if(!array.some(item=>key(item)===token))array.push(value);
};

export function buildProductiveBank({fragmentIdeas=null,productiveWave=null}={}){
  const index=new Map();

  for(const idea of fragmentIdeas?.entries||[]){
    const sound=ensureSound(index,idea.ipa);
    if(!sound)continue;
    if(idea.strictness==='exact'&&idea.label)uniquePush(sound.exactWords,String(idea.label),String);
    uniquePush(sound.representations,{
      word:idea.label||null,
      wordIpa:normalizeIPA(idea.ipa),
      matchStatus:idea.strictness==='exact'?'exact':idea.strictness||'editorial',
      source:'data/rebus-fragment-representation-ideas.json',
      semanticCategory:idea.kind||null,
      representationPotential:idea.editorialDecision==='retain'?'existing_editorial':'uncertain',
      representationType:idea.kind||null,
      representationProposed:idea.label||null,
      visualBrief:idea.visualBrief||null,
      anticipatedNamingRisk:idea.anticipatedNamingRisk||'unknown',
      probableConfusions:idea.probableConfusions||[],
      spontaneousNamingRisk:idea.spontaneousNamingRisk||'unknown',
      humanNamingEvidence:idea.humanNamingEvidence||'none',
      clinicalEvidence:idea.clinicalEvidence||'none',
      editorialStatus:idea.editorialDecision||'retain',
      runtimeStatus:'unchanged_by_productive_wave'
    },item=>`${item.word}|${item.matchStatus}|${item.source}`);
  }

  if(productiveWave){
    const soundSchema=productiveWave.soundRowSchema||[];
    const repByKey=new Map((productiveWave.representations||[]).map(rep=>[`${normalizeIPA(rep.ipa)}\u0000${rep.word}`,rep]));
    const deferredByKey=new Map((productiveWave.explicitDeferrals||[]).map(row=>[`${normalizeIPA(row[0])}\u0000${row[1]}`,row]));
    const defaults=productiveWave.representationDefaults||{};

    for(const rawRow of productiveWave.soundRows||[]){
      const row=tupleObject(soundSchema,rawRow);
      const sound=ensureSound(index,row.ipa);
      if(!sound)continue;
      sound.priority={queueRank:Number(row.rank)||null,usefulTargetCount:Number(row.usefulTargetCount)||0};
      sound.syllableSpan=Number(row.syllableSpan)||null;
      for(const word of row.exactWords||[]){
        uniquePush(sound.exactWords,word,String);
        const key=`${sound.ipa}\u0000${word}`;
        const retained=repByKey.get(key);
        const deferred=deferredByKey.get(key);
        const relation={
          word,
          wordIpa:sound.ipa,
          matchStatus:defaults.matchStatus||'exact',
          source:defaults.source||'Lexique 4',
          frequency:null,
          priority:sound.priority,
          semanticCategory:retained?.semanticCategory||'lexical_exact_unresolved',
          representationPotential:retained?'editorial_candidate':(deferred?'deferred':'none_retained_this_wave'),
          representationType:retained?.type||null,
          representationProposed:retained?.word||null,
          visualBrief:retained?.brief||null,
          anticipatedNamingRisk:retained?.anticipatedNamingRisk||(deferred?'high':'high'),
          probableConfusions:retained?.confusions||deferred?.[2]||[],
          spontaneousNamingRisk:defaults.spontaneousNamingRisk||'unknown',
          humanNamingEvidence:defaults.humanNamingEvidence||'none',
          clinicalEvidence:defaults.clinicalEvidence||'none',
          editorialStatus:retained?.editorialStatus||(deferred?'defer_candidate':'reject_candidate'),
          runtimeStatus:defaults.runtimeStatus||'inactive_editorial'
        };
        uniquePush(sound.representations,relation,item=>`${item.word}|${item.source}`);
      }

      for(const label of productiveWave.visibleConventionReferences?.[sound.ipa]||[]){
        uniquePush(sound.visibleConventions,{
          label,
          matchStatus:'convention',
          source:'data/rebus-visible-conventions.json',
          editorialStatus:'existing_canonical_reference',
          runtimeStatus:'unchanged_by_productive_wave',
          spontaneousNamingRisk:'unknown',
          humanNamingEvidence:'none',
          clinicalEvidence:'none'
        },item=>item.label);
      }
    }
  }

  return index;
}

export function productiveSound(bank,ipa){
  return bank?.get(normalizeIPA(ipa))||null;
}

export function productiveCompositions(bank,targetIpa,{maxPieces=6,maxResults=50}={}){
  const target=normalizeIPA(targetIpa);
  if(!target||!bank)return[];
  const keys=[...bank.keys()].filter(Boolean).sort((a,b)=>b.length-a.length||a.localeCompare(b,'fr'));
  const results=[];
  const walk=(offset,path)=>{
    if(results.length>=maxResults)return;
    if(offset===target.length){results.push(path);return;}
    if(path.length>=maxPieces)return;
    for(const ipa of keys){
      if(target.startsWith(ipa,offset))walk(offset+ipa.length,[...path,bank.get(ipa)]);
    }
  };
  walk(0,[]);
  return results;
}

export function productiveWaveStats(productiveWave){
  const schema=productiveWave?.soundRowSchema||[];
  const rows=(productiveWave?.soundRows||[]).map(row=>tupleObject(schema,row));
  const exactWordCount=rows.reduce((sum,row)=>sum+new Set(row.exactWords||[]).size,0);
  const multipleExactHomophoneSoundCount=rows.filter(row=>new Set(row.exactWords||[]).size>=2).length;
  const pictorialTypes=new Set(['pictogram','scene']);
  const pictographicProposalCount=(productiveWave?.representations||[]).filter(rep=>pictorialTypes.has(rep.type)).length;
  const nonPictographicEditorialProposalCount=(productiveWave?.representations||[]).filter(rep=>!pictorialTypes.has(rep.type)).length;
  const conventionReferenceCount=Object.values(productiveWave?.visibleConventionReferences||{}).reduce((sum,labels)=>sum+(labels||[]).length,0);
  const briefCount=(productiveWave?.representations||[]).filter(rep=>Boolean(rep.brief)).length;
  const deferredCount=(productiveWave?.explicitDeferrals||[]).length;
  const retainedWordKeys=new Set((productiveWave?.representations||[]).map(rep=>`${normalizeIPA(rep.ipa)}\u0000${rep.word}`));
  const deferredWordKeys=new Set((productiveWave?.explicitDeferrals||[]).map(row=>`${normalizeIPA(row[0])}\u0000${row[1]}`));
  let rejectedCandidateCount=0;
  const representedIpas=new Set((productiveWave?.representations||[]).map(rep=>normalizeIPA(rep.ipa)));
  const conventionIpas=new Set(Object.keys(productiveWave?.visibleConventionReferences||{}).map(normalizeIPA));
  for(const row of rows){
    const ipa=normalizeIPA(row.ipa);
    for(const word of new Set(row.exactWords||[])){
      const key=`${ipa}\u0000${word}`;
      if(!retainedWordKeys.has(key)&&!deferredWordKeys.has(key))rejectedCandidateCount++;
    }
  }
  const soundWithoutGoodRepresentationCount=rows.filter(row=>{
    const ipa=normalizeIPA(row.ipa);
    return !representedIpas.has(ipa)&&!conventionIpas.has(ipa);
  }).length;
  return {
    examinedSoundCount:rows.length,
    enrichedSoundCount:rows.length-soundWithoutGoodRepresentationCount,
    totalDistinctExactWordCount:exactWordCount,
    multipleExactHomophoneSoundCount,
    pictographicProposalCount,
    nonPictographicRepresentationCount:nonPictographicEditorialProposalCount+conventionReferenceCount,
    visualBriefCount:briefCount,
    deferredCandidateCount:deferredCount,
    rejectedCandidateCount,
    soundWithoutGoodRepresentationCount,
    runtimeActivationCount:0
  };
}
