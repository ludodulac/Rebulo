export function creatorStatus({wanted='',target=null,candidate=null}={}){
  if(!String(wanted||'').trim())return {code:'empty',message:'Écris un mot pour créer un rébus.'};
  if(!target)return {code:'missing',message:'Aucun rébus exact disponible pour ce mot. Essaie un autre mot.'};
  if(target.mode!=='strict')return {code:'not-exact',message:'Ce mot ne permet pas encore un rébus exact avec les règles actuelles.'};
  if(target.assets!=='ready')return {code:'assets-missing',message:'Rébus exact repéré, mais les images nécessaires ne sont pas encore disponibles.'};
  if(!candidate)return {code:'no-active-combination',message:'Ce mot est connu, mais aucune combinaison d’images active ne permet encore un rébus exact.'};
  if(!Array.isArray(candidate.therapyActivities)||!candidate.therapyActivities.length)return {code:'ready-no-activity',message:'Rébus exact créé. Aucune activité supplémentaire n’est disponible pour ce mot.'};
  return {code:'ready',message:'Rébus exact créé.'};
}
