export function creatorStatus({wanted='',target=null,candidate=null}={}){
  if(!String(wanted||'').trim())return {code:'empty',message:'Écris un mot pour créer un rébus.'};
  if(!target)return {code:'missing',message:'Aucun rébus exact disponible pour ce mot. Essaie un autre mot.'};
  if(target.mode!=='strict')return {code:'not-exact',message:'Ce mot ne permet pas encore un rébus exact avec les règles actuelles.'};
  if(target.assets!=='ready')return {code:'assets-missing',message:'Rébus exact repéré, mais les images nécessaires ne sont pas encore disponibles.'};
  if(!candidate)return {code:'no-active-combination',message:'Ce mot est connu, mais aucune combinaison d’images active ne permet encore un rébus exact.'};
  if(!Array.isArray(candidate.therapyActivities)||!candidate.therapyActivities.length)return {code:'ready-no-activity',message:'Rébus exact créé. Aucune activité supplémentaire n’est disponible pour ce mot.'};
  return {code:'ready',message:'Rébus exact créé.'};
}

export function friendlyCreatorMessage(raw='',hasActivities=true){
  const text=String(raw||'').trim();
  if(!text)return '';
  if(text==='Écris d’abord un mot.')return creatorStatus({wanted:''}).message;
  if(text==='Aucun rébus exact disponible pour ce mot.')return creatorStatus({wanted:'mot'}).message;
  if(text.startsWith('Refus phonétique'))return creatorStatus({wanted:'mot',target:{mode:'rejected'}}).message;
  if(text==='La décomposition est étudiée, mais les images nécessaires ne sont pas encore prêtes.')return creatorStatus({wanted:'mot',target:{mode:'strict',assets:'missing'}}).message;
  if(text==='Aucune décomposition exacte disponible avec les concepts actifs.')return creatorStatus({wanted:'mot',target:{mode:'strict',assets:'ready'},candidate:null}).message;
  if(text==='Rébus créé.')return hasActivities?creatorStatus({wanted:'mot',target:{mode:'strict',assets:'ready'},candidate:{therapyActivities:[{}]}}).message:creatorStatus({wanted:'mot',target:{mode:'strict',assets:'ready'},candidate:{therapyActivities:[]}}).message;
  if(text==='Chargement impossible.')return 'Impossible de charger Rebulo. Recharge la page pour réessayer.';
  return text;
}
