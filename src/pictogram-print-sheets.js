import {OPEN_PICTOGRAMS,OPENMOJI_SOURCE} from './open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from './open-pictogram-library-wave2.js';

export const PICTOGRAMS_PER_PRINT_PAGE=20;
export const PRINT_COLUMNS=4;
export const PRINT_ROWS=5;
export const ALL_OPEN_PICTOGRAMS=Object.freeze([...OPEN_PICTOGRAMS,...OPEN_PICTOGRAMS_WAVE_2]);

export function pictogramIndexId(item={}){
  const id=String(item?.id||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return id?`RBL-${id}`:'';
}

export function indexedPictogram(item={}){
  return {
    indexId:pictogramIndexId(item),
    id:item.id||'',
    label:item.label||'',
    ipa:item.ipa||'',
    image:item.image||'',
    assetSource:item.assetSource||'',
    sourceFile:item.sourceFile||'',
    sourceCommit:item.sourceCommit||'',
    sourceLicense:item.sourceLicense||'',
    strictEligible:item.strictEligible!==false,
    clinicalStatus:item.clinicalStatus||''
  };
}

export function buildIndexedPictograms(items=ALL_OPEN_PICTOGRAMS){
  const seen=new Set();
  return (items||[]).map(indexedPictogram).filter(item=>{
    if(!item.indexId||seen.has(item.indexId))return false;
    seen.add(item.indexId);
    return true;
  });
}

export function paginatePictograms(items=ALL_OPEN_PICTOGRAMS,perPage=PICTOGRAMS_PER_PRINT_PAGE){
  const indexed=buildIndexedPictograms(items);
  const size=Math.max(1,Number(perPage)||PICTOGRAMS_PER_PRINT_PAGE);
  const pages=[];
  for(let i=0;i<indexed.length;i+=size)pages.push(indexed.slice(i,i+size));
  return pages;
}

export function buildPrintSheetPairs(items=ALL_OPEN_PICTOGRAMS){
  const pages=paginatePictograms(items);
  const out=[];
  pages.forEach((entries,index)=>{
    const lot=String(index+1).padStart(3,'0');
    out.push({kind:'reference',lot,page:index+1,entries});
    out.push({kind:'drawing',lot,page:index+1,entries});
  });
  return out;
}

function csvCell(value=''){
  const text=String(value??'');
  return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}

export function pictogramIndexCsv(items=ALL_OPEN_PICTOGRAMS){
  const header=['index_id','id','label','ipa','image','asset_source','source_file','source_commit','source_license','strict_eligible','clinical_status'];
  const rows=buildIndexedPictograms(items).map(item=>[
    item.indexId,item.id,item.label,item.ipa,item.image,item.assetSource,item.sourceFile,item.sourceCommit,item.sourceLicense,item.strictEligible,item.clinicalStatus
  ]);
  return [header,...rows].map(row=>row.map(csvCell).join(',')).join('\n');
}

export function printLibraryMeta(items=ALL_OPEN_PICTOGRAMS){
  const indexed=buildIndexedPictograms(items);
  return {count:indexed.length,pages:Math.ceil(indexed.length/PICTOGRAMS_PER_PRINT_PAGE),source:OPENMOJI_SOURCE.project,license:OPENMOJI_SOURCE.license,commit:OPENMOJI_SOURCE.sourceCommit};
}
