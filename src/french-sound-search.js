const RULES=Object.freeze([
  ['oin','wɛ̃'],['ien','jɛ̃'],['ion','jɔ̃'],['ui','ɥi'],['oi','wa'],['ou','u'],
  ['ain','ɛ̃'],['ein','ɛ̃'],['in','ɛ̃'],['un','œ̃'],['on','ɔ̃'],['an','ɑ̃'],['en','ɑ̃'],
  ['ch','ʃ'],['gn','ɲ'],['j','ʒ'],['r','ʁ'],['y','j'],
  ['a','a'],['â','a'],['i','i'],['î','i'],['u','y'],['é','e'],['er','e'],['ez','e'],['è','ɛ'],['ê','ɛ'],['ai','ɛ'],['au','o'],['eau','o'],['o','o'],
  ['p','p'],['b','b'],['t','t'],['d','d'],['k','k'],['c','k'],['q','k'],['g','g'],['f','f'],['v','v'],['s','s'],['z','z'],['m','m'],['n','n'],['l','l']
]);

const ALIASES=Object.freeze({
  'och':['ɔʃ','oʃ'],'oche':['ɔʃ','oʃ'],'ach':['aʃ'],'iche':['iʃ'],'ouche':['uʃ'],'uche':['yʃ'],
  'ra':['ʁa'],'ri':['ʁi'],'rou':['ʁu'],'ru':['ʁy'],'ré':['ʁe'],'re':['ʁə','ʁɛ'],'ro':['ʁo','ʁɔ'],
  'cha':['ʃa'],'chi':['ʃi'],'chou':['ʃu'],'chu':['ʃy'],'ché':['ʃe'],'cho':['ʃo','ʃɔ']
});

export function normalizeFrenchSoundQuery(value=''){
  return String(value).trim().toLocaleLowerCase('fr').normalize('NFC').replace(/[\s\-_/]+/g,'');
}

function transliterate(query){
  let rest=query;let ipa='';
  while(rest){
    const rule=RULES.find(([text])=>rest.startsWith(text));
    if(!rule)return null;
    ipa+=rule[1];rest=rest.slice(rule[0].length);
  }
  return ipa||null;
}

export function resolveFrenchSoundQuery(value=''){
  const query=normalizeFrenchSoundQuery(value);
  if(!query)return {query:'',ipaCandidates:[],ambiguous:false};
  const explicit=ALIASES[query];
  const candidates=explicit||[transliterate(query)].filter(Boolean);
  return {query,ipaCandidates:[...new Set(candidates)],ambiguous:candidates.length>1};
}

export function frenchSoundHelp(){
  return ['ra','cha','ou','on','ain','och','ouche','ri','eau'];
}
