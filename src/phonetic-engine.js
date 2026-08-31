export function normalizeIPA(value=''){
  return String(value)
    .replace(/[\/\[\]\s.‿]/g,'')
    .normalize('NFC');
}

export function concatenateIPA(pieces=[]){
  return pieces.map(piece=>normalizeIPA(piece.ipa)).join('');
}

export function validateStrictRebus(rebus){
  const built=concatenateIPA(rebus.pieces||[]);
  const target=normalizeIPA(rebus.targetIpa||'');
  const ok=Boolean(target)&&built===target;
  return {
    ok,
    mode:'strict',
    builtIpa:built,
    targetIpa:target,
    reason:ok?'exact_phoneme_match':'phoneme_mismatch'
  };
}

export function validateLabelPolicy(piece){
  const forbidden=piece?.allowedPartialReading===true || piece?.hiddenDeletion===true;
  return {
    ok:!forbidden,
    reason:forbidden?'implicit_partial_reading_forbidden':'whole_label_only'
  };
}

export function validateClinicalCandidate(rebus){
  const labelChecks=(rebus.pieces||[]).map(validateLabelPolicy);
  const labelsOk=labelChecks.every(result=>result.ok);
  const phonology=validateStrictRebus(rebus);
  const clinicalStatus=rebus.clinicalStatus||'experimental';
  return {
    ok:labelsOk&&phonology.ok,
    labelsOk,
    labelChecks,
    phonology,
    clinicalStatus,
    publishable:labelsOk&&phonology.ok&&clinicalStatus==='validated'
  };
}

export function segmentTargetWithLexicon(targetIpa,lexicon,maxPieces=4){
  const target=normalizeIPA(targetIpa);
  const items=(lexicon||[])
    .filter(item=>item.active!==false&&item.ipa&&item.label)
    .map(item=>({...item,normalizedIPA:normalizeIPA(item.ipa)}))
    .filter(item=>item.normalizedIPA.length>0);

  const results=[];
  function walk(offset,path){
    if(offset===target.length){
      results.push(path);
      return;
    }
    if(path.length>=maxPieces)return;
    for(const item of items){
      if(target.startsWith(item.normalizedIPA,offset)){
        walk(offset+item.normalizedIPA.length,[...path,item]);
      }
    }
  }
  walk(0,[]);
  return results;
}

export function rankDecompositions(decompositions=[]){
  return [...decompositions].sort((a,b)=>{
    const score=path=>path.reduce((sum,item)=>sum+(item.visualConfidence??0.5)+(item.labelStability??0.5),0)-path.length*0.15;
    return score(b)-score(a);
  });
}
