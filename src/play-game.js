import {normalizeIPA,validateStrictRebus} from './phonetic-engine.js';

export function normalizePlayAnswer(value=''){
  return String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'');
}

export function playRoundPhoneticStatus(rebus={}){
  const validation=String(rebus?.validation||'');
  if(validation==='strict')return 'exact_phonetic';
  if(validation==='exact_visible_convention'||validation==='exact_with_visible_convention')return 'exact_visible_convention';
  if(validation==='variant_documented'||validation==='variant_explicit')return 'variant_explicit';
  if(validation==='playful_approximation'||validation==='playful_near')return 'playful_approximation';
  return 'unclassified';
}

export function provePlayRound(rebus={}){
  const phonetic=validateStrictRebus(rebus);
  const status=playRoundPhoneticStatus(rebus);
  const exactClaim=status==='exact_phonetic'||status==='exact_visible_convention';
  return {
    ok:exactClaim&&phonetic.ok,
    exact:phonetic.ok,
    status,
    exactClaim,
    builtIpa:normalizeIPA(phonetic.builtIpa||''),
    targetIpa:normalizeIPA(phonetic.targetIpa||''),
    reason:!exactClaim?'non_exact_round_not_playable':phonetic.reason
  };
}

export function assertExactPlayableRounds(catalog=[],context='play catalog'){
  const invalid=[];
  for(const item of catalog||[]){
    const proof=provePlayRound(item);
    if(!proof.ok)invalid.push({id:item?.id||null,answer:item?.answer||null,...proof});
  }
  if(invalid.length){
    const error=new Error(`${context}: ${invalid.length} round(s) sans preuve phonétique exacte`);
    error.code='REBULO_PLAY_PHONETIC_INVARIANT';
    error.invalidRounds=invalid;
    throw error;
  }
  return true;
}

export function playableRebuses(catalog=[]){
  return (catalog||[]).filter(item=>
    item&&
    provePlayRound(item).ok&&
    typeof item.answer==='string'&&
    item.answer.trim()&&
    Array.isArray(item.pieces)&&
    item.pieces.length>0&&
    item.pieces.every(piece=>piece&&(
      (piece.kind&&piece.kind!=='image')||
      (typeof piece.image==='string'&&piece.image.trim())
    ))
  );
}

export function choosePlayableRebus(catalog=[],previousId=null,random=Math.random){
  const pool=playableRebuses(catalog);
  if(!pool.length)return null;
  const showcase=pool.filter(item=>item.presentationStatus==='showcase');
  const sample=Number(random?.());
  const safe=Number.isFinite(sample)?Math.min(0.999999,Math.max(0,sample)):0;
  const preferShowcase=showcase.length>0&&safe<0.8;
  const preferredPool=preferShowcase?showcase:pool;
  const alternatives=previousId&&preferredPool.length>1?preferredPool.filter(item=>item.id!==previousId):preferredPool;
  const source=alternatives.length?alternatives:preferredPool;
  const scaled=preferShowcase?safe/0.8:(safe-0.8)/0.2;
  const position=preferShowcase?scaled:(showcase.length?safe>=0.8?scaled:safe:safe);
  const index=Math.floor(Math.min(0.999999,Math.max(0,Number.isFinite(position)?position:0))*source.length);
  return source[index]||source[0];
}

export function playAnswerMatches(value,rebus){
  const typed=normalizePlayAnswer(value);
  if(!typed)return false;
  const forms=[rebus?.answer,...(Array.isArray(rebus?.acceptedAnswers)?rebus.acceptedAnswers:[])];
  return forms.some(form=>normalizePlayAnswer(form)===typed);
}

export function safePlayHint(rebus){
  const answer=String(rebus?.answer||'').trim();
  if(!answer)return '';
  const letters=[...answer.normalize('NFC')].filter(char=>/[\p{L}\p{N}]/u.test(char));
  const first=letters[0]?.toLocaleUpperCase('fr-FR')||'';
  const count=letters.length;
  return `Le mot commence par ${first} et contient ${count} lettre${count>1?'s':''}.`;
}
