import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';
import {classifySyllableCoverage} from './syllable-coverage.js';
import {wholeWordRepresentationCandidates} from './syllable-representation-candidates.js';

function targetKey(target={}){
  return `${String(target?.target||target?.word||'').toLocaleLowerCase('fr')}|${normalizeIPA(target?.targetIpa||target?.ipa||'')}`;
}

export function buildPhoneticSegmentInventory(targets=[],{minUnits=1,maxUnits=5}={}){
  const map=new Map();
  for(const target of targets||[]){
    const ipa=normalizeIPA(target?.targetIpa||target?.ipa||'');
    const units=splitIPAUnits(ipa);
    if(!units.length)continue;
    const seenInTarget=new Set();
    for(let start=0;start<units.length;start++){
      for(let length=minUnits;length<=maxUnits&&start+length<=units.length;length++){
        const segment=units.slice(start,start+length).join('');
        if(!segment)continue;
        let row=map.get(segment);
        if(!row){
          row={ipa:segment,unitCount:length,occurrenceCount:0,targetCount:0,totalFrequency:0,minAgeBandCandidate:12,examples:[]};
          map.set(segment,row);
        }
        row.occurrenceCount+=1;
        if(seenInTarget.has(segment))continue;
        seenInTarget.add(segment);
        row.targetCount+=1;
        row.totalFrequency+=Number(target?.frequency)||0;
        row.minAgeBandCandidate=Math.min(row.minAgeBandCandidate,Number(target?.ageBandCandidate)||12);
        const label=String(target?.target||target?.word||'').trim();
        if(label&&row.examples.length<8&&!row.examples.includes(label))row.examples.push(label);
      }
    }
  }
  return [...map.values()]
    .map(row=>({...row,totalFrequency:Number(row.totalFrequency.toFixed(3))}))
    .sort((a,b)=>b.targetCount-a.targetCount||b.totalFrequency-a.totalFrequency||a.unitCount-b.unitCount||a.ipa.localeCompare(b.ipa));
}

export function classifySegmentInventory(rows=[],lexicon=[],maxOperations=4){
  return (rows||[]).map(row=>({...row,coverage:classifySyllableCoverage(row.ipa,lexicon,maxOperations)}));
}

export function analyzeTargetConstructibility(targets=[],lexicon=[],maxOperations=4){
  const counts={whole_image:0,image_composition:0,image_plus_letter:0,unresolved:0};
  const examples={whole_image:[],image_composition:[],image_plus_letter:[],unresolved:[]};
  const states=[];
  for(const target of targets||[]){
    const coverage=classifySyllableCoverage(target?.targetIpa||target?.ipa||'',lexicon,maxOperations);
    let state='unresolved';
    if(coverage.coverageType==='whole_word')state='whole_image';
    else if(coverage.coverageType==='composite_words')state='image_composition';
    else if(coverage.coverageType==='explicit_grapheme')state='image_plus_letter';
    counts[state]+=1;
    const word=String(target?.target||target?.word||'').trim();
    if(word&&examples[state].length<12)examples[state].push(word);
    states.push({key:targetKey(target),state,coverage});
  }
  return {counts,examples,states};
}

export function buildSegmentResearchQueue(segmentRows=[],entries=[],{candidateLimit=8,maxSegments=200}={}){
  const uncovered=(segmentRows||[])
    .filter(row=>row?.coverage?.coverageType==='uncovered')
    .sort((a,b)=>b.targetCount-a.targetCount||b.totalFrequency-a.totalFrequency||a.unitCount-b.unitCount||a.ipa.localeCompare(b.ipa))
    .slice(0,maxSegments);
  return uncovered.map(row=>({
    ipa:row.ipa,
    unitCount:row.unitCount,
    targetCount:row.targetCount,
    occurrenceCount:row.occurrenceCount,
    totalFrequency:row.totalFrequency,
    minAgeBandCandidate:row.minAgeBandCandidate,
    examples:row.examples,
    wholeWordCandidates:wholeWordRepresentationCandidates(row.ipa,entries,candidateLimit),
    researchState:'needs_visual_resolution'
  }));
}

export function rankBrickOpportunities(researchRows=[],targets=[],lexicon=[],{limit=50,maxOperations=4}={}){
  const baseline=analyzeTargetConstructibility(targets,lexicon,maxOperations);
  const baselineByKey=new Map(baseline.states.map(row=>[row.key,row]));
  const unresolved=(targets||[]).filter(target=>baselineByKey.get(targetKey(target))?.state==='unresolved');
  const opportunities=[];
  for(const row of (researchRows||[]).slice(0,limit)){
    const virtual={id:`research-${row.ipa}`,label:`/${row.ipa}/`,ipa:row.ipa,active:true,strictEligible:true};
    const expanded=[...(lexicon||[]),virtual];
    let strictUnlocked=0;let generalUnlocked=0;let weightedGain=0;const examples=[];
    for(const target of unresolved){
      const targetIpa=normalizeIPA(target?.targetIpa||target?.ipa||'');
      if(!targetIpa.includes(row.ipa))continue;
      const coverage=classifySyllableCoverage(targetIpa,expanded,maxOperations);
      if(coverage.coverageType==='uncovered')continue;
      if(coverage.mode==='strict')strictUnlocked+=1;
      else generalUnlocked+=1;
      weightedGain+=Number(target?.frequency)||0;
      const word=String(target?.target||target?.word||'').trim();
      if(word&&examples.length<8)examples.push(word);
    }
    opportunities.push({
      ...row,
      strictUnlocked,
      generalUnlocked,
      totalUnlocked:strictUnlocked+generalUnlocked,
      weightedGain:Number(weightedGain.toFixed(3)),
      examplesUnlocked:examples
    });
  }
  return opportunities.sort((a,b)=>b.totalUnlocked-a.totalUnlocked||b.weightedGain-a.weightedGain||b.targetCount-a.targetCount||a.ipa.localeCompare(b.ipa));
}
