import {normalizeIPA} from './phonetic-engine.js';

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

function validSyllableCount(value){
  return Number.isInteger(value)&&value>0?value:null;
}

function addSyllableCountActivity(therapy=[]){
  if(!Array.isArray(therapy)||therapy.includes('syllable-count'))return therapy;
  const next=[...therapy];
  const before=next.indexOf('syllable-blending');
  if(before>=0)next.splice(before,0,'syllable-count');
  else next.push('syllable-count');
  return next;
}

export function buildCreatorTargets(report={}){
  const rows=Array.isArray(report?.constructible)?report.constructible:[];
  const ordered=[...rows].sort((a,b)=>Number(b?.frequency||0)-Number(a?.frequency||0));
  const seen=new Set();
  const targets=[];
  for(const row of ordered){
    const pieces=Array.isArray(row?.decomposition)?row.decomposition:[];
    if(!row?.word||!row?.ipa||pieces.length<2||pieces.length>4)continue;
    const key=normalizeKey(row.word);
    if(!key||seen.has(key))continue;
    seen.add(key);
    const syllableCount=validSyllableCount(row.syllableCount);
    const therapy=['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending'];
    if(syllableCount)therapy.push('syllable-count');
    therapy.push('syllable-blending','oral-to-written');
    targets.push({
      target:row.word,
      targetIpa:row.ipa,
      syllableCount,
      mode:'strict',
      assets:'ready',
      therapy,
      source:'coverage-report',
      generated:true
    });
  }
  return targets;
}

export function mergeCreatorTargets(manualItems=[],generatedItems=[]){
  const generatedByKey=new Map((generatedItems||[]).filter(item=>normalizeKey(item?.target)).map(item=>[normalizeKey(item.target),item]));
  const mergedManual=(manualItems||[]).map(item=>{
    const generated=generatedByKey.get(normalizeKey(item?.target));
    if(!generated)return item;
    generatedByKey.delete(normalizeKey(item.target));
    const manualIpa=normalizeIPA(item?.targetIpa||'');
    const generatedIpa=normalizeIPA(generated?.targetIpa||'');
    const canSupplement=item?.mode==='strict'&&generated?.mode==='strict'&&manualIpa&&manualIpa===generatedIpa;
    if(!canSupplement)return item;
    const existingCount=validSyllableCount(item?.syllableCount);
    const generatedCount=validSyllableCount(generated?.syllableCount);
    if(existingCount||!generatedCount)return item;
    return {
      ...item,
      syllableCount:generatedCount,
      therapy:Array.isArray(item?.therapy)&&generated?.therapy?.includes('syllable-count')
        ?addSyllableCountActivity(item.therapy)
        :item?.therapy
    };
  });
  return [...mergedManual,...generatedByKey.values()];
}
