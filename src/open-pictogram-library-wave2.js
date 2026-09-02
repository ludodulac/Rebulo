import {normalizeIPA} from './phonetic-engine.js';

export const OPENMOJI_WAVE2_SOURCE=Object.freeze({
  id:'openmoji',
  project:'OpenMoji',
  license:'CC BY-SA 4.0',
  sourceCommit:'aeb8bb3a59e2de39c754ac79180c8131c906acea',
  repository:'https://github.com/hfg-gmuend/openmoji',
  assetBase:'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/'
});

const GENERAL_ONLY=new Set(['gant','poulpe','parachute','boomerang','cerfvolant','poupee','yoyo']);
const ROWS=Object.freeze([
['cle','clé','/kle/','1F511'],['loupe','loupe','/lup/','1F50D'],['journal','journal','/ʒuʁnal/','1F4F0'],['enveloppe','enveloppe','/ɑ̃vəlɔp/','2709'],['trombone','trombone','/tʁɔ̃bon/','1F4CE'],['punaise','punaise','/pynɛz/','1F4CC'],['dossier','dossier','/dosje/','1F4C1'],['calendrier','calendrier','/kalɑ̃dʁije/','1F4C5'],['sablier','sablier','/sablije/','231B'],['pile','pile','/pil/','1F50B'],['ampoule','ampoule','/ɑ̃pul/','1F4A1'],['diamant','diamant','/djamɑ̃/','1F48E'],['bague','bague','/bag/','1F48D'],['parapluie','parapluie','/paʁaplɥi/','2602'],['chaussettes','chaussettes','/ʃosɛt/','1F9E6'],['gant','gant','/gɑ̃/','1F9E4'],['echarpe','écharpe','/eʃaʁp/','1F9E3'],['casquette','casquette','/kaskɛt/','1F9E2'],
['peche','pêche','/pɛʃ/','1F351'],['ananas','ananas','/anana/','1F34D'],['kiwi','kiwi','/kiwi/','1F95D'],['avocat','avocat','/avɔka/','1F951'],['aubergine','aubergine','/obɛʁʒin/','1F346'],['mais','maïs','/mais/','1F33D'],['brocoli','brocoli','/bʁɔkɔli/','1F966'],['ail','ail','/aj/','1F9C4'],['oignon','oignon','/ɔɲɔ̃/','1F9C5'],['croissant','croissant','/kʁwasɑ̃/','1F950'],['baguette','baguette','/bagɛt/','1F956'],['crepe','crêpe','/kʁɛp/','1F95E'],['gaufre','gaufre','/gofʁ/','1F9C7'],['frites','frites','/fʁit/','1F35F'],['taco','taco','/tako/','1F32E'],['sushi','sushi','/syʃi/','1F363'],['popcorn','pop-corn','/pɔpkɔʁn/','1F37F'],['biscuit','biscuit','/biskɥi/','1F36A'],['chocolat','chocolat','/ʃɔkɔla/','1F36B'],['theiere','théière','/tejɛʁ/','1FAD6'],
['elephant','éléphant','/elefɑ̃/','1F418'],['rhinoceros','rhinocéros','/ʁinoseʁɔs/','1F98F'],['hippopotame','hippopotame','/ipopotam/','1F99B'],['girafe','girafe','/ʒiʁaf/','1F992'],['zebre','zèbre','/zɛbʁ/','1F993'],['chameau','chameau','/ʃamo/','1F42B'],['lama','lama','/lama/','1F999'],['cerf','cerf','/sɛʁ/','1F98C'],['bison','bison','/bizɔ̃/','1F9AC'],['gorille','gorille','/goʁij/','1F98D'],['orangoutan','orang-outan','/ɔʁɑ̃utɑ̃/','1F9A7'],['paresseux','paresseux','/paʁɛsø/','1F9A5'],['loutre','loutre','/lutʁ/','1F9A6'],['kangourou','kangourou','/kɑ̃guʁu/','1F998'],['blaireau','blaireau','/blɛʁo/','1F9A1'],['herisson','hérisson','/eʁisɔ̃/','1F994'],['chauvesouris','chauve-souris','/ʃovsuri/','1F987'],['aigle','aigle','/ɛgl/','1F985'],['canard','canard','/kanaʁ/','1F986'],['cygne','cygne','/siɲ/','1F9A2'],['hibou','hibou','/ibu/','1F989'],['flamant','flamant','/flamɑ̃/','1F9A9'],['paon','paon','/pɑ̃/','1F99A'],['perroquet','perroquet','/pɛʁɔkɛ/','1F99C'],['pingouin','pingouin','/pɛ̃gwɛ̃/','1F427'],['lezard','lézard','/lezaʁ/','1F98E'],['crocodile','crocodile','/kʁɔkɔdil/','1F40A'],['dinosaure','dinosaure','/dinozɔʁ/','1F996'],['baleine','baleine','/balɛn/','1F40B'],['dauphin','dauphin','/dofɛ̃/','1F42C'],['requin','requin','/ʁəkɛ̃/','1F988'],['poulpe','poulpe','/pulp/','1F419'],['crevette','crevette','/kʁəvɛt/','1F990'],
['cactus','cactus','/kaktys/','1F335'],['palmier','palmier','/palmje/','1F334'],['sapin','sapin','/sapɛ̃/','1F332'],['volcan','volcan','/vɔlkɑ̃/','1F30B'],['comete','comète','/kɔmɛt/','2604'],['tornade','tornade','/tɔʁnad/','1F32A'],['brouillard','brouillard','/bʁujaʁ/','1F32B'],['vague','vague','/vag/','1F30A'],
['ski','ski','/ski/','1F3BF'],['medaille','médaille','/medaj/','1F3C5'],['violon','violon','/vjɔlɔ̃/','1F3BB'],['saxophone','saxophone','/saksɔfɔn/','1F3B7'],['trompette','trompette','/tʁɔ̃pɛt/','1F3BA'],['scie','scie','/si/','1FA9A'],['echelle','échelle','/eʃɛl/','1FA9C'],['crochet','crochet','/kʁɔʃɛ/','1FA9D'],['seau','seau','/so/','1FAA3'],['balai','balai','/balɛ/','1F9F9'],['panier','panier','/panje/','1F9FA'],['savon','savon','/savɔ̃/','1F9FC'],['eponge','éponge','/epɔ̃ʒ/','1F9FD'],['seringue','seringue','/səʁɛ̃g/','1F489'],['thermometre','thermomètre','/tɛʁmɔmɛtʁ/','1F321'],['stethoscope','stéthoscope','/stetɔskɔp/','1FA7A'],['microbe','microbe','/mikʁɔb/','1F9A0'],['boussole','boussole','/busɔl/','1F9ED'],['brique','brique','/bʁik/','1F9F1'],['extincteur','extincteur','/ɛkstɛ̃ktœʁ/','1F9EF'],
['yoyo','yo-yo','/jojo/','1FA80'],['cerfvolant','cerf-volant','/sɛʁvɔlɑ̃/','1FA81'],['parachute','parachute','/paʁaʃyt/','1FA82'],['boomerang','boomerang','/buməʁɑ̃g/','1FA83'],['poupee','poupée','/pupe/','1FA86'],['maracas','maracas','/maʁakas/','1FA87'],['flute','flûte','/flyt/','1FA88'],['harpe','harpe','/aʁp/','1FA95'],['accordeon','accordéon','/akɔʁdeɔ̃/','1FA97']
]);

export const OPEN_PICTOGRAMS_WAVE_2=Object.freeze(ROWS.map(([id,label,ipa,code])=>Object.freeze({
  id,label,ipa,
  image:`${OPENMOJI_WAVE2_SOURCE.assetBase}${code}.svg`,
  assetSource:`openmoji:${code}`,
  sourceFile:`color/svg/${code}.svg`,
  sourceCommit:OPENMOJI_WAVE2_SOURCE.sourceCommit,
  sourceLicense:OPENMOJI_WAVE2_SOURCE.license,
  active:true,
  strictEligible:!GENERAL_ONLY.has(id),
  libraryTier:'phonetic_concept',
  clinicalStatus:'unreviewed',
  visualConfidence:GENERAL_ONLY.has(id)?0.7:0.9,
  labelStability:GENERAL_ONLY.has(id)?0.65:0.82
})));

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function mergeOpenPictogramsWave2(seed=[]){
  const result=[...(seed||[])];
  const ids=new Set(result.map(item=>item?.id).filter(Boolean));
  const labels=new Set(result.map(item=>normalizeKey(item?.label)).filter(Boolean));
  for(const item of OPEN_PICTOGRAMS_WAVE_2){
    const key=normalizeKey(item.label);
    if(ids.has(item.id)||labels.has(key))continue;
    result.push({...item});
    ids.add(item.id);labels.add(key);
  }
  return result;
}

export function buildWave2GapTargets(report={}){
  const strictByIpa=new Map();
  for(const item of OPEN_PICTOGRAMS_WAVE_2){
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
      out.push({target:example.word,targetIpa:example.ipa,mode:'strict',assets:'ready',therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-blending','oral-to-written'],source:'open-pictogram-wave2-gap',generated:true,frequency:Number(example.frequency||0),operationCount:Array.isArray(example.frame)?example.frame.length:2});
    }
  }
  return out;
}

export function wave2LibraryStats(){
  return {total:OPEN_PICTOGRAMS_WAVE_2.length,strictEligible:OPEN_PICTOGRAMS_WAVE_2.filter(item=>item.strictEligible!==false).length,generalOnly:OPEN_PICTOGRAMS_WAVE_2.filter(item=>item.strictEligible===false).length,source:OPENMOJI_WAVE2_SOURCE.project,license:OPENMOJI_WAVE2_SOURCE.license};
}
