import {normalizeIPA} from './phonetic-engine.js';

export const OPENMOJI_WAVE3_SOURCE=Object.freeze({
  id:'openmoji',
  project:'OpenMoji',
  license:'CC BY-SA 4.0',
  sourceCommit:'aeb8bb3a59e2de39c754ac79180c8131c906acea',
  repository:'https://github.com/hfg-gmuend/openmoji',
  assetBase:'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/'
});

const GENERAL_ONLY=new Set([
  'camionpompier','voiturepolice','feutricolore','travaux','grandmagasin','plage',
  'brosseadents','papierwc','flacon','hamburger','hotdog','rizcuit','curry','ramen','bacon','cupcake','biscuitfortune',
  'pousse','rocher','ratonlaveur','basketball','volleyball','rugby','baseball','bowling','pingpong','halteres','kimono',
  'casqueaudio','projecteur','clap','manette','joystick','puzzle','cleanglaise','boiteaoutils','tshirt','short','maillot',
  'chaussondanse','radiox','boitelettres','cartemonde','vent','globeterrestre'
]);

const ROWS=Object.freeze([
  ['camion','camion','/kamjɔ̃/','1F69A'],['taxi','taxi','/taksi/','1F695'],['ambulance','ambulance','/ɑ̃bylɑ̃s/','1F691'],['camionpompier','camion de pompiers','/kamjɔ̃dəpɔ̃pje/','1F692'],['voiturepolice','voiture de police','/vwatyʁdəpɔlis/','1F693'],['tracteur','tracteur','/tʁaktœʁ/','1F69C'],['helicoptere','hélicoptère','/elikɔptɛʁ/','1F681'],['trottinette','trottinette','/tʁɔtinɛt/','1F6F4'],['skateboard','skateboard','/skɛtbɔʁd/','1F6F9'],['patinroulette','patin à roulettes','/patɛ̃aʁulɛt/','1F6FC'],['metro','métro','/metʁo/','1F687'],['tramway','tramway','/tʁamwɛ/','1F68B'],['gare','gare','/gaʁ/','1F689'],['feutricolore','feu tricolore','/føtʁikɔlɔʁ/','1F6A5'],['travaux','travaux','/tʁavo/','1F6A7'],
  ['tente','tente','/tɑ̃t/','26FA'],['usine','usine','/yzin/','1F3ED'],['hotel','hôtel','/otɛl/','1F3E8'],['banque','banque','/bɑ̃k/','1F3E6'],['poste','poste','/pɔst/','1F3E4'],['stade','stade','/stad/','1F3DF'],['magasin','magasin','/magazɛ̃/','1F3EA'],['grandmagasin','grand magasin','/gʁɑ̃magazɛ̃/','1F3EC'],['fontaine','fontaine','/fɔ̃tɛn/','26F2'],['plage','plage','/plaʒ/','1F3D6'],['desert','désert','/dezɛʁ/','1F3DC'],['parc','parc','/paʁk/','1F3DE'],
  ['lit','lit','/li/','1F6CF'],['canape','canapé','/kanape/','1F6CB'],['toilettes','toilettes','/twalɛt/','1F6BD'],['douche','douche','/duʃ/','1F6BF'],['baignoire','baignoire','/bɛɲwaʁ/','1F6C1'],['brosseadents','brosse à dents','/bʁɔsadɑ̃/','1FAA5'],['rasoir','rasoir','/ʁazwaʁ/','1FA92'],['papierwc','papier toilette','/papjetwalɛt/','1F9FB'],['flacon','flacon','/flakɔ̃/','1F9F4'],['epingle','épingle','/epɛ̃gl/','1F9F7'],
  ['hamburger','hamburger','/ɑ̃byʁgœʁ/','1F354'],['hotdog','hot-dog','/ɔtdɔg/','1F32D'],['sandwich','sandwich','/sɑ̃dwiʃ/','1F96A'],['salade','salade','/salad/','1F957'],['rizcuit','riz cuit','/ʁikɥi/','1F35A'],['curry','curry','/kyʁi/','1F35B'],['ramen','ramen','/ʁamɛn/','1F35C'],['beurre','beurre','/bœʁ/','1F9C8'],['sel','sel','/sɛl/','1F9C2'],['bacon','bacon','/bekɔn/','1F953'],['steak','steak','/stɛk/','1F969'],['poulet','poulet','/pulɛ/','1F357'],['homard','homard','/ɔmaʁ/','1F99E'],['huitre','huître','/ɥitʁ/','1F9AA'],['bretzel','bretzel','/bʁɛtsɛl/','1F968'],['cupcake','cupcake','/kœpkɛk/','1F9C1'],['tarte','tarte','/taʁt/','1F967'],['sucette','sucette','/sysɛt/','1F36D'],['ravioli','ravioli','/ʁavjɔli/','1F95F'],['biscuitfortune','biscuit chinois','/biskɥiʃinwa/','1F960'],
  ['chataigne','châtaigne','/ʃatɛɲ/','1F330'],['tournesol','tournesol','/tuʁnəsɔl/','1F33B'],['tulipe','tulipe','/tylip/','1F337'],['hibiscus','hibiscus','/ibiskys/','1F33A'],['bouquet','bouquet','/bukɛ/','1F490'],['herbe','herbe','/ɛʁb/','1F33F'],['trefle','trèfle','/tʁɛfl/','2618'],['pousse','pousse','/pus/','1F331'],['rocher','rocher','/ʁɔʃe/','1FAA8'],['bois','bois','/bwa/','1FAB5'],['coccinelle','coccinelle','/kɔksinɛl/','1F41E'],['moustique','moustique','/mustik/','1F99F'],['grillon','grillon','/gʁijɔ̃/','1F997'],['mouche','mouche','/muʃ/','1FAB0'],['ver','ver','/vɛʁ/','1FAB1'],['scarabee','scarabée','/skaʁabe/','1FAB2'],['cafard','cafard','/kafaʁ/','1FAB3'],['castor','castor','/kastɔʁ/','1F9AB'],['moufette','moufette','/mufɛt/','1F9A8'],['ratonlaveur','raton laveur','/ʁatɔ̃lavœʁ/','1F99D'],['renard','renard','/ʁənaʁ/','1F98A'],
  ['basketball','ballon de basket','/balɔ̃dəbaskɛt/','1F3C0'],['volleyball','ballon de volley','/balɔ̃dəvɔlɛ/','1F3D0'],['rugby','ballon de rugby','/balɔ̃dəʁygbi/','1F3C9'],['baseball','baseball','/bɛzbol/','26BE'],['bowling','bowling','/buling/','1F3B3'],['golf','golf','/gɔlf/','26F3'],['pingpong','ping-pong','/piŋpɔŋ/','1F3D3'],['badminton','badminton','/badmɛ̃tɔn/','1F3F8'],['hockey','hockey','/ɔkɛ/','1F3D2'],['boxe','boxe','/bɔks/','1F94A'],['halteres','haltères','/altɛʁ/','1F3CB'],['cible','cible','/sibl/','1F3AF'],['kimono','kimono','/kimɔno/','1F94B'],
  ['microphone','microphone','/mikʁofɔn/','1F3A4'],['casqueaudio','casque audio','/kaskodjo/','1F3A7'],['hautparleur','haut-parleur','/opaʁlœʁ/','1F50A'],['projecteur','projecteur','/pʁɔʒɛktœʁ/','1F4FD'],['clap','clap','/klap/','1F3AC'],['ticket','ticket','/tikɛ/','1F3AB'],['manette','manette','/manɛt/','1F3AE'],['joystick','joystick','/dʒɔjstik/','1F579'],['de','dé','/de/','1F3B2'],['puzzle','puzzle','/pœzl/','1F9E9'],
  ['tournevis','tournevis','/tuʁnəvis/','1FA9B'],['cleanglaise','clé anglaise','/kleɑ̃glɛz/','1F527'],['ecrou','écrou','/ekʁu/','1F529'],['engrenage','engrenage','/ɑ̃gʁənaʒ/','2699'],['chaine','chaîne','/ʃɛn/','26D3'],['boiteaoutils','boîte à outils','/bwatauti/','1F9F0'],['lampe','lampe','/lɑ̃p/','1F526'],['telescope','télescope','/teleskɔp/','1F52D'],['microscope','microscope','/mikʁɔskɔp/','1F52C'],['satellite','satellite','/satelit/','1F6F0'],['ancre','ancre','/ɑ̃kʁ/','2693'],['bouee','bouée','/bwe/','1F6DF'],
  ['tshirt','tee-shirt','/tiʃœʁt/','1F455'],['short','short','/ʃɔʁt/','1FA73'],['maillot','maillot','/majo/','1FA71'],['sandale','sandale','/sɑ̃dal/','1F97F'],['talon','talon','/talɔ̃/','1F460'],['cravate','cravate','/kʁavat/','1F454'],['chaussondanse','chausson de danse','/ʃosɔ̃dədɑ̃s/','1FA70'],['manteau','manteau','/mɑ̃to/','1F9E5'],
  ['pansement','pansement','/pɑ̃smɑ̃/','1FA79'],['pilule','pilule','/pilyl/','1F48A'],['bequille','béquille','/bekij/','1FA7C'],['radiox','radiographie','/ʁadjogʁafi/','1FA7B'],
  ['nez','nez','/ne/','1F443'],['jambe','jambe','/ʒɑ̃b/','1F9B5'],['biceps','biceps','/bisɛps/','1F4AA'],['poumons','poumons','/pumɔ̃/','1FAC1'],
  ['boitelettres','boîte aux lettres','/bwatolɛtʁ/','1F4EB'],['cartemonde','carte du monde','/kaʁtdymɔ̃d/','1F5FA'],['marquepage','marque-page','/maʁkpaʒ/','1F516'],['chronometre','chronomètre','/kʁɔnɔmɛtʁ/','23F1'],['minuteur','minuteur','/minytœʁ/','23F2'],['pluie','pluie','/plɥi/','1F327'],['vent','vent','/vɑ̃/','1F32C'],['goutte','goutte','/gut/','1F4A7'],['globeterrestre','globe terrestre','/glɔbtɛʁɛstʁ/','1F30D']
]);

export const OPEN_PICTOGRAMS_WAVE_3=Object.freeze(ROWS.map(([id,label,ipa,code])=>Object.freeze({
  id,label,ipa,
  image:`${OPENMOJI_WAVE3_SOURCE.assetBase}${code}.svg`,
  assetSource:`openmoji:${code}`,
  sourceFile:`color/svg/${code}.svg`,
  sourceCommit:OPENMOJI_WAVE3_SOURCE.sourceCommit,
  sourceLicense:OPENMOJI_WAVE3_SOURCE.license,
  active:true,
  strictEligible:!GENERAL_ONLY.has(id),
  libraryTier:'phonetic_concept',
  clinicalStatus:'unreviewed',
  visualConfidence:GENERAL_ONLY.has(id)?0.68:0.9,
  labelStability:GENERAL_ONLY.has(id)?0.62:0.82
})));

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function mergeOpenPictogramsWave3(seed=[]){
  const result=[...(seed||[])];
  const ids=new Set(result.map(item=>item?.id).filter(Boolean));
  const labels=new Set(result.map(item=>normalizeKey(item?.label)).filter(Boolean));
  for(const item of OPEN_PICTOGRAMS_WAVE_3){
    const key=normalizeKey(item.label);
    if(ids.has(item.id)||labels.has(key))continue;
    result.push({...item});
    ids.add(item.id);labels.add(key);
  }
  return result;
}

export function buildWave3GapTargets(report={}){
  const strictByIpa=new Map();
  for(const item of OPEN_PICTOGRAMS_WAVE_3){
    if(item.strictEligible===false)continue;
    const ipa=normalizeIPA(item.ipa);
    if(ipa&&!strictByIpa.has(ipa))strictByIpa.set(ipa,item);
  }
  const out=[];const seen=new Set();
  for(const gap of report?.missingSounds||[]){
    if(!strictByIpa.has(normalizeIPA(gap?.ipa||'')))continue;
    for(const example of gap?.examples||[]){
      if(!example?.word||!example?.ipa)continue;
      const key=`${normalizeKey(example.word)}|${normalizeIPA(example.ipa)}`;
      if(!normalizeKey(example.word)||seen.has(key))continue;
      seen.add(key);
      out.push({target:example.word,targetIpa:example.ipa,mode:'strict',assets:'ready',therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-blending','oral-to-written'],source:'open-pictogram-wave3-gap',generated:true,frequency:Number(example.frequency||0),operationCount:Array.isArray(example.frame)?example.frame.length:2});
    }
  }
  return out;
}

export function wave3LibraryStats(){
  return {total:OPEN_PICTOGRAMS_WAVE_3.length,strictEligible:OPEN_PICTOGRAMS_WAVE_3.filter(item=>item.strictEligible!==false).length,generalOnly:OPEN_PICTOGRAMS_WAVE_3.filter(item=>item.strictEligible===false).length,source:OPENMOJI_WAVE3_SOURCE.project,license:OPENMOJI_WAVE3_SOURCE.license};
}
