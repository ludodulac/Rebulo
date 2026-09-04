const groups=document.querySelector('#galleryGroups');
const status=document.querySelector('#galleryStatus');
const conceptCount=document.querySelector('#conceptCount');
const stimulusCount=document.querySelector('#stimulusCount');

function text(tag,value,className=''){
  const node=document.createElement(tag);
  node.textContent=value||'';
  if(className)node.className=className;
  return node;
}

function renderCandidate(candidate={}){
  const card=document.createElement('article');card.className='card';card.dataset.candidateId=candidate.candidateId||'';
  const stage=document.createElement('div');stage.className='image-stage';
  const image=document.createElement('img');image.src=candidate.asset||'';image.alt='Prototype visuel';image.loading='lazy';
  image.addEventListener('error',()=>{card.dataset.loadError='true';stage.replaceChildren(text('p','Image indisponible — ne pas utiliser ce stimulus.','image-error'));});
  stage.append(image);
  const body=document.createElement('div');body.className='card-body';
  body.append(text('div',candidate.candidateId,'candidate-id'),text('p',candidate.designIntent,'intent'),text('div','Risques de dénomination','risk-title'));
  const risks=document.createElement('div');risks.className='risks';for(const risk of candidate.namingRisks||[])risks.append(text('span',risk,'risk'));body.append(risks);
  body.append(text('div','Provenance','provenance-title'),text('div',candidate.provenance,'provenance'));
  card.append(stage,body);return card;
}

function renderComparison(comparison={}){
  const section=document.createElement('section');section.className='concept-group';section.dataset.concept=comparison.concept||'';
  const heading=document.createElement('div');heading.className='concept-heading';heading.append(text('h2',comparison.concept),text('span',comparison.targetIpa,'ipa'));
  const cards=document.createElement('div');cards.className='cards';for(const candidate of comparison.candidates||[])cards.append(renderCandidate(candidate));
  section.append(heading,text('p',comparison.goal,'concept-goal'),cards);return section;
}

async function init(){
  try{
    const response=await fetch('./data/pictogram-prototype-comparisons.json',{cache:'no-store'});if(!response.ok)throw new Error('comparisons unavailable');
    const registry=await response.json();
    const comparisons=(registry.comparisons||[]).filter(item=>item.activationState==='inactive_until_human_decision'&&item.candidates?.length);
    groups.replaceChildren(...comparisons.map(renderComparison));
    conceptCount.textContent=String(comparisons.length);
    stimulusCount.textContent=String(comparisons.reduce((sum,item)=>sum+(item.candidates?.length||0),0));
    if(!comparisons.length)status.textContent='Aucun prototype de recherche disponible.';
  }catch(error){console.error(error);status.textContent='Impossible de charger la planche de prototypes.';}
}
init();
