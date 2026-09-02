export function normalizeSessionAnswer(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function sessionAnswerMatches(value,item={}){
  const expected=normalizeSessionAnswer(item?.answer||'');
  return Boolean(expected)&&normalizeSessionAnswer(value)===expected;
}

export function safeSessionHint(item={}){
  const answer=String(item?.answer||'').trim();
  const letters=[...answer.normalize('NFC')].filter(char=>/[\p{L}\p{N}]/u.test(char));
  if(!letters.length)return '';
  const first=letters[0].toLocaleUpperCase('fr-FR');
  return `Le mot commence par ${first} et contient ${letters.length} lettre${letters.length>1?'s':''}.`;
}

export function buildSessionSummary(results=[]){
  const total=(results||[]).length;
  const correct=(results||[]).filter(result=>result?.correct).length;
  const hints=(results||[]).filter(result=>result?.hintUsed).length;
  const solutions=(results||[]).filter(result=>result?.solutionUsed).length;
  return {total,correct,hints,solutions};
}

export function sessionProgress(index=0,total=0){
  const safeTotal=Math.max(0,Number(total)||0);
  if(!safeTotal)return {step:0,total:0,percent:0};
  const step=Math.min(safeTotal,Math.max(1,(Number(index)||0)+1));
  return {step,total:safeTotal,percent:Math.round(step/safeTotal*100)};
}
