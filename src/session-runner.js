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

export const SESSION_PHASES=Object.freeze({
  PRESENTATION:'presentation',
  ATTEMPT:'attempt',
  HELP:'help',
  RETRY:'retry',
  RESOLUTION:'resolution',
  RESULT:'result'
});

export const SESSION_EVENTS=Object.freeze({
  PRESENT:'present',
  SUBMIT_INCORRECT:'submit_incorrect',
  SUBMIT_CORRECT:'submit_correct',
  REQUEST_HELP:'request_help',
  RETRY:'retry',
  REVEAL_SOLUTION:'reveal_solution',
  RECORD_RESULT:'record_result'
});

const SESSION_TRANSITIONS=Object.freeze({
  [SESSION_PHASES.PRESENTATION]:Object.freeze({
    [SESSION_EVENTS.PRESENT]:SESSION_PHASES.ATTEMPT
  }),
  [SESSION_PHASES.ATTEMPT]:Object.freeze({
    [SESSION_EVENTS.SUBMIT_INCORRECT]:SESSION_PHASES.RETRY,
    [SESSION_EVENTS.SUBMIT_CORRECT]:SESSION_PHASES.RESOLUTION,
    [SESSION_EVENTS.REQUEST_HELP]:SESSION_PHASES.HELP,
    [SESSION_EVENTS.REVEAL_SOLUTION]:SESSION_PHASES.RESOLUTION
  }),
  [SESSION_PHASES.HELP]:Object.freeze({
    [SESSION_EVENTS.RETRY]:SESSION_PHASES.RETRY,
    [SESSION_EVENTS.REVEAL_SOLUTION]:SESSION_PHASES.RESOLUTION
  }),
  [SESSION_PHASES.RETRY]:Object.freeze({
    [SESSION_EVENTS.SUBMIT_INCORRECT]:SESSION_PHASES.RETRY,
    [SESSION_EVENTS.SUBMIT_CORRECT]:SESSION_PHASES.RESOLUTION,
    [SESSION_EVENTS.REQUEST_HELP]:SESSION_PHASES.HELP,
    [SESSION_EVENTS.REVEAL_SOLUTION]:SESSION_PHASES.RESOLUTION
  }),
  [SESSION_PHASES.RESOLUTION]:Object.freeze({
    [SESSION_EVENTS.RECORD_RESULT]:SESSION_PHASES.RESULT
  }),
  [SESSION_PHASES.RESULT]:Object.freeze({})
});

export function createSessionState(){
  return {phase:SESSION_PHASES.PRESENTATION,attempts:0,hintUsed:false,solutionUsed:false,resolvedBy:null};
}

export function transitionSessionState(state=createSessionState(),event=''){
  const currentPhase=Object.values(SESSION_PHASES).includes(state?.phase)?state.phase:SESSION_PHASES.PRESENTATION;
  const nextPhase=SESSION_TRANSITIONS[currentPhase]?.[event];
  if(!nextPhase)return {...state,phase:currentPhase};
  const next={...state,phase:nextPhase};
  if(event===SESSION_EVENTS.SUBMIT_INCORRECT||event===SESSION_EVENTS.SUBMIT_CORRECT)next.attempts=(Number(state?.attempts)||0)+1;
  if(event===SESSION_EVENTS.REQUEST_HELP)next.hintUsed=true;
  if(event===SESSION_EVENTS.REVEAL_SOLUTION){next.solutionUsed=true;next.resolvedBy='solution';}
  if(event===SESSION_EVENTS.SUBMIT_CORRECT)next.resolvedBy='answer';
  return next;
}
