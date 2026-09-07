export const SYLLABLE_PRINT_LIBRARY=Object.freeze([
  {id:'mer',label:'mer',ipa:'/mɛʁ/',image:'assets/rebus/mer.svg',status:'active'},
  {id:'scie',label:'scie',ipa:'/si/',image:'assets/rebus/scie.svg',status:'active'},
  {id:'nez',label:'nez',ipa:'/ne/',image:'assets/rebus/nez.svg',status:'active'},
  {id:'mat',label:'mât',ipa:'/ma/',image:'assets/rebus/mat.svg',status:'active'},
  {id:'pas',label:'pas',ipa:'/pa/',image:'assets/rebus/pas.svg',status:'active'},
  {id:'rat',label:'rat',ipa:'/ʁa/',image:'assets/rebus/rat.svg',status:'active'},
  {id:'pluie',label:'pluie',ipa:'/plɥi/',image:'assets/rebus/pluie.svg',status:'active'},
  {id:'sol',label:'sol',ipa:'/sɔl/',image:'assets/rebus/sol.svg',status:'active'},
  {id:'pie',label:'pie',ipa:'/pi/',image:'assets/rebus/pie.svg',status:'active'},
  {id:'mie',label:'mie',ipa:'/mi/',image:'assets/rebus/mie.svg',status:'active'},
  {id:'de',label:'dé',ipa:'/de/',image:'assets/rebus/de.svg',status:'active'},
  {id:'tour',label:'tour',ipa:'/tuʁ/',image:'assets/rebus/tour.svg',status:'active'},
  {id:'lit',label:'lit',ipa:'/li/',image:'assets/rebus/lit.svg',status:'active'},
  {id:'riz',label:'riz',ipa:'/ʁi/',image:'assets/rebus/riz.svg',status:'active'},
  {id:'chat',label:'chat',ipa:'/ʃa/',image:'assets/rebus/chat.svg',status:'active'},
  {id:'cle',label:'clé',ipa:'/kle/',image:'assets/rebus/cle.svg',status:'active'},
  {id:'the',label:'thé',ipa:'/te/',image:'assets/rebus/the.svg',status:'active'},
  {id:'tas',label:'tas',ipa:'/ta/',image:'assets/rebus/tas.svg',status:'active'},
  {id:'eau',label:'eau',ipa:'/o/',image:'assets/rebus/eau.svg',status:'active'},
  {id:'corps',label:'corps',ipa:'/kɔʁ/',image:'assets/rebus/corps.svg',status:'active'},
  {id:'pot',label:'pot',ipa:'/po/',image:'assets/rebus/pot-comic.svg',status:'active'},
  {id:'dos',label:'dos',ipa:'/do/',image:'assets/rebus/dos-comic.svg',status:'active'},
  {id:'raie',label:'raie',ipa:'/ʁɛ/',image:'assets/rebus/raie-comic.svg',status:'active'},
  {id:'terre',label:'terre',ipa:'/tɛʁ/',image:'assets/rebus/terre-comic.svg',status:'active'},
  {id:'mat-prototype',label:'mât',ipa:'/ma/',image:'assets/research/mat-boat-arrow-comic-v1.svg',status:'research',note:'Voilier avec flèche vers le mât'},
  {id:'tour-prototype',label:'tour',ipa:'/tuʁ/',image:'assets/research/tour-chess-rook-comic-v1.svg',status:'research',note:"Tour de jeu d'échecs"},
  {id:'tas-prototype',label:'tas',ipa:'/ta/',image:'assets/research/tas-leaves-comic-v1.svg',status:'research',note:'Tas de feuilles'},
  {id:'cor-prototype',label:'cor',ipa:'/kɔʁ/',image:'assets/research/cor-horn-comic-v1.svg',status:'research',note:'Cor musical - alternative à corps'}
]);

export function syllablePrintItems({includeResearch=true}={}){
  return SYLLABLE_PRINT_LIBRARY.filter(item=>includeResearch||item.status==='active');
}

export function syllablePrintMeta(){
  const active=SYLLABLE_PRINT_LIBRARY.filter(item=>item.status==='active').length;
  const research=SYLLABLE_PRINT_LIBRARY.filter(item=>item.status==='research').length;
  return {count:SYLLABLE_PRINT_LIBRARY.length,active,research,scope:'short_rebus_sound_bricks'};
}
