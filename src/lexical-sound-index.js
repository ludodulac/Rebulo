import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

export const LEXICAL_POSITIONS=Object.freeze(['any','initial','medial','final']);

function positionsForUnits(units=[],target=''){
  const normalizedTarget=normalizeIPA(target);
  if(!normalizedTarget)return [];
  const out=new Set();
  units.forEach((unit,index)=>{
    if(normalizeIPA(unit)!==normalizedTarget)return;
    if(index===0)out.add('initial');
    if(index===units.length-1)out.add('final');
    if(index>0&&index<units.length-1)out.add('medial');
  });
  return [...out];
}

export function lexicalEntry(entry={}){
  const ipa=normalizeIPA(entry.ipa||'');
  return {
    word:String(entry.word||'').trim(),
    ipa,
    displayIpa:entry.ipa||'',
    frequency:Number(entry.frequency)||0,
    pos:entry.pos||'',
    syllableCount:Number.isInteger(entry.syllableCount)&&entry.syllableCount>0?entry.syllableCount:null,
    decomposition:Array.isArray(entry.decomposition)?entry.decomposition.filter(Boolean):[],
    phonemes:splitIPAUnits(ipa)
  };
}

export function dedupeLexicalEntries(entries=[]){
  const best=new Map();
  for(const raw of entries||[]){
    const entry=lexicalEntry(raw);
    if(!entry.word||!entry.ipa)continue;
    const key=`${entry.word.toLocaleLowerCase('fr')}|${entry.ipa}`;
    const previous=best.get(key);
    if(!previous||entry.frequency>previous.frequency)best.set(key,entry);
  }
  return [...best.values()].sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
}

export function lexicalPhonemePosition(ipa='',phoneme=''){
  return positionsForUnits(splitIPAUnits(ipa),phoneme);
}

export function filterLexicalEntries(entries=[],{phoneme='',position='any',query='',limit=30}={}){
  const target=normalizeIPA(phoneme);
  const q=String(query||'').trim().toLocaleLowerCase('fr');
  const safePosition=LEXICAL_POSITIONS.includes(position)?position:'any';
  const filtered=dedupeLexicalEntries(entries).filter(entry=>{
    if(q&&!`${entry.word} ${entry.ipa} ${entry.decomposition.join(' ')}`.toLocaleLowerCase('fr').includes(q))return false;
    if(!target)return true;
    const positions=positionsForUnits(entry.phonemes,target);
    return safePosition==='any'?positions.length>0:positions.includes(safePosition);
  });
  return Number.isInteger(limit)&&limit>0?filtered.slice(0,limit):filtered;
}

export function lexicalSoundStats(entries=[]){
  const unique=dedupeLexicalEntries(entries);
  const phonemes=new Set(unique.flatMap(entry=>entry.phonemes));
  return {entries:unique.length,phonemes:phonemes.size};
}
