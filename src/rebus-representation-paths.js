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
  const values=[option.visualConfidence,option.labelStability].filter(value=>Number.isFinite(Number(value)));
  return values.length?values.reduce((sum,value)=>sum+clamp01(value),0)/values.length:null;
}

function operationPenalty(option={}){
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
  // Ranking components are intentionally simple and exposed. Coverage dominates; visual clarity and simplicity break ties.
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

export function planRepresentationPaths(targetIpa='',bankRows=[],{mode='general',limit=10,maxPieces=12,allowGaps=true}={}){
  const normalized=normalizeIPA(targetIpa);const target=units(normalized);if(!target.length)return [];
  const rawOptions=representationOptionsFromBankRows(bankRows,{includeLexicalApproximation:false});
  const options=rawOptions.map(option=>({...option,_units:units(option.targetIpa)})).filter(option=>option._units.length&&((mode==='strict'&&option.mode==='strict'&&option.phoneticTier==='exact')||mode==='general'));
  options.sort((a,b)=>b._units.length-a._units.length||(a.kind==='image'?-1:1)||String(a.label).localeCompare(String(b.label),'fr'));
  const beamWidth=Math.max(40,limit*20);
  let states=[{offset:0,operations:[],coverageUnits:0,uncoveredUnits:0,pieceCount:0}];
  while(states.length){
    const completed=states.filter(state=>state.offset===target.length);
    if(completed.length===states.length)break;
    const next=[];
    for(const state of states){
      if(state.offset===target.length){next.push(state);continue;}
      for(const option of options){
        if(state.pieceCount>=maxPieces||!eqAt(target,state.offset,option._units))continue;
        next.push({offset:state.offset+option._units.length,operations:[...state.operations,{...option,_units:undefined}],coverageUnits:state.coverageUnits+option._units.length,uncoveredUnits:state.uncoveredUnits,pieceCount:state.pieceCount+1});
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
