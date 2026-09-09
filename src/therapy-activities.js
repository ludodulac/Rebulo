import {firstIPAUnit,lastIPAUnit,normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

const phonemeSequence=(target)=>splitIPAUnits(target?.targetIpa||'');
const formatPhonemeSequence=(target)=>phonemeSequence(target).map(unit=>`/${unit}/`).join(' + ');
const validSyllableCount=(target)=>Number.isInteger(target?.syllableCount)&&target.syllableCount>0?target.syllableCount:null;
const sourceExactSyllables=(target)=>{
  if(target?.syllabificationStatus!=='source_exact'||!Array.isArray(target?.syllables))return [];
  const syllables=target.syllables.map(normalizeIPA).filter(Boolean);
  const count=validSyllableCount(target);
  if(!syllables.length||(count&&syllables.length!==count))return [];
  return syllables;
};
const formatSyllableSequence=(target)=>sourceExactSyllables(target).map(unit=>`/${unit}/`).join(' + ');

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
  'phoneme-segmentation':{
    childInstruction:'Dis le mot obtenu, puis sépare-le en petits sons, dans l’ordre.',
    proInstruction:(target)=>{
      const expected=formatPhonemeSequence(target);
      return expected
        ?`Faire segmenter oralement le mot cible en phonèmes, sans appui orthographique. Réponse attendue : ${expected}.`
        :'Faire segmenter oralement le mot cible en phonèmes, sans appui orthographique.';
    }
  },
  'phoneme-blending':{
    childInstruction:(target)=>{
      const sequence=formatPhonemeSequence(target);
      return sequence
        ?`Dis ces sons dans l’ordre : ${sequence}. Puis rapproche-les sans en retirer ni en changer. Quel mot obtiens-tu ?`
        :'Rapproche les sons donnés, dans l’ordre, sans en retirer ni en changer. Quel mot obtiens-tu ?';
    },
    proInstruction:(target)=>{
      const sequence=formatPhonemeSequence(target);
      return sequence
        ?`Présenter la séquence phonémique ${sequence}, calculée depuis l’IPA cible, puis demander sa fusion orale sans appui orthographique. Réponse attendue : /${normalizeIPA(target?.targetIpa||'')}/.`
        :'Présenter la séquence phonémique du mot cible, puis demander sa fusion orale sans appui orthographique.';
    }
  },
  'syllable-count':{
    childInstruction:'Dis le mot obtenu, puis compte combien de syllabes tu entends.',
    proInstruction:(target)=>{
      const expected=validSyllableCount(target);
      return expected
        ?`Faire compter les syllabes orales du mot cible sans fournir de découpage. Réponse attendue : ${expected}.`
        :'Faire compter les syllabes orales du mot cible sans fournir de découpage.';
    }
  },
  'syllable-identification':{
    childInstruction:'Dis le mot obtenu. Quelle est sa première syllabe ?',
    proInstruction:(target)=>{
      const expected=sourceExactSyllables(target)[0]||'';
      return expected
        ?`Faire identifier la syllabe initiale du mot cible à partir des frontières syllabiques source validées, sans utiliser les pièces du rébus comme découpage. Réponse attendue : /${expected}/.`
        :'Faire identifier la syllabe initiale uniquement si des frontières syllabiques source validées sont disponibles.';
    }
  },
  'syllable-segmentation':{
    childInstruction:'Dis le mot obtenu, puis sépare-le en syllabes, dans l’ordre.',
    proInstruction:(target)=>{
      const expected=formatSyllableSequence(target);
      return expected
        ?`Faire segmenter oralement le mot cible selon les frontières syllabiques source validées, sans utiliser les pièces du rébus comme découpage. Réponse attendue : ${expected}.`
        :'Faire segmenter oralement le mot cible uniquement si des frontières syllabiques source validées sont disponibles.';
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
  const hasTargetIpa=Boolean(normalizeIPA(target?.targetIpa||''));
  const syllableCount=validSyllableCount(target);
  const syllables=sourceExactSyllables(target);
  const ids=[...(target?.therapy||[])];
  if(syllables.length>=2&&registry.has('syllable-identification')&&!ids.includes('syllable-identification')){
    const segmentationIndex=ids.indexOf('syllable-segmentation');
    const oralIndex=ids.indexOf('oral-to-written');
    const before=segmentationIndex>=0?segmentationIndex:oralIndex;
    if(before>=0)ids.splice(before,0,'syllable-identification');
    else ids.push('syllable-identification');
  }
  return ids
    .filter(id=>TEMPLATES[id]&&registry.has(id))
    .filter(id=>id!=='phoneme-blending'||hasTargetIpa)
    .filter(id=>id!=='syllable-count'||syllableCount)
    .filter(id=>id!=='syllable-identification'||syllables.length>=2)
    .filter(id=>id!=='syllable-segmentation'||syllables.length)
    .map(id=>{
      const definition=registry.get(id);
      const template=TEMPLATES[id];
      const expectedResponse=id==='phoneme-initial'
        ?firstIPAUnit(target?.targetIpa||'')
        :id==='phoneme-final'
          ?lastIPAUnit(target?.targetIpa||'')
          :id==='phoneme-segmentation'
            ?splitIPAUnits(target?.targetIpa||'')
            :id==='phoneme-blending'
              ?normalizeIPA(target?.targetIpa||'')
              :id==='syllable-count'
                ?syllableCount
                :id==='syllable-identification'
                  ?syllables[0]
                  :id==='syllable-segmentation'
                    ?syllables
                    :'';
      const promptUnits=id==='phoneme-blending'?phonemeSequence(target):[];
      const promptPosition=id==='syllable-identification'?'initial':'';
      return {
        id,
        label:definition.label,
        unit:definition.unit,
        description:definition.description,
        childInstruction:resolveInstruction(template.childInstruction,target),
        proInstruction:resolveInstruction(template.proInstruction,target),
        expectedResponse,
        promptUnits,
        promptPosition
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
