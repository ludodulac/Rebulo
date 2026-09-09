function normalizeRef(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'');
}

function activityRef(activity={}){
  return normalizeRef(activity?.id||activity?.activityId||'');
}

function savedDescriptor(saved={}){
  const targetLabel=String(saved?.targetLabel||saved?.answer||saved?.target||'').trim();
  const activityLabel=String(saved?.activityLabel||saved?.activity?.label||'').trim();
  return {
    target:normalizeRef(saved?.target||saved?.answer||targetLabel),
    activity:normalizeRef(saved?.activityId||saved?.activity?.id||saved?.activity||''),
    targetLabel,
    activityLabel
  };
}

export function resolveSessionEntries(savedEntries=[],data={}){
  const corpus=Array.isArray(data?.corpus)?data.corpus:[];
  const buildCandidate=typeof data?.buildCandidate==='function'?data.buildCandidate:()=>null;
  return (savedEntries||[]).map(saved=>{
    const descriptor=savedDescriptor(saved);
    const target=corpus.find(item=>normalizeRef(item?.target)===descriptor.target&&item?.mode==='strict'&&item?.assets==='ready')||null;
    if(!target){
      return {status:'unavailable',reason:'target_unavailable',descriptor,item:null};
    }
    const candidate=buildCandidate(target);
    if(!candidate){
      return {status:'unavailable',reason:'target_unavailable',descriptor,item:null};
    }
    const activities=Array.isArray(candidate?.therapyActivities)?candidate.therapyActivities:[];
    let activity=null;
    if(descriptor.activity){
      activity=activities.find(item=>activityRef(item)===descriptor.activity)||null;
    }else if(descriptor.activityLabel){
      activity=activities.find(item=>String(item?.label||'').trim()===descriptor.activityLabel)||null;
    }
    if(!activity){
      return {
        status:'unavailable',
        reason:descriptor.activity||descriptor.activityLabel?'activity_unavailable':'activity_reference_missing',
        descriptor:{...descriptor,targetLabel:descriptor.targetLabel||candidate.answer},
        item:{...candidate,activity:null}
      };
    }
    return {
      status:'usable',
      reason:'',
      descriptor:{...descriptor,targetLabel:descriptor.targetLabel||candidate.answer,activityLabel:descriptor.activityLabel||activity.label,activity:activityRef(activity)},
      item:{...candidate,activity}
    };
  });
}

export function summarizeSessionResolution(entries=[]){
  const resolved=Array.isArray(entries)?entries:[];
  const usable=resolved.filter(entry=>entry?.status==='usable');
  const unavailable=resolved.filter(entry=>entry?.status==='unavailable');
  return {entries:resolved,items:usable.map(entry=>entry.item),usable,unavailable,allUsable:resolved.length>0&&unavailable.length===0};
}
