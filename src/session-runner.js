export function normalizeSessionAnswer(value=''){
  return String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0302\u0308\u0327]/g,'')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu,'');
}

function scalarExpectedResponse(activity={}){
  const value=activity?.expectedResponse;
  return ['string','number'].includes(typeof value)?String(value).trim():'';
}

function sequenceExpectedResponse(activity={}){
  return Array.isArray(activity?.expectedResponse)
    ?activity.expectedResponse.map(unit=>String(unit||'').trim()).filter(Boolean)
    :[];
}

function normalizeSessionSequence(value=''){
  const raw=String(value||'').trim();
  const slashUnits=[...raw.matchAll(/\/([^/]+)\//g)].map(match=>normalizeSessionAnswer(match[1])).filter(Boolean);
  if(slashUnits.length>=2)return slashUnits;
  return raw.split(/(?:\s*\+\s*|[.,;·‧-]|\s+)/u).map(normalizeSessionAnswer).filter(Boolean);
}

export function sessionExpectedAnswer(item={}){
  const relational=String(item?.activity?.sessionExpectedResponse||'').trim();
  if(relational)return relational;
  const sequence=sequenceExpectedResponse(item?.activity);
  if(sequence.length)return sequence.join(' + ');
  const controlled=scalarExpectedResponse(item?.activity);
  return controlled||String(item?.answer||'').trim();
}

export function sessionAnswerMatches(value,item={}){
  const sequence=sequenceExpectedResponse(item?.activity).map(normalizeSessionAnswer).filter(Boolean);
  if(sequence.length){
    const actual=normalizeSessionSequence(value);
    return actual.length===sequence.length&&actual.every((unit,index)=>unit===sequence[index]);
  }
  const expected=normalizeSessionAnswer(sessionExpectedAnswer(item));
  return Boolean(expected)&&normalizeSessionAnswer(value)===expected;
}

export function safeSessionHint(item={}){
  const choices=Array.isArray(item?.activity?.choices)?item.activity.choices.map(choice=>String(choice?.word||choice||'').trim()).filter(Boolean):[];
  if(choices.length)return `Choisis parmi : ${choices.join(' ou ')}.`;
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
