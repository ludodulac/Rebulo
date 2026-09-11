import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';
import {sourceExactSyllables} from './rebus-sound-catalog.js';

function add(set,value){if(value)set.add(value);}

function syllableBoundaries(entry={}){
  const syllables=sourceExactSyllables(entry);
  if(!syllables.length)return null;
  const boundaries=[0];
  let total=0;
  for(const syllable of syllables){total+=splitIPAUnits(syllable).length;boundaries.push(total);}
  return {syllables,boundaries};
}

function windowCategory(start,end,boundaries,totalUnits){
  const startsOnBoundary=boundaries.includes(start);
  const endsOnBoundary=boundaries.includes(end);
  const crossed=boundaries.some(boundary=>boundary>start&&boundary<end);
  if(start===0&&end===totalUnits)return 'whole_word';
  if(startsOnBoundary&&endsOnBoundary){
    const startIndex=boundaries.indexOf(start);const endIndex=boundaries.indexOf(end);
    return endIndex-startIndex===1?'whole_syllable':'multi_syllable';
  }
  if(crossed)return 'cross_syllable_fragment';
  return 'within_syllable_fragment';
}

function finalize(map){
  return [...map.values()].map(row=>({
    ipa:row.ipa,
    occurrenceCount:row.occurrenceCount,
    unitCounts:[...row.unitCounts].sort((a,b)=>a-b),
    categories:[...row.categories].sort(),
    positions:[...row.positions].sort(),
    examples:row.examples,
    wholeWordExamples:row.wholeWordExamples,
    sourceExact:true
  })).sort((a,b)=>b.occurrenceCount-a.occurrenceCount||a.ipa.localeCompare(b.ipa));
}

/**
 * Exhaustive contiguous phoneme inventory over source-exact lexical pronunciations.
 * Unlike the historic sound catalog, fragments do not need to align with a syllable boundary.
 * No representation is activated here: this is only a reusable sound index.
 */
export function buildPhonemeFragmentInventory(entries=[],{minUnits=1,maxUnits=8}={}){
  const map=new Map();
  for(const entry of entries||[]){
    const ipa=normalizeIPA(entry.ipa||entry.targetIpa||'');
    const exact=syllableBoundaries(entry);
    if(!ipa||!exact)continue;
    const units=splitIPAUnits(ipa);
    const label=String(entry.word||entry.target||'').trim();
    for(let start=0;start<units.length;start++){
      for(let length=minUnits;length<=maxUnits&&start+length<=units.length;length++){
        const end=start+length;const fragment=units.slice(start,end).join('');
        let row=map.get(fragment);
        if(!row)row={ipa:fragment,occurrenceCount:0,unitCounts:new Set(),categories:new Set(),positions:new Set(),examples:[],wholeWordExamples:[]};
        row.occurrenceCount+=1;add(row.unitCounts,length);
        const category=windowCategory(start,end,exact.boundaries,units.length);add(row.categories,category);
        add(row.positions,start===0?'word_initial':end===units.length?'word_final':'word_medial');
        if(label&&row.examples.length<12&&!row.examples.includes(label))row.examples.push(label);
        if(category==='whole_word'&&label&&row.wholeWordExamples.length<12&&!row.wholeWordExamples.includes(label))row.wholeWordExamples.push(label);
        map.set(fragment,row);
      }
    }
  }
  return finalize(map);
}

/** Build every contiguous phoneme window across a phrase, including cross-word windows. */
export function buildPhrasePhonemeWindows(words=[],{minUnits=1,maxUnits=8}={}){
  const flat=[];
  for(let wordIndex=0;wordIndex<(words||[]).length;wordIndex++){
    const word=words[wordIndex]||{};
    const ipa=normalizeIPA(word.ipa||word.targetIpa||(Array.isArray(word.syllables)?word.syllables.join(''):''));
    const units=splitIPAUnits(ipa);
    units.forEach((unit,unitIndex)=>flat.push({unit,wordIndex,unitIndex,text:String(word.word||word.target||word.text||'').trim()}));
  }
  const out=[];
  for(let start=0;start<flat.length;start++){
    for(let length=minUnits;length<=maxUnits&&start+length<=flat.length;length++){
      const parts=flat.slice(start,start+length);const wordIndexes=[...new Set(parts.map(part=>part.wordIndex))];
      out.push({
        ipa:parts.map(part=>part.unit).join(''),
        startUnit:start,
        unitCount:length,
        crossesWordBoundary:wordIndexes.length>1,
        sourceWords:wordIndexes.map(index=>({wordIndex:index,text:String(words[index]?.word||words[index]?.target||words[index]?.text||'').trim()}))
      });
    }
  }
  return out;
}

export const FRAGMENT_STRICTNESS=Object.freeze({
  EXACT:'exact',
  EXPLICIT_CONVENTION:'explicit_convention',
  PLAYFUL_NEAR:'playful_near',
  ORTHOPHONY_LOCKED:'orthophony_locked'
});

/**
 * Group editorial representation ideas by their true stored reading.
 * Near/tolerant readings stay separate and never mutate exact phonetic identity.
 */
export function groupFragmentRepresentationIdeas(entries=[]){
  const groups=new Map();
  for(const entry of entries||[]){
    const ipa=normalizeIPA(entry.ipa||'');if(!ipa)continue;
    const strictness=entry.strictness||FRAGMENT_STRICTNESS.EXACT;
    if(!groups.has(ipa))groups.set(ipa,[]);
    groups.get(ipa).push({...entry,ipa,strictness,automaticActivation:false,humanNamingEvidence:entry.humanNamingEvidence||'none',clinicalEvidence:entry.clinicalEvidence||'none'});
  }
  return [...groups.entries()].map(([ipa,ideas])=>({ipa,ideas})).sort((a,b)=>a.ipa.localeCompare(b.ipa));
}

export function ideasForFragment(ipa='',groups=[]){
  const key=normalizeIPA(ipa);return groups.find(group=>group.ipa===key)?.ideas||[];
}
