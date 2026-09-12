import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

function units(value=''){return splitIPAUnits(normalizeIPA(value));}
function eqAt(target,offset,part){if(offset+part.length>target.length)return false;for(let i=0;i<part.length;i++)if(target[offset+i]!==part[i])return false;return true;}
function clamp01(value){return Math.max(0,Math.min(1,Number(value)||0));}

function exactImageOptions(row={}){
  return (row.exactImages||row.exactImageRepresentations||[]).filter(item=>item?.image&&item?.label).map(item=>({
    kind:'image',mode:'strict',phoneticTier:'exact',targetIpa:normalizeIPA(row.ipa),sourceIpa:normalizeIPA(row.ipa),label:item.label,image:item.image,id:item.id||null,source:item.source||'',visualConfidence:item.visualConfidence??null,labelStability:item.labelStability??null
  }));
}
function conventionOptions(row={}){
  const out=[];
  for(const label of row.letters||[]){if(label)out.push({kind:'letter',mode:'general',phoneticTier:'exact_convention',targetIpa:normalizeIPA(row.ipa),sourceIpa:normalizeIPA(row.ipa),label:String(label),symbol:String(label)});}
  for(const label of row.numbers||[]){if(label)out.push({kind:'number',mode:'general',phoneticTier:'exact_convention',targetIpa:normalizeIPA(row.ipa),sourceIpa:normalizeIPA(row.ipa),label:String(label),symbol:String(label)});}
  for(const label of row.musicNotes||[]){if(label)out.push({kind:'music_note',mode:'general',phoneticTier:'exact_convention',targetIpa:normalizeIPA(row.ipa),sourceIpa:normalizeIPA(row.ipa),label:String(label),symbol:String(label)});}
  return out;
}
function approximationOptions(row={}){
  return (row.lightApproximations||row.lightApproximationCandidates||[]).filter(item=>item?.word&&item?.sourceIpa).map(item=>({
    kind:item.image?'image_approximation':'lexical_approximation',mode:'general',phoneticTier:'light_approximation',targetIpa:normalizeIPA(row.ipa),sourceIpa:normalizeIPA(item.sourceIpa),label:item.word,image:item.image||null,editorialApproximationPercent:Number(item.percent??item.editorialApproximationPercent)||null,existingAsset:Boolean(item.existingAsset)
  }));
}

export function representationOptionsFromBankRows(rows=[],{includeLexicalApproximation=false}={}){
  const out=[];
  for(const row of rows||[]){
    if(!row?.ipa)continue;
    out.push(...exactImageOptions(row),...conventionOptions(row));
    for(const option of approximationOptions(row))if(includeLexicalApproximation||option.existingAsset)out.push(option);
  }
  return out;
}

function visualQuality(option={}){
  const values=[option.visualConfidence,option.labelStability].filter(value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value)));
  return values.length?values.reduce((sum,value)=>sum+clamp01(value),0)/values.length:null;
}

function operationPenalty(option={}){
  if(option.kind==='gap')return 0;
  if(option.phoneticTier==='exact'&&option.kind==='image')return 0;
  if(option.phoneticTier==='exact_convention')return 0.18;
  if(option.phoneticTier==='light_approximation')return 0.7+Math.min(0.7,(Number(option.editorialApproximationPercent)||0)/100);
  return 1;
}

function routeRank(route={}){
  const targetUnits=Math.max(1,Number(route.targetUnits)||1);
  const coverage=Number(route.coverageUnits)||0;
  const uncovered=Number(route.uncoveredUnits)||0;
  const pieceCount=(route.operations||[]).filter(item=>item.kind!=='gap').length;
  const qualityValues=(route.operations||[]).map(visualQuality).filter(value=>value!==null);
  const meanVisualQuality=qualityValues.length?qualityValues.reduce((sum,value)=>sum+value,0)/qualityValues.length:0.5;
  const operationPenaltyTotal=(route.operations||[]).reduce((sum,item)=>sum+operationPenalty(item),0);
  // Deliberately transparent ranking: full phonemic coverage dominates, then visual evidence and simplicity.
  const score=coverage*100-uncovered*150+meanVisualQuality*8-pieceCount*1.5-operationPenaltyTotal*8;
  return {score:Number(score.toFixed(4)),coverageRatio:coverage/targetUnits,meanVisualQuality:Number(meanVisualQuality.toFixed(4)),pieceCount,operationPenalty:Number(operationPenaltyTotal.toFixed(4))};
}

function coalesceGaps(operations=[]){
  const out=[];
  for(const operation of operations){
    if(operation.kind!=='gap'){out.push(operation);continue;}
    const previous=out.at(-1);
    if(previous?.kind==='gap'){
      previous.targetIpa=normalizeIPA(previous.targetIpa+operation.targetIpa);
      previous.unitCount+=operation.unitCount;
    }else out.push({...operation});
  }
  return out;
}

function signature(route={}){
  return (route.operations||[]).map(item=>`${item.kind}:${item.targetIpa}:${item.sourceIpa||''}:${item.id||item.label||item.symbol||''}`).join('|');
}
function optionKindRank(kind=''){return kind==='image'?0:kind==='letter'||kind==='number'||kind==='music_note'?1:kind==='image_approximation'?2:3;}
function eligibleOption(option={},mode='general'){return mode==='general'||(mode==='strict'&&option.mode==='strict'&&option.phoneticTier==='exact');}
function sortPreparedOptions(items=[]){items.sort((a,b)=>b._units.length-a._units.length||optionKindRank(a.kind)-optionKindRank(b.kind)||String(a.label).localeCompare(String(b.label),'fr'));return items;}
function indexOptions(items=[]){const byFirstUnit=new Map();for(const option of items){const first=option._units[0];if(!first)continue;const bucket=byFirstUnit.get(first)||[];bucket.push(option);byFirstUnit.set(first,bucket);}for(const bucket of byFirstUnit.values())sortPreparedOptions(bucket);return byFirstUnit;}

export function buildRepresentationPathIndex(bankRows=[],{includeLexicalApproximation=false}={}){
  const prepared=representationOptionsFromBankRows(bankRows,{includeLexicalApproximation}).map(option=>({...option,_units:units(option.targetIpa)})).filter(option=>option._units.length);
  const general=sortPreparedOptions(prepared.filter(option=>eligibleOption(option,'general')));
  const strict=sortPreparedOptions(prepared.filter(option=>eligibleOption(option,'strict')));
  return {kind:'representation_path_index',general:indexOptions(general),strict:indexOptions(strict),optionCount:prepared.length,generalOptionCount:general.length,strictOptionCount:strict.length};
}

function optionBucket(index={},mode='general',firstUnit=''){
  const map=mode==='strict'?index.strict:index.general;
  return map instanceof Map?(map.get(firstUnit)||[]):[];
}

export function planRepresentationPaths(targetIpa='',bankRows=[],{mode='general',limit=10,maxPieces=12,allowGaps=true,optionIndex=null}={}){
  const normalized=normalizeIPA(targetIpa);const target=units(normalized);if(!target.length)return [];
  const index=optionIndex?.kind==='representation_path_index'?optionIndex:buildRepresentationPathIndex(bankRows,{includeLexicalApproximation:false});
  const beamWidth=Math.max(40,limit*20);
  let states=[{offset:0,operations:[],coverageUnits:0,uncoveredUnits:0,pieceCount:0}];
  while(states.length){
    if(states.every(state=>state.offset===target.length))break;
    const next=[];
    for(const state of states){
      if(state.offset===target.length){next.push(state);continue;}
      const options=optionBucket(index,mode,target[state.offset]);
      for(const option of options){
        if(state.pieceCount>=maxPieces||!eqAt(target,state.offset,option._units))continue;
        const {_units,...serializable}=option;
        next.push({offset:state.offset+option._units.length,operations:[...state.operations,serializable],coverageUnits:state.coverageUnits+option._units.length,uncoveredUnits:state.uncoveredUnits,pieceCount:state.pieceCount+1});
      }
      if(allowGaps){
        next.push({offset:state.offset+1,operations:[...state.operations,{kind:'gap',mode:'uncovered',phoneticTier:'uncovered',targetIpa:target[state.offset],sourceIpa:'',label:'',unitCount:1}],coverageUnits:state.coverageUnits,uncoveredUnits:state.uncoveredUnits+1,pieceCount:state.pieceCount});
      }
    }
    const scored=next.map(state=>{const operations=coalesceGaps(state.operations);const ranked=routeRank({operations,targetUnits:target.length,coverageUnits:state.coverageUnits,uncoveredUnits:state.uncoveredUnits});return {...state,operations,...ranked};});
    scored.sort((a,b)=>b.score-a.score||a.uncoveredUnits-b.uncoveredUnits||a.pieceCount-b.pieceCount||signature(a).localeCompare(signature(b),'fr'));
    const dedupe=new Set();states=[];
    for(const state of scored){const key=`${state.offset}:${signature(state)}`;if(dedupe.has(key))continue;dedupe.add(key);states.push(state);if(states.length>=beamWidth)break;}
  }
  const routes=states.filter(state=>state.offset===target.length).map(state=>{
    const operations=coalesceGaps(state.operations);const ranked=routeRank({operations,targetUnits:target.length,coverageUnits:state.coverageUnits,uncoveredUnits:state.uncoveredUnits});
    return {targetIpa:normalized,targetUnits:target.length,coverageUnits:state.coverageUnits,uncoveredUnits:state.uncoveredUnits,complete:state.uncoveredUnits===0,exact:state.uncoveredUnits===0&&operations.every(item=>item.phoneticTier==='exact'),mode,operations,scoreBreakdown:{coverageRatio:Number(ranked.coverageRatio.toFixed(4)),uncoveredUnits:state.uncoveredUnits,pieceCount:ranked.pieceCount,meanVisualQuality:ranked.meanVisualQuality,operationPenalty:ranked.operationPenalty},score:ranked.score};
  });
  routes.sort((a,b)=>Number(b.complete)-Number(a.complete)||b.coverageUnits-a.coverageUnits||Number(b.exact)-Number(a.exact)||b.score-a.score||a.operations.length-b.operations.length||signature(a).localeCompare(signature(b),'fr'));
  const seen=new Set();const out=[];for(const route of routes){const key=signature(route);if(seen.has(key))continue;seen.add(key);out.push(route);if(out.length>=limit)break;}return out;
}
