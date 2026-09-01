import {firstIPAUnit,lastIPAUnit} from './phonetic-engine.js';

const TEMPLATES={
  'denomination':{
    childInstruction:'Nomme chaque image, une par une.',
    proInstruction:'Faire dénommer spontanément chaque pictogramme, sans indice phonémique, et relever les éventuelles réponses concurrentes.'
  },
  'lexical-access':{
    childInstruction:'Regarde chaque image. Retrouve son nom tout seul, puis dis-le.',
    proInstruction:'Solliciter l’évocation lexicale à partir de chaque pictogramme sans fournir le label ; laisser un temps de recherche avant toute aide et relever les aides nécessaires.'
  },
  'phoneme-initial':{
    childInstruction:'Dis le mot obtenu. Quel est le tout premier son que tu entends ?',
    proInstruction:(target)=>{
      const expected=firstIPAUnit(target?.targetIpa||'');
      return expected
        ?`Faire identifier le phonème initial du mot cible sans appui orthographique. Réponse attendue : /${expected}/.`
        :'Faire identifier le phonème initial du mot cible sans appui orthographique.';
    }
  },
  'phoneme-final':{
    childInstruction:'Dis le mot obtenu. Quel est le tout dernier son que tu entends ?',
    proInstruction:(target)=>{
      const expected=lastIPAUnit(target?.targetIpa||'');
      return expected
        ?`Faire identifier le phonème final du mot cible sans appui orthographique. Réponse attendue : /${expected}/.`
        :'Faire identifier le phonème final du mot cible sans appui orthographique.';
    }
  },
  'syllable-blending':{
    childInstruction:'Prononce le nom entier de chaque image, dans l’ordre, puis enchaîne-les sans retirer ni changer de son. Quel mot obtiens-tu ?',
    proInstruction:'Faire produire les dénominations entières des images, puis les fusionner dans l’ordre sans suppression ni substitution.'
  },
  'oral-to-written':{
    childInstruction:'Prononce le mot obtenu, répète-le, puis écris-le sur la ligne de réponse.',
    proInstruction:'Faire reconstruire le mot oralement à partir du rébus strict, puis demander sa transcription écrite.'
  }
};

function resolveInstruction(value,target){
  return typeof value==='function'?value(target):value;
}

export function therapyTargetMap(definitions=[]){
  return new Map((definitions||[]).filter(item=>item?.id).map(item=>[item.id,item]));
}

export function buildTherapyActivities(target,definitions=[]){
  const registry=therapyTargetMap(definitions);
  return (target?.therapy||[]).filter(id=>TEMPLATES[id]&&registry.has(id)).map(id=>{
    const definition=registry.get(id);
    const template=TEMPLATES[id];
    const expectedResponse=id==='phoneme-initial'
      ?firstIPAUnit(target?.targetIpa||'')
      :id==='phoneme-final'
        ?lastIPAUnit(target?.targetIpa||'')
        :'';
    return {
      id,
      label:definition.label,
      unit:definition.unit,
      description:definition.description,
      childInstruction:resolveInstruction(template.childInstruction,target),
      proInstruction:resolveInstruction(template.proInstruction,target),
      expectedResponse
    };
  });
}

export function activityInstruction(activity,mode='pro'){
  if(!activity)return '';
  return mode==='child'?activity.childInstruction||'':activity.proInstruction||'';
}

export function selectTherapyActivity(activities=[],requestedId=''){
  if(!activities.length)return null;
  if(requestedId){const found=activities.find(item=>item.id===requestedId);if(found)return found;}
  return activities[0];
}
