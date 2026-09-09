import {resolveSessionEntries,summarizeSessionResolution} from './session-resolution.js';

const SESSION_SHARE_VERSION=2;
const LEGACY_SESSION_SHARE_VERSION=1;
export const SESSION_SHARE_PARAM='session';

function normalizeRef(value=''){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'');}
function validBoolean(value){return typeof value==='boolean';}
function cleanLabel(value=''){return String(value||'').trim().slice(0,120);}

function roundFromItem(item={}){
  const targetLabel=cleanLabel(item?.targetLabel||item?.answer||item?.target);
  const activityLabel=cleanLabel(item?.activityLabel||item?.activity?.label);
  return {
    target:normalizeRef(item?.answer||item?.target||targetLabel),
    activity:normalizeRef(item?.activity?.id||item?.activityId||item?.activity),
    targetLabel,
    activityLabel
  };
}

export function buildSessionSharePayload(items=[],options={}){
  const rounds=(items||[]).slice(0,4).map(roundFromItem);
  if(!rounds.length||rounds.some(round=>!round.target))return null;
  return {v:SESSION_SHARE_VERSION,rounds,help:{hint:options.hint!==false,solution:options.solution===true}};
}

export function validateSessionSharePayload(payload){
  if(!payload||![LEGACY_SESSION_SHARE_VERSION,SESSION_SHARE_VERSION].includes(payload.v)||!Array.isArray(payload.rounds)||payload.rounds.length<1||payload.rounds.length>4)return null;
  if(!payload.help||!validBoolean(payload.help.hint)||!validBoolean(payload.help.solution))return null;
  if(payload.v===LEGACY_SESSION_SHARE_VERSION){
    const rounds=payload.rounds.map(round=>({target:normalizeRef(round?.target),activity:normalizeRef(round?.activity),targetLabel:'',activityLabel:''}));
    if(rounds.some((round,index)=>!round.target||round.target!==payload.rounds[index]?.target||round.activity!==String(payload.rounds[index]?.activity||'')))return null;
    return {v:LEGACY_SESSION_SHARE_VERSION,rounds,help:{hint:payload.help.hint,solution:payload.help.solution}};
  }
  const rounds=payload.rounds.map(round=>({
    target:normalizeRef(round?.target),
    activity:normalizeRef(round?.activity),
    targetLabel:cleanLabel(round?.targetLabel),
    activityLabel:cleanLabel(round?.activityLabel)
  }));
  if(rounds.some((round,index)=>!round.target||round.target!==payload.rounds[index]?.target||round.activity!==String(payload.rounds[index]?.activity||'')))return null;
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
  const entries=resolveSessionEntries(valid.rounds,data);
  return {...summarizeSessionResolution(entries),help:valid.help};
}
