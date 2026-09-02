const RULES=Object.freeze([
  ['euil','œj'],['euille','œj'],['ouille','uj'],['aille','aj'],['eille','ɛj'],['ille','ij'],
  ['oin','wɛ̃'],['ien','jɛ̃'],['ion','jɔ̃'],['ui','ɥi'],['oi','wa'],['ou','u'],
  ['ain','ɛ̃'],['ein','ɛ̃'],['aim','ɛ̃'],['in','ɛ̃'],['im','ɛ̃'],['un','œ̃'],['um','œ̃'],['on','ɔ̃'],['om','ɔ̃'],['an','ɑ̃'],['am','ɑ̃'],['en','ɑ̃'],['em','ɑ̃'],
  ['ph','f'],['ch','ʃ'],['gn','ɲ'],['j','ʒ'],['r','ʁ'],['y','j'],
  ['a','a'],['â','a'],['i','i'],['î','i'],['u','y'],['é','e'],['er','e'],['ez','e'],['è','ɛ'],['ê','ɛ'],['ai','ɛ'],['et','ɛ'],['au','o'],['eau','o'],['o','o'],['eu','ø'],['oeu','œ'],
  ['p','p'],['b','b'],['t','t'],['d','d'],['k','k'],['c','k'],['q','k'],['g','g'],['f','f'],['v','v'],['s','s'],['z','z'],['m','m'],['n','n'],['l','l']
]);

const ALIASES=Object.freeze({
  'och':['ɔʃ','oʃ'],'oche':['ɔʃ','oʃ'],'ach':['aʃ'],'ache':['aʃ'],'iche':['iʃ'],'ouche':['uʃ'],'uche':['yʃ'],'èche':['ɛʃ'],'ech':['ɛʃ'],'èche':['ɛʃ'],
  'ra':['ʁa'],'ri':['ʁi'],'rou':['ʁu'],'ru':['ʁy'],'ré':['ʁe'],'re':['ʁə','ʁɛ'],'ro':['ʁo','ʁɔ'],'ran':['ʁɑ̃'],'ron':['ʁɔ̃'],'rin':['ʁɛ̃'],
  'cha':['ʃa'],'chi':['ʃi'],'chou':['ʃu'],'chu':['ʃy'],'ché':['ʃe'],'chè':['ʃɛ'],'cho':['ʃo','ʃɔ'],'chan':['ʃɑ̃'],'chon':['ʃɔ̃'],'chin':['ʃɛ̃'],
  'ja':['ʒa'],'ji':['ʒi'],'jou':['ʒu'],'ju':['ʒy'],'jé':['ʒe'],'jè':['ʒɛ'],'jo':['ʒo','ʒɔ'],'jan':['ʒɑ̃'],'jon':['ʒɔ̃'],'jin':['ʒɛ̃'],
  'an':['ɑ̃'],'en':['ɑ̃'],'on':['ɔ̃'],'in':['ɛ̃'],'ain':['ɛ̃'],'ein':['ɛ̃'],'un':['œ̃'],
  'eu':['ø','œ'],'oeu':['ø','œ'],'o':['o','ɔ'],'é':['e'],'è':['ɛ'],'ai':['ɛ'],
  'ye':['jə','je'],'ya':['ja'],'you':['ju'],'yon':['jɔ̃']
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
  return ['ra','cha','ou','on','ain','och','ouche','ron','chon','eu','gn','oin'];
}
