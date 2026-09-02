const SESSION_SHARE_VERSION=1;
export const SESSION_SHARE_PARAM='session';

function normalizeRef(value=''){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'');}
function validBoolean(value){return typeof value==='boolean';}

export function buildSessionSharePayload(items=[],options={}){
  const rounds=(items||[]).slice(0,4).map(item=>({
    target:normalizeRef(item?.answer||item?.target),
    activity:normalizeRef(item?.activity?.id||item?.activityId)
  }));
  if(!rounds.length||rounds.some(round=>!round.target))return null;
  return {v:SESSION_SHARE_VERSION,rounds,help:{hint:options.hint!==false,solution:options.solution===true}};
}

export function validateSessionSharePayload(payload){
  if(!payload||payload.v!==SESSION_SHARE_VERSION||!Array.isArray(payload.rounds)||payload.rounds.length<1||payload.rounds.length>4)return null;
  if(!payload.help||!validBoolean(payload.help.hint)||!validBoolean(payload.help.solution))return null;
  const rounds=payload.rounds.map(round=>({target:normalizeRef(round?.target),activity:normalizeRef(round?.activity)}));
  if(rounds.some(round=>!round.target||round.target!==round?.target||round.activity!==String(round?.activity||'')))return null;
  return {v:SESSION_SHARE_VERSION,rounds,help:{hint:payload.help.hint,solution:payload.help.solution}};
}

function toBase64Url(text){const bytes=new TextEncoder().encode(text);let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromBase64Url(value){const base64=String(value||'').replace(/-/g,'+').replace(/_/g,'/');const padded=base64+'='.repeat((4-base64.length%4)%4);const binary=atob(padded);const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));return new TextDecoder().decode(bytes);}

export function serializeSessionShare(payload){const valid=validateSessionSharePayload(payload);return valid?toBase64Url(JSON.stringify(valid)):'';}
export function deserializeSessionShare(value){try{return validateSessionSharePayload(JSON.parse(fromBase64Url(value)));}catch{return null;}}
export function createSessionShareUrl(items=[],options={},locationLike=globalThis.location){
  const payload=buildSessionSharePayload(items,options);const encoded=payload?serializeSessionShare(payload):'';if(!encoded)return '';
  const url=new URL(locationLike?.href||String(locationLike||''));url.searchParams.set(SESSION_SHARE_PARAM,encoded);return url.toString();
}
export function readSessionShareFromUrl(locationLike=globalThis.location){try{return deserializeSessionShare(new URL(locationLike?.href||String(locationLike||'')).searchParams.get(SESSION_SHARE_PARAM)||'');}catch{return null;}}

export function resolveSharedSession(payload,data={}){
  const valid=validateSessionSharePayload(payload);if(!valid)return null;
  const corpus=Array.isArray(data.corpus)?data.corpus:[];const norm=value=>normalizeRef(value);
  const items=[];
  for(const round of valid.rounds){
    const target=corpus.find(item=>norm(item?.target)===round.target&&item?.mode==='strict'&&item?.assets==='ready');if(!target)return null;
    const candidate=data.buildCandidate?.(target);if(!candidate)return null;
    const activities=candidate.therapyActivities||[];const activity=round.activity?activities.find(item=>norm(item?.id)===round.activity):activities[0];if(round.activity&&!activity)return null;
    items.push({...candidate,activity:activity||null});
  }
  return {items,help:valid.help};
}
