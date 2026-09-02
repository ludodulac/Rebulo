import {normalizeIPA} from './phonetic-engine.js';
import {SPATIAL_RELATIONS} from './rebus-construction.js';

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

export function spatialRelationForIPA(value=''){
  const normalized=normalizeIPA(value);
  return Object.values(SPATIAL_RELATIONS).find(item=>normalizeIPA(item.ipa||'')===normalized)||null;
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
      generated:true,
      frequency:Number(row?.frequency||0),
      operationCount:pieces.length
    });
  }
  return targets;
}

function gapToken(token){return typeof token==='string'&&token.startsWith('[')&&token.endsWith(']');}

function operationFromFrameToken(token,letter){
  if(typeof token!=='string'||!token)return null;
  if(gapToken(token))return {type:'grapheme',grapheme:letter.grapheme,reading:letter.reading};
  return {type:'whole_word',pieceId:token};
}

function spatialOperationFromFrameToken(token,relation){
  if(typeof token!=='string'||!token)return null;
  if(gapToken(token))return {type:'spatial_relation',relation:relation.relation,reading:relation.reading};
  return {type:'whole_word',pieceId:token};
}

function operationSignature(operation={}){
  if(operation.type==='whole_word')return `word:${operation.pieceId||operation.label||''}`;
  if(operation.type==='grapheme')return `grapheme:${operation.grapheme||''}:${operation.reading||''}`;
  if(operation.type==='spatial_relation')return `spatial:${operation.relation||''}:${operation.reading||''}`;
  return `${operation.type||'unknown'}:${JSON.stringify(operation)}`;
}

export function creatorTargetSignature(item={}){
  const mode=item?.mode||'unknown';
  const ipa=normalizeIPA(item?.targetIpa||'');
  if(mode==='strict')return `${mode}|${ipa}`;
  if(Array.isArray(item?.operations)&&item.operations.length){
    return `${mode}|${ipa}|${item.operations.map(operationSignature).join('+')}`;
  }
  return `${mode}|${ipa}|${Number(item?.operationCount||0)}`;
}

function stripAlternatives(item={}){
  const {alternatives,...base}=item||{};
  return base;
}

function frameExamples(report={},resolver,operationBuilder,source){
  const gaps=Array.isArray(report?.missingSounds)?report.missingSounds:[];
  const candidates=[];
  const seen=new Set();
  for(const gap of gaps){
    const resolved=resolver(gap?.ipa||'');
    if(!resolved)continue;
    for(const example of gap?.examples||[]){
      const frame=Array.isArray(example?.frame)?example.frame:[];
      if(!example?.word||!example?.ipa||frame.length<2||frame.length>4)continue;
      if(frame.filter(gapToken).length!==1)continue;
      const operations=frame.map(token=>operationBuilder(token,resolved));
      if(operations.some(operation=>!operation))continue;
      const candidate={
        target:example.word,
        targetIpa:example.ipa,
        mode:'general',
        assets:'ready',
        operations,
        source,
        generated:true,
        frequency:Number(example?.frequency||0),
        operationCount:operations.length
      };
      const key=`${normalizeKey(example.word)}|${creatorTargetSignature(candidate)}`;
      if(!normalizeKey(example.word)||seen.has(key))continue;
      seen.add(key);
      candidates.push(candidate);
    }
  }
  return candidates;
}

export function buildGraphemeCreatorTargets(report={}){
  return frameExamples(report,letterReadingForIPA,operationFromFrameToken,'coverage-report-grapheme');
}

export function buildSpatialCreatorTargets(report={}){
  return frameExamples(report,spatialRelationForIPA,spatialOperationFromFrameToken,'coverage-report-spatial');
}

export function creatorTargetScore(item={}){
  const modeScore=item?.mode==='strict'?300:item?.mode==='general'?200:0;
  const count=Number(item?.operationCount||(Array.isArray(item?.operations)?item.operations.length:0));
  const simplicityScore=count>0?Math.max(0,40-count*10):0;
  const frequencyScore=Math.min(50,Math.log10(Math.max(1,Number(item?.frequency||0)))*10);
  return modeScore+simplicityScore+frequencyScore;
}

export function rankCreatorTargets(items=[]){
  return [...(items||[])].sort((a,b)=>{
    const scoreDiff=creatorTargetScore(b)-creatorTargetScore(a);
    if(scoreDiff)return scoreDiff;
    const operationDiff=Number(a?.operationCount||a?.operations?.length||99)-Number(b?.operationCount||b?.operations?.length||99);
    if(operationDiff)return operationDiff;
    return Number(b?.frequency||0)-Number(a?.frequency||0);
  });
}

export function selectBestGeneratedTargets(items=[]){
  const grouped=new Map();
  for(const item of items||[]){
    const key=normalizeKey(item?.target);
    if(!key)continue;
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(stripAlternatives(item));
  }
  return [...grouped.values()].map(group=>{
    const unique=[];
    const signatures=new Set();
    for(const item of rankCreatorTargets(group)){
      const signature=creatorTargetSignature(item);
      if(signatures.has(signature))continue;
      signatures.add(signature);
      unique.push(item);
    }
    const [primary,...alternatives]=unique;
    if(!primary)return null;
    return alternatives.length?{...primary,alternatives}:{...primary};
  }).filter(Boolean);
}

export function buildAutomaticCreatorTargets(report={}){
  return selectBestGeneratedTargets([
    ...buildCreatorTargets(report),
    ...buildGraphemeCreatorTargets(report),
    ...buildSpatialCreatorTargets(report)
  ]);
}

function mergeAlternativeLists(primary={},generated={}){
  const manualSignature=creatorTargetSignature(primary);
  const candidates=[stripAlternatives(generated),...(generated?.alternatives||[]).map(stripAlternatives),...(primary?.alternatives||[]).map(stripAlternatives)];
  const seen=new Set([manualSignature]);
  const alternatives=[];
  for(const item of rankCreatorTargets(candidates)){
    if(!['strict','general'].includes(item?.mode)||item?.assets!=='ready')continue;
    const signature=creatorTargetSignature(item);
    if(seen.has(signature))continue;
    seen.add(signature);
    alternatives.push(item);
  }
  return alternatives;
}

export function mergeCreatorTargets(manualItems=[],generatedItems=[]){
  const bestGenerated=selectBestGeneratedTargets(generatedItems);
  const generatedByKey=new Map(bestGenerated.filter(item=>normalizeKey(item?.target)).map(item=>[normalizeKey(item.target),item]));
  const mergedManual=(manualItems||[]).map(item=>{
    const generated=generatedByKey.get(normalizeKey(item?.target));
    if(!generated)return item;
    generatedByKey.delete(normalizeKey(item.target));
    if(!['strict','general'].includes(item?.mode)||item?.assets!=='ready')return item;
    let next=item;
    const manualIpa=normalizeIPA(item?.targetIpa||'');
    const generatedIpa=normalizeIPA(generated?.targetIpa||'');
    const canSupplement=item?.mode==='strict'&&generated?.mode==='strict'&&manualIpa&&manualIpa===generatedIpa;
    if(canSupplement){
      const existingCount=validSyllableCount(item?.syllableCount);
      const generatedCount=validSyllableCount(generated?.syllableCount);
      if(!existingCount&&generatedCount){
        next={
          ...item,
          syllableCount:generatedCount,
          therapy:Array.isArray(item?.therapy)&&generated?.therapy?.includes('syllable-count')
            ?addSyllableCountActivity(item.therapy)
            :item?.therapy
        };
      }
    }
    const alternatives=mergeAlternativeLists(next,generated);
    return alternatives.length?{...next,alternatives}:next;
  });
  return [...mergedManual,...rankCreatorTargets([...generatedByKey.values()])];
}
