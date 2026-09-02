export function normalizePlayAnswer(value=''){
  return String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'');
}

export function playableRebuses(catalog=[]){
  return (catalog||[]).filter(item=>
    item&&
    item.validation==='strict'&&
    typeof item.answer==='string'&&
    item.answer.trim()&&
    Array.isArray(item.pieces)&&
    item.pieces.length>0&&
    item.pieces.every(piece=>piece&&typeof piece.image==='string'&&piece.image.trim())
  );
}

export function choosePlayableRebus(catalog=[],previousId=null,random=Math.random){
  const pool=playableRebuses(catalog);
  if(!pool.length)return null;
  const alternatives=previousId&&pool.length>1?pool.filter(item=>item.id!==previousId):pool;
  const source=alternatives.length?alternatives:pool;
  const sample=Number(random?.());
  const safe=Number.isFinite(sample)?Math.min(0.999999,Math.max(0,sample)):0;
  return source[Math.floor(safe*source.length)]||source[0];
}

export function playAnswerMatches(value,rebus){
  const expected=normalizePlayAnswer(rebus?.answer||'');
  return Boolean(expected)&&normalizePlayAnswer(value)===expected;
}

export function safePlayHint(rebus){
  const answer=String(rebus?.answer||'').trim();
  if(!answer)return '';
  const letters=[...answer.normalize('NFC')].filter(char=>/[\p{L}\p{N}]/u.test(char));
  const first=letters[0]?.toLocaleUpperCase('fr-FR')||'';
  const count=letters.length;
  return `Le mot commence par ${first} et contient ${count} lettre${count>1?'s':''}.`;
}
