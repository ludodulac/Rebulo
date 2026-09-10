import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

function schemaIndex(catalog={}){
  return Object.fromEntries((catalog.rowSchema||[]).map((name,index)=>[name,index]));
}

function decodeRepresentation(tuple=[]){
  return {
    id:tuple[0]||null,
    label:tuple[1]||'',
    kind:tuple[2]||'',
    tier:tuple[3]||'',
    source:tuple[4]||'',
    image:tuple[5]||null,
    match:tuple[6]||null,
    distance:tuple[7]||null,
    strictEligible:tuple[8]===false?false:true,
    researchDecision:tuple[9]||null
  };
}

export function decodeSoundCatalog(catalog={}){
  const indexes=schemaIndex(catalog);
  const required=['ipa','syllableSpans','occurrenceCount','usefulTargetCount','usefulWeightedGain','researchState','researchPriorityScore','exactImageReadyCount','exactImageResearchCount','visibleConventionCount','approximationCount','exactLexicalCandidateCount','nounLexicalCandidateCount','exactLexicalCandidates','nounLexicalCandidates','representations','usefulExamples'];
  if(required.some(name=>!(name in indexes)))throw new Error('sound catalog is missing representation-bank columns');
  return (catalog.soundRows||[]).map(tuple=>({
    ipa:normalizeIPA(tuple[indexes.ipa]),
    syllableSpans:tuple[indexes.syllableSpans]||[],
    occurrenceCount:Number(tuple[indexes.occurrenceCount])||0,
    usefulOccurrenceCount:Number(tuple[indexes.usefulOccurrenceCount])||0,
    usefulTargetCount:Number(tuple[indexes.usefulTargetCount])||0,
    usefulWeightedGain:Number(tuple[indexes.usefulWeightedGain])||0,
    schoolTargetCount:Number(tuple[indexes.schoolTargetCount])||0,
    minAgeBandCandidate:tuple[indexes.minAgeBandCandidate]??null,
    researchState:tuple[indexes.researchState]||'unresolved',
    researchPriorityScore:Number(tuple[indexes.researchPriorityScore])||0,
    exactImageReadyCount:Number(tuple[indexes.exactImageReadyCount])||0,
    exactImageResearchCount:Number(tuple[indexes.exactImageResearchCount])||0,
    visibleConventionCount:Number(tuple[indexes.visibleConventionCount])||0,
    approximationCount:Number(tuple[indexes.approximationCount])||0,
    exactLexicalCandidateCount:Number(tuple[indexes.exactLexicalCandidateCount])||0,
    nounLexicalCandidateCount:Number(tuple[indexes.nounLexicalCandidateCount])||0,
    examples:tuple[indexes.examples]||[],
    usefulExamples:tuple[indexes.usefulExamples]||[],
    exactLexicalCandidates:(tuple[indexes.exactLexicalCandidates]||[]).map(candidate=>({word:candidate?.[0]||'',pos:candidate?.[1]||'',frequency:Number(candidate?.[2])||0,syllableCount:candidate?.[3]??null})),
    nounLexicalCandidates:(tuple[indexes.nounLexicalCandidates]||[]).map(candidate=>({word:candidate?.[0]||'',pos:candidate?.[1]||'',frequency:Number(candidate?.[2])||0,syllableCount:candidate?.[3]??null})),
    representations:(tuple[indexes.representations]||[]).map(decodeRepresentation)
  })).filter(row=>row.ipa);
}

export function readyImagePieces(rows=[]){
  const byIpa=new Map();
  for(const row of rows||[]){
    const reps=(row.representations||[]).filter(item=>item.tier==='exact_image_ready'&&item.image);
    if(!reps.length)continue;
    byIpa.set(row.ipa,reps.map(item=>({ipa:row.ipa,id:item.id,label:item.label,image:item.image,source:item.source,strictEligible:item.strictEligible!==false})));
  }
  return byIpa;
}

function unitsKey(units=[]){return units.join('\u0001');}

export function findExactImageCombinations(targetIpa='',pieceIndex=new Map(),{minPieces=2,maxPieces=3,limit=5}={}){
  const target=splitIPAUnits(normalizeIPA(targetIpa));
  if(!target.length)return [];
  const candidates=[];
  for(const [ipa,reps] of pieceIndex.entries()){
    const units=splitIPAUnits(ipa);
    if(!units.length||!reps?.length)continue;
    candidates.push({ipa,units,reps});
  }
  candidates.sort((a,b)=>b.units.length-a.units.length||a.ipa.localeCompare(b.ipa));
  const memo=new Map();
  function search(offset,piecesLeft){
    const key=`${offset}|${piecesLeft}`;
    if(memo.has(key))return memo.get(key);
    if(offset===target.length)return [[]];
    if(piecesLeft===0)return [];
    const out=[];
    for(const candidate of candidates){
      if(offset+candidate.units.length>target.length)continue;
      let match=true;
      for(let i=0;i<candidate.units.length;i++)if(candidate.units[i]!==target[offset+i]){match=false;break;}
      if(!match)continue;
      for(const tail of search(offset+candidate.units.length,piecesLeft-1)){
        for(const rep of candidate.reps.slice(0,2)){
          out.push([{ipa:candidate.ipa,id:rep.id,label:rep.label,image:rep.image,source:rep.source},...tail]);
          if(out.length>=limit*2)break;
        }
        if(out.length>=limit*2)break;
      }
      if(out.length>=limit*2)break;
    }
    memo.set(key,out);
    return out;
  }
  const seen=new Set();const results=[];
  for(const route of search(0,maxPieces)){
    if(route.length<minPieces||route.length>maxPieces)continue;
    const signature=route.map(piece=>`${piece.ipa}:${piece.id||piece.label}`).join('+');
    if(seen.has(signature))continue;
    seen.add(signature);results.push(route);
    if(results.length>=limit)break;
  }
  return results;
}

export function approximationBySound(report={}){
  return new Map((report.rows||[]).map(row=>[normalizeIPA(row.ipa),row]));
}

function visualCurationSets(catalog={}){
  const prototype=new Set((catalog.visualCuration?.curatedPrototypeQueue||[]).map(item=>normalizeIPA(item.ipa)).filter(Boolean));
  const excluded=new Set((catalog.visualCuration?.excludedAutomaticImageRoutes||[]).map(item=>normalizeIPA(item.ipa)).filter(Boolean));
  return {prototype,excluded};
}

export function classifyRepresentationBank(catalog={},approximationReport={}){
  const rows=decodeSoundCatalog(catalog);
  const pieceIndex=readyImagePieces(rows);
  const approximation=approximationBySound(approximationReport);
  const curation=visualCurationSets(catalog);
  return rows.map(row=>{
    const letterRepresentations=row.representations.filter(item=>item.kind==='letter_name');
    const numberRepresentations=row.representations.filter(item=>item.kind==='number_symbol');
    const musicRepresentations=row.representations.filter(item=>item.kind==='music_note'||item.kind==='music_note_tile');
    const exactImageRepresentations=row.representations.filter(item=>item.tier==='exact_image_ready');
    const combinations=findExactImageCombinations(row.ipa,pieceIndex,{minPieces:2,maxPieces:3,limit:3});
    const approx=approximation.get(row.ipa)||null;
    const lightApproximationCandidates=(approx?.candidates||[]).filter(candidate=>candidate.tier==='light');
    const lightExistingAssetCandidates=lightApproximationCandidates.filter(candidate=>candidate.existingAsset);
    const hasCuratedPrototype=curation.prototype.has(row.ipa);
    const exactLexicalOnly=row.exactLexicalCandidateCount>0&&row.exactImageReadyCount===0&&!hasCuratedPrototype;
    const reasonableNow=exactImageRepresentations.length>0||combinations.length>0||letterRepresentations.length>0||numberRepresentations.length>0||musicRepresentations.length>0||hasCuratedPrototype||lightExistingAssetCandidates.length>0;
    return {
      ...row,
      categories:{
        A_exactFrenchWord:row.exactLexicalCandidateCount>0,
        B_multipleExactFrenchWords:row.exactLexicalCandidateCount>1,
        C_exactWordVisualNotReady:exactLexicalOnly,
        D_obviousOrReadyPictogram:exactImageRepresentations.length>0,
        E_lightApproximation:lightApproximationCandidates.length>0,
        F_exactMultiPictogram:combinations.length>0,
        G_letter:letterRepresentations.length>0,
        H_number:numberRepresentations.length>0,
        I_noCurrentReasonableRepresentation:!reasonableNow
      },
      visualStatus:exactImageRepresentations.length?'ready_image':hasCuratedPrototype?'curated_prototype':curation.excluded.has(row.ipa)?'reviewed_bad_or_deferred':row.exactLexicalCandidateCount>0?'exact_word_unreviewed':'no_exact_visual_lead',
      exactImageRepresentations,
      exactImageCombinations:combinations,
      letterRepresentations,
      numberRepresentations,
      musicRepresentations,
      lightApproximationCandidates:lightApproximationCandidates.slice(0,5),
      lightExistingAssetCandidates:lightExistingAssetCandidates.slice(0,5)
    };
  });
}

export function representationBankStats(rows=[]){
  const useful=rows.filter(row=>row.usefulTargetCount>0);
  const count=(items,key)=>items.filter(row=>row.categories?.[key]).length;
  const summarize=items=>({
    soundCount:items.length,
    A_exactFrenchWord:count(items,'A_exactFrenchWord'),
    B_multipleExactFrenchWords:count(items,'B_multipleExactFrenchWords'),
    C_exactWordVisualNotReady:count(items,'C_exactWordVisualNotReady'),
    D_obviousOrReadyPictogram:count(items,'D_obviousOrReadyPictogram'),
    E_lightApproximation:count(items,'E_lightApproximation'),
    F_exactMultiPictogram:count(items,'F_exactMultiPictogram'),
    G_letter:count(items,'G_letter'),
    H_number:count(items,'H_number'),
    I_noCurrentReasonableRepresentation:count(items,'I_noCurrentReasonableRepresentation')
  });
  return {all:summarize(rows),useful:summarize(useful)};
}
