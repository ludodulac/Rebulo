import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';
import {classifySyllableCoverage} from './syllable-coverage.js';
import {wholeWordRepresentationCandidates} from './syllable-representation-candidates.js';
import {isDrawableNamingCandidate} from './drawable-opportunities.js';

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

function candidateResearchScore(candidate={}){
  const pos=String(candidate?.pos||'').toUpperCase().split(':')[0];
  const posScore=pos==='NOM'?30:pos==='ONO'?24:pos==='ADJ'?10:pos==='VER'?8:4;
  const frequency=Math.max(0,Number(candidate?.frequency)||0);
  const lexicalFrequencyScore=Math.min(25,Math.log10(frequency+1)*8);
  const word=String(candidate?.word||'').trim();
  const lengthScore=word.length>=2&&word.length<=10?8:word.length<=15?4:0;
  return Number((posScore+lexicalFrequencyScore+lengthScore).toFixed(3));
}

export function rankVisualResearchLeads(opportunities=[],{limit=60}={}){
  const leads=(opportunities||[]).map(row=>{
    const plausibleLexicalCandidates=(row.wholeWordCandidates||[])
      .filter(isDrawableNamingCandidate)
      .map(candidate=>({...candidate,automaticResearchScore:candidateResearchScore(candidate)}))
      .sort((a,b)=>b.automaticResearchScore-a.automaticResearchScore||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
    const nounCandidateCount=plausibleLexicalCandidates.filter(candidate=>String(candidate.pos||'').toUpperCase().split(':')[0]==='NOM').length;
    const candidateEvidence=plausibleLexicalCandidates.length>0;
    const route=candidateEvidence
      ?'review_exact_lexical_candidates'
      :row.unitCount>=2
        ?'search_scene_expression_or_alternate_segmentation'
        :'prefer_explicit_letter_or_other_visible_operation';
    const sizeBonus=Math.min(4,Number(row.unitCount)||0)*12;
    const lexicalBonus=candidateEvidence?90+Math.min(40,plausibleLexicalCandidates.length*8):0;
    const nounBonus=Math.min(40,nounCandidateCount*10);
    const singleUnitPenalty=Number(row.unitCount)===1?45:0;
    const letterFallbackPenalty=!candidateEvidence&&Number(row.unitCount)===1?70:0;
    const coverageScore=Math.min(180,Number(row.totalUnlocked||0)*2)+Math.min(70,Number(row.strictUnlocked||0));
    const frequencyScore=Math.min(70,Math.log10(Math.max(1,Number(row.weightedGain)||0))*16);
    const researchPriorityScore=Number((coverageScore+frequencyScore+sizeBonus+lexicalBonus+nounBonus-singleUnitPenalty-letterFallbackPenalty).toFixed(3));
    return {
      ...row,
      plausibleLexicalCandidates,
      nounCandidateCount,
      researchRoute:route,
      researchPriorityScore,
      visualAssessment:'human_review_required',
      spontaneousNamingAssessment:'human_review_required',
      ageSuitabilityAssessment:'human_review_required',
      clinicalAssessment:'not_assessed'
    };
  });
  return leads.sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.totalUnlocked-a.totalUnlocked||b.strictUnlocked-a.strictUnlocked||b.weightedGain-a.weightedGain||a.ipa.localeCompare(b.ipa)).slice(0,limit);
}
