export const DIFFICULTY_PROFILES=Object.freeze({
  discovery:{id:'discovery',label:'Découverte',maxDifficulty:1,includeReviewNeeded:false},
  intermediate:{id:'intermediate',label:'Intermédiaire',maxDifficulty:2,includeReviewNeeded:false},
  expert:{id:'expert',label:'Expert',maxDifficulty:3,includeReviewNeeded:true}
});

export function normalizeDifficultyProfile(value=''){
  const key=String(value||'').toLowerCase();
  return DIFFICULTY_PROFILES[key]?key:'discovery';
}

export function profileFromAge(age=7){
  const value=Number(age)||7;
  if(value>=12)return 'expert';
  if(value>=9)return 'intermediate';
  return 'discovery';
}

export function rebusesForProfile(items=[],profile='discovery'){
  const normalized=normalizeDifficultyProfile(profile);
  const config=DIFFICULTY_PROFILES[normalized];
  return (items||[]).filter(item=>{
    if(Number(item?.difficulty||1)>config.maxDifficulty)return false;
    if(!config.includeReviewNeeded&&item?.playQuality==='review_needed')return false;
    return true;
  });
}
