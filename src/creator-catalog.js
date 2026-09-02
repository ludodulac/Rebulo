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

const FRENCH_LETTER_READINGS=Object.freeze([
  {grapheme:'A',reading:'a',ipa:'/a/'},
  {grapheme:'B',reading:'bé',ipa:'/be/'},
  {grapheme:'C',reading:'cé',ipa:'/se/'},
  {grapheme:'D',reading:'dé',ipa:'/de/'},
  {grapheme:'F',reading:'effe',ipa:'/ɛf/'},
  {grapheme:'G',reading:'gé',ipa:'/ʒe/'},
  {grapheme:'H',reading:'hache',ipa:'/aʃ/'},
  {grapheme:'I',reading:'i',ipa:'/i/'},
  {grapheme:'J',reading:'ji',ipa:'/ʒi/'},
  {grapheme:'K',reading:'ka',ipa:'/ka/'},
  {grapheme:'L',reading:'elle',ipa:'/ɛl/'},
  {grapheme:'M',reading:'aime',ipa:'/ɛm/'},
  {grapheme:'N',reading:'haine',ipa:'/ɛn/'},
  {grapheme:'O',reading:'o',ipa:'/o/'},
  {grapheme:'P',reading:'pé',ipa:'/pe/'},
  {grapheme:'Q',reading:'cu',ipa:'/ky/'},
  {grapheme:'R',reading:'air',ipa:'/ɛʁ/'},
  {grapheme:'S',reading:'esse',ipa:'/ɛs/'},
  {grapheme:'T',reading:'té',ipa:'/te/'},
  {grapheme:'U',reading:'u',ipa:'/y/'},
  {grapheme:'V',reading:'vé',ipa:'/ve/'},
  {grapheme:'X',reading:'ix',ipa:'/iks/'},
  {grapheme:'Z',reading:'zède',ipa:'/zɛd/'}
]);

export function letterReadingForIPA(value=''){
  const normalized=normalizeIPA(value);
  return FRENCH_LETTER_READINGS.find(item=>normalizeIPA(item.ipa)===normalized)||null;
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

function operationFromFrameToken(token,letter){
  if(typeof token!=='string'||!token)return null;
  if(token.startsWith('[')&&token.endsWith(']')){
    return {type:'grapheme',grapheme:letter.grapheme,reading:letter.reading};
  }
  return {type:'whole_word',pieceId:token};
}

export function buildGraphemeCreatorTargets(report={}){
  const gaps=Array.isArray(report?.missingSounds)?report.missingSounds:[];
  const candidates=[];
  const seen=new Set();
  for(const gap of gaps){
    const letter=letterReadingForIPA(gap?.ipa||'');
    if(!letter)continue;
    for(const example of gap?.examples||[]){
      const frame=Array.isArray(example?.frame)?example.frame:[];
      if(!example?.word||!example?.ipa||frame.length<2||frame.length>4)continue;
      if(frame.filter(token=>typeof token==='string'&&token.startsWith('[')&&token.endsWith(']')).length!==1)continue;
      const key=normalizeKey(example.word);
      if(!key||seen.has(key))continue;
      const operations=frame.map(token=>operationFromFrameToken(token,letter));
      if(operations.some(operation=>!operation))continue;
      seen.add(key);
      candidates.push({
        target:example.word,
        targetIpa:example.ipa,
        mode:'general',
        assets:'ready',
        operations,
        source:'coverage-report-grapheme',
        generated:true
      });
    }
  }
  return candidates;
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
