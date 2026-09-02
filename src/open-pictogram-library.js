import {normalizeIPA} from './phonetic-engine.js';

export const OPENMOJI_SOURCE=Object.freeze({
  id:'openmoji',
  project:'OpenMoji',
  license:'CC BY-SA 4.0',
  sourceCommit:'aeb8bb3a59e2de39c754ac79180c8131c906acea',
  repository:'https://github.com/hfg-gmuend/openmoji',
  assetBase:'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/'
});

const GENERAL_ONLY=new Set(['photo','sac','ballon','balle','poule']);
const ROWS=Object.freeze([
['avion','avion','/avjɔ̃/','2708'],['voiture','voiture','/vwatyʁ/','1F697'],['bus','bus','/bys/','1F68C'],['train','train','/tʁɛ̃/','1F686'],['bateau','bateau','/bato/','26F5'],['velo','vélo','/velo/','1F6B2'],['moto','moto','/moto/','1F3CD'],['fusee','fusée','/fyze/','1F680'],['maison','maison','/mɛzɔ̃/','1F3E0'],['porte','porte','/pɔʁt/','1F6AA'],['chaise','chaise','/ʃɛz/','1FA91'],['telephone','téléphone','/telefɔn/','1F4F1'],['ordinateur','ordinateur','/ɔʁdinatœʁ/','1F4BB'],['television','télévision','/televizjɔ̃/','1F4FA'],['radio','radio','/ʁadjo/','1F4FB'],['photo','photo','/foto/','1F4F7'],['montre','montre','/mɔ̃tʁ/','231A'],['reveil','réveil','/ʁevɛj/','23F0'],['livre','livre','/livʁ/','1F4D6'],['crayon','crayon','/kʁɛjɔ̃/','270F'],['stylo','stylo','/stilo/','1F58A'],['ciseaux','ciseaux','/sizo/','2702'],['regle','règle','/ʁɛɡl/','1F4CF'],['sac','sac','/sak/','1F45C'],['cadeau','cadeau','/kado/','1F381'],['ballon','ballon','/balɔ̃/','26BD'],['balle','balle','/bal/','1F3BE'],['guitare','guitare','/ɡitaʁ/','1F3B8'],['piano','piano','/pjano/','1F3B9'],['tambour','tambour','/tɑ̃buʁ/','1F941'],['cloche','cloche','/klɔʃ/','1F514'],['cadenas','cadenas','/kadna/','1F512'],['marteau','marteau','/maʁto/','1F528'],['hache','hache','/aʃ/','1FA93'],['aimant','aimant','/ɛmɑ̃/','1F9F2'],['roue','roue','/ʁu/','1F6DE'],['bougie','bougie','/buʒi/','1F56F'],['feu','feu','/fø/','1F525'],['etoile','étoile','/etwal/','2B50'],['lune','lune','/lyn/','1F319'],['soleil','soleil','/sɔlɛj/','2600'],['nuage','nuage','/nɥaʒ/','2601'],['neige','neige','/nɛʒ/','2744'],['eclair','éclair','/eklɛʁ/','26A1'],['arcenciel','arc-en-ciel','/aʁkɑ̃sjɛl/','1F308'],['arbre','arbre','/aʁbʁ/','1F333'],['fleur','fleur','/flœʁ/','1F33C'],['rose','rose','/ʁoz/','1F339'],['feuille','feuille','/fœj/','1F343'],['champignon','champignon','/ʃɑ̃piɲɔ̃/','1F344'],['pomme','pomme','/pɔm/','1F34E'],['poire','poire','/pwaʁ/','1F350'],['orange','orange','/ɔʁɑ̃ʒ/','1F34A'],['citron','citron','/sitʁɔ̃/','1F34B'],['banane','banane','/banan/','1F34C'],['raisin','raisin','/ʁɛzɛ̃/','1F347'],['fraise','fraise','/fʁɛz/','1F353'],['cerise','cerise','/səʁiz/','1F352'],['pasteque','pastèque','/pastɛk/','1F349'],['carotte','carotte','/kaʁɔt/','1F955'],['tomate','tomate','/tɔmat/','1F345'],['patate','patate','/patat/','1F954'],['pain','pain','/pɛ̃/','1F35E'],['fromage','fromage','/fʁɔmaʒ/','1F9C0'],['oeuf','œuf','/œf/','1F95A'],['lait','lait','/lɛ/','1F95B'],['miel','miel','/mjɛl/','1F36F'],['gateau','gâteau','/ɡato/','1F370'],['bonbon','bonbon','/bɔ̃bɔ̃/','1F36C'],['glace','glace','/ɡlas/','1F366'],['pizza','pizza','/pidza/','1F355'],['poisson','poisson','/pwasɔ̃/','1F41F'],['poule','poule','/pul/','1F414'],['vache','vache','/vaʃ/','1F404'],['cheval','cheval','/ʃəval/','1F40E'],['chien','chien','/ʃjɛ̃/','1F415'],['lapin','lapin','/lapɛ̃/','1F407'],['souris','souris','/suʁi/','1F401'],['cochon','cochon','/kɔʃɔ̃/','1F416'],['mouton','mouton','/mutɔ̃/','1F411'],['chevre','chèvre','/ʃɛvʁ/','1F410'],['lion','lion','/ljɔ̃/','1F981'],['tigre','tigre','/tiɡʁ/','1F405'],['singe','singe','/sɛ̃ʒ/','1F412'],['ours','ours','/uʁs/','1F43B'],['panda','panda','/pɑ̃da/','1F43C'],['koala','koala','/kɔala/','1F428'],['grenouille','grenouille','/ɡʁənuj/','1F438'],['serpent','serpent','/sɛʁpɑ̃/','1F40D'],['tortue','tortue','/tɔʁty/','1F422'],['escargot','escargot','/ɛskaʁɡo/','1F40C'],['papillon','papillon','/papijɔ̃/','1F98B'],['abeille','abeille','/abɛj/','1F41D'],['fourmi','fourmi','/fuʁmi/','1F41C'],['araignee','araignée','/aʁɛɲe/','1F577'],['crabe','crabe','/kʁab/','1F980'],['oeil','œil','/œj/','1F441'],['oreille','oreille','/ɔʁɛj/','1F442'],['bouche','bouche','/buʃ/','1F444'],['langue','langue','/lɑ̃ɡ/','1F445'],['main','main','/mɛ̃/','270B'],['pied','pied','/pje/','1F9B6'],['dent','dent','/dɑ̃/','1F9B7'],['os','os','/ɔs/','1F9B4'],['cerveau','cerveau','/sɛʁvo/','1F9E0'],['coeur','cœur','/kœʁ/','2764'],['chapeau','chapeau','/ʃapo/','1F3A9'],['chaussure','chaussure','/ʃosyʁ/','1F45F'],['botte','botte','/bɔt/','1F462'],['pantalon','pantalon','/pɑ̃talɔ̃/','1F456'],['robe','robe','/ʁɔb/','1F457'],['lunettes','lunettes','/lynɛt/','1F453'],['couronne','couronne','/kuʁɔn/','1F451'],['montagne','montagne','/mɔ̃taɲ/','26F0'],['ile','île','/il/','1F3DD'],['pont','pont','/pɔ̃/','1F309'],['chateau','château','/ʃato/','1F3F0'],['ecole','école','/ekɔl/','1F3EB'],['hopital','hôpital','/opital/','1F3E5']
]);

export const OPEN_PICTOGRAMS=Object.freeze(ROWS.map(([id,label,ipa,code])=>Object.freeze({
  id,label,ipa,
  image:`${OPENMOJI_SOURCE.assetBase}${code}.svg`,
  assetSource:`openmoji:${code}`,
  sourceFile:`color/svg/${code}.svg`,
  sourceCommit:OPENMOJI_SOURCE.sourceCommit,
  sourceLicense:OPENMOJI_SOURCE.license,
  active:true,
  strictEligible:!GENERAL_ONLY.has(id),
  libraryTier:'phonetic_concept',
  clinicalStatus:'unreviewed',
  visualConfidence:0.9,
  labelStability:GENERAL_ONLY.has(id)?0.68:0.82
})));

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function mergeOpenPictograms(seed=[]){
  const result=[...(seed||[])];
  const ids=new Set(result.map(item=>item?.id).filter(Boolean));
  const labels=new Set(result.map(item=>normalizeKey(item?.label)).filter(Boolean));
  for(const item of OPEN_PICTOGRAMS){
    const key=normalizeKey(item.label);
    if(ids.has(item.id)||labels.has(key))continue;
    result.push({...item});
    ids.add(item.id);labels.add(key);
  }
  return result;
}

const NUMBER_READINGS=Object.freeze([
  {grapheme:'0',reading:'zéro',ipa:'/zeʁo/'},{grapheme:'1',reading:'un',ipa:'/ɛ̃/'},{grapheme:'2',reading:'deux',ipa:'/dø/'},{grapheme:'3',reading:'trois',ipa:'/tʁwa/'},{grapheme:'4',reading:'quatre',ipa:'/katʁ/'},{grapheme:'5',reading:'cinq',ipa:'/sɛ̃k/'},{grapheme:'6',reading:'six',ipa:'/sis/'},{grapheme:'7',reading:'sept',ipa:'/sɛt/'},{grapheme:'8',reading:'huit',ipa:'/ɥit/'},{grapheme:'9',reading:'neuf',ipa:'/nœf/'},{grapheme:'10',reading:'dix',ipa:'/dis/'},{grapheme:'100',reading:'cent',ipa:'/sɑ̃/'}
]);

export function numberReadingForIPA(value=''){
  const normalized=normalizeIPA(value);
  return NUMBER_READINGS.find(item=>normalizeIPA(item.ipa)===normalized)||null;
}

function gapToken(token){return typeof token==='string'&&token.startsWith('[')&&token.endsWith(']');}

export function buildOpenPictogramGapTargets(report={}){
  const strictByIpa=new Map();
  for(const item of OPEN_PICTOGRAMS){
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
      out.push({target:example.word,targetIpa:example.ipa,mode:'strict',assets:'ready',therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-blending','oral-to-written'],source:'open-pictogram-gap',generated:true,frequency:Number(example.frequency||0),operationCount:Array.isArray(example.frame)?example.frame.length:2});
    }
  }
  return out;
}

export function buildNumberGapTargets(report={}){
  const out=[];const seen=new Set();
  for(const gap of report?.missingSounds||[]){
    const number=numberReadingForIPA(gap?.ipa||'');
    if(!number)continue;
    for(const example of gap?.examples||[]){
      const frame=Array.isArray(example?.frame)?example.frame:[];
      if(!example?.word||!example?.ipa||frame.length<2||frame.length>4||frame.filter(gapToken).length!==1)continue;
      const operations=frame.map(token=>gapToken(token)?{type:'grapheme',grapheme:number.grapheme,reading:number.reading}:{type:'whole_word',pieceId:token});
      const key=`${normalizeKey(example.word)}|${operations.map(op=>`${op.type}:${op.pieceId||op.grapheme}`).join('+')}`;
      if(seen.has(key))continue;seen.add(key);
      out.push({target:example.word,targetIpa:example.ipa,mode:'general',assets:'ready',operations,source:'coverage-report-number',generated:true,frequency:Number(example.frequency||0),operationCount:operations.length});
    }
  }
  return out;
}

export function openPictogramLibraryStats(){
  return {total:OPEN_PICTOGRAMS.length,strictEligible:OPEN_PICTOGRAMS.filter(item=>item.strictEligible!==false).length,generalOnly:OPEN_PICTOGRAMS.filter(item=>item.strictEligible===false).length,source:OPENMOJI_SOURCE.project,license:OPENMOJI_SOURCE.license};
}
