import {normalizeIPA} from './phonetic-engine.js';
import {summarizeAttestedPieces} from './attested-rebus-evidence.js';

const normalizeReading=value=>String(value??'').trim().toLocaleLowerCase('fr');

function isolatedGainBySound(expansion){
  const gains=new Map();
  for(const scenario of Array.isArray(expansion?.prototypeScenarios)?expansion.prototypeScenarios:[]){
    if(!Array.isArray(scenario?.added)||scenario.added.length!==1)continue;
    const ipa=normalizeIPA(scenario.added[0]?.ipa);
    if(!ipa)continue;
    const gain=Number(scenario.strictMultiPieceGain)||0;
    if(!gains.has(ipa)||gain>gains.get(ipa).gain)gains.set(ipa,{gain,method:'isolated_prototype'});
  }
  return gains;
}

function contextualGainBySound(expansion){
  const gains=new Map();
  for(const step of Array.isArray(expansion?.greedyOrder)?expansion.greedyOrder:[]){
    const ipa=normalizeIPA(step?.ipa);
    if(!ipa)continue;
    const gain=Number(step.marginalMultiPieceUniqueWords)||0;
    if(!gains.has(ipa)||gain>gains.get(ipa).gain)gains.set(ipa,{gain,method:'greedy_contextual'});
  }
  return gains;
}

export function buildSoundRepresentationPriorities({corpus,readingSounds,lexiconSeed=[],expansion={}}){
  const summaries=summarizeAttestedPieces(corpus);
  const summaryByReading=new Map(summaries.map(item=>[normalizeReading(item.reading),item]));
  const tracked=Array.isArray(readingSounds?.items)?readingSounds.items:[];
  const isolated=isolatedGainBySound(expansion);
  const contextual=contextualGainBySound(expansion);
  const groups=new Map();

  for(const item of tracked){
    const reading=String(item?.reading??'').trim();
    const ipa=normalizeIPA(item?.ipa);
    if(!reading||!ipa)continue;
    const summary=summaryByReading.get(normalizeReading(reading));
    let group=groups.get(ipa);
    if(!group){
      group={ipa,representations:[],inventory:[],strictMultiPieceGain:0,impactMethod:'none'};
      groups.set(ipa,group);
    }
    group.representations.push({
      reading,
      rebusCount:summary?.rebusCount||0,
      sourceCount:summary?.sourceCount||0,
      evidenceTier:summary?.evidenceTier||'no_attestation',
      status:item.status||'tracked_research_reading'
    });
  }

  for(const entry of Array.isArray(lexiconSeed)?lexiconSeed:[]){
    const ipa=normalizeIPA(entry?.ipa);
    if(!ipa||!groups.has(ipa))continue;
    groups.get(ipa).inventory.push({
      id:entry.id||entry.label,
      label:entry.label,
      active:entry.active!==false,
      prototypeStatus:entry.prototypeStatus||null,
      clinicalStatus:entry.clinicalStatus||null
    });
  }

  for(const group of groups.values()){
    const impact=isolated.get(group.ipa)||contextual.get(group.ipa)||{gain:0,method:'none'};
    group.strictMultiPieceGain=impact.gain;
    group.impactMethod=impact.method;
    group.attestedRepresentationCount=group.representations.filter(item=>item.rebusCount>0).length;
    group.maxSourceCount=Math.max(0,...group.representations.map(item=>item.sourceCount));
    group.totalAttestedRebuses=group.representations.reduce((sum,item)=>sum+item.rebusCount,0);
    group.hasActiveInventory=group.inventory.some(item=>item.active);
    group.hasInactivePrototype=group.inventory.some(item=>!item.active);
    group.researchPriorityScore=group.strictMultiPieceGain*1000+group.maxSourceCount*100+group.totalAttestedRebuses*10+group.attestedRepresentationCount;
    group.researchState=group.hasActiveInventory?'already_active':group.attestedRepresentationCount>0?'attested_sound_needs_visual_resolution':'high_impact_without_attested_representation';
  }

  return [...groups.values()].sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||a.ipa.localeCompare(b.ipa));
}
