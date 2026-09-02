import {splitIPAUnits,normalizeIPA} from './phonetic-engine.js';
import {ALL_OPEN_PICTOGRAMS,pictogramIndexId} from './pictogram-print-sheets.js';

export const PHONOLOGY_POSITIONS=Object.freeze(['any','initial','medial','final']);

export function phonemePosition(ipa='',phoneme=''){
  const units=splitIPAUnits(ipa);
  const target=normalizeIPA(phoneme);
  const indexes=[];
  units.forEach((unit,index)=>{if(normalizeIPA(unit)===target)indexes.push(index);});
  if(!indexes.length)return [];
  const out=new Set();
  for(const index of indexes){
    if(index===0)out.add('initial');
    if(index===units.length-1)out.add('final');
    if(index>0&&index<units.length-1)out.add('medial');
  }
  return [...out];
}

export function atlasEntry(item={}){
  const phonemes=splitIPAUnits(item.ipa||'');
  return {
    indexId:pictogramIndexId(item),id:item.id||'',label:item.label||'',ipa:normalizeIPA(item.ipa||''),
    displayIpa:item.ipa||'',phonemes,image:item.image||'',strictEligible:item.strictEligible!==false,
    clinicalStatus:item.clinicalStatus||'unreviewed',syllableCount:Number.isInteger(item.syllableCount)?item.syllableCount:null,
    soundUnit:Number.isInteger(item.syllableCount)?'syllable_evidenced':'whole_word_block'
  };
}

export function buildPhonologyAtlas(items=ALL_OPEN_PICTOGRAMS){
  return (items||[]).filter(item=>item?.label&&item?.ipa&&item?.image).map(atlasEntry);
}

export function availablePhonemes(items=ALL_OPEN_PICTOGRAMS){
  const counts=new Map();
  for(const entry of buildPhonologyAtlas(items)){
    for(const unit of new Set(entry.phonemes))counts.set(unit,(counts.get(unit)||0)+1);
  }
  return [...counts.entries()].map(([phoneme,count])=>({phoneme,count})).sort((a,b)=>b.count-a.count||a.phoneme.localeCompare(b.phoneme));
}

export function filterAtlas({items=ALL_OPEN_PICTOGRAMS,phoneme='',position='any',strictOnly=false,query=''}={}){
  const target=normalizeIPA(phoneme);
  const q=String(query||'').trim().toLocaleLowerCase('fr');
  return buildPhonologyAtlas(items).filter(entry=>{
    if(strictOnly&&entry.strictEligible===false)return false;
    if(q&&!`${entry.label} ${entry.indexId} ${entry.ipa}`.toLocaleLowerCase('fr').includes(q))return false;
    if(!target)return true;
    const positions=phonemePosition(entry.ipa,target);
    return position==='any'?positions.length>0:positions.includes(position);
  });
}

export function groupByWholeSound(items=ALL_OPEN_PICTOGRAMS){
  const groups=new Map();
  for(const entry of buildPhonologyAtlas(items)){
    if(!groups.has(entry.ipa))groups.set(entry.ipa,[]);
    groups.get(entry.ipa).push(entry);
  }
  return [...groups.entries()].map(([ipa,entries])=>({ipa,entries,count:entries.length})).sort((a,b)=>b.count-a.count||a.ipa.localeCompare(b.ipa));
}

export function atlasStats(items=ALL_OPEN_PICTOGRAMS){
  const entries=buildPhonologyAtlas(items);
  return {
    entries:entries.length,
    strictEligible:entries.filter(item=>item.strictEligible).length,
    wholeSoundBlocks:new Set(entries.map(item=>item.ipa)).size,
    phonemes:availablePhonemes(items).length,
    syllableEvidenced:entries.filter(item=>item.soundUnit==='syllable_evidenced').length
  };
}
