export const DIFFICULTY_PROFILES=Object.freeze({
  discovery:{id:'discovery',label:'Découverte',maxDifficulty:1},
  intermediate:{id:'intermediate',label:'Intermédiaire',maxDifficulty:2},
  expert:{id:'expert',label:'Expert',maxDifficulty:3}
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
  const max=DIFFICULTY_PROFILES[normalized].maxDifficulty;
  return (items||[]).filter(item=>Number(item?.difficulty||1)<=max);
}
