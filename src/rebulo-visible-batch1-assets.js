import {normalizeIPA} from './phonetic-engine.js';

// Product materialization only. The phonetic/lexical authority remains the existing
// V1–V5 productive bank and canonical seed files referenced by sourceCuration.
const ROWS=Object.freeze([
  ['chien','chien','/ʃjɛ̃/',1,'data/rebus-productive-bank-wave4.json'],
  ['chat','chat','/ʃa/',1,'data/lexicon-seed.json'],
  ['train','train','/tʁɛ̃/',1,'data/rebus-productive-bank-wave4.json'],
  ['voiture','voiture','/vwatyʁ/',2,'data/rebus-productive-bank-wave4.json'],
  ['bebe','bébé','/bebe/',2,'data/rebus-productive-bank-wave4.json'],
  ['oeil','œil','/œj/',1,'data/rebus-productive-bank-wave4.json'],
  ['pied','pied','/pje/',1,'data/rebus-productive-bank-wave4.json'],
  ['soleil','soleil','/solɛj/',2,'data/rebus-productive-bank-wave4.json'],
  ['cheval','cheval','/ʃəval/',2,'data/rebus-productive-bank-wave4.json'],
  ['porte','porte','/pɔʁt/',1,'data/rebus-productive-bank-wave4.json'],
  ['livre','livre','/livʁ/',1,'data/rebus-productive-bank-wave4.json'],
  ['mer','mer','/mɛʁ/',1,'data/lexicon-seed.json'],
  ['scie','scie','/si/',1,'data/lexicon-seed.json'],
  ['pie','pie','/pi/',1,'data/lexicon-seed.json'],
  ['lit','lit','/li/',1,'data/lexicon-seed.json'],
  ['couteau','couteau','/kuto/',2,'data/lexicon-seed.json'],
  ['nid','nid','/ni/',1,'data/rebus-productive-bank-wave1.json'],
  ['route','route','/ʁut/',1,'data/rebus-productive-bank-wave2.json'],
  ['pomme','pomme','/pɔm/',1,'data/rebus-productive-bank-wave4.json'],
  ['table','table','/tabl/',1,'data/rebus-productive-bank-wave1.json'],
  ['banc','banc','/bɑ̃/',1,'data/rebus-productive-bank-wave1.json'],
  ['rat','rat','/ʁa/',1,'data/lexicon-seed.json'],
  ['nez','nez','/ne/',1,'data/lexicon-seed.json']
]);

const SPRITE_URL='assets/rebus/visible-batch1/sprite.svg';
const key=value=>String(value||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');

export const REBULO_VISIBLE_BATCH1=Object.freeze(ROWS.map(([id,label,ipa,syllableSpan,sourceCuration],index)=>Object.freeze({
  id,label,ipa,syllableSpan,sourceCuration,
  image:`${SPRITE_URL}?asset=${id}`,
  spriteUrl:SPRITE_URL,
  spriteColumn:index%5,
  spriteRow:Math.floor(index/5),
  active:true,
  strictEligible:true,
  clinicalStatus:'naming_test_required',
  spontaneousNamingRisk:'unknown',
  humanNamingEvidence:'none',
  clinicalEvidence:'none',
  assetSource:'rebulo_original:visible-batch1-v1',
  artRevision:`visible-batch1-${id}-v1`
})));

const BY_IPA=new Map(REBULO_VISIBLE_BATCH1.map(item=>[normalizeIPA(item.ipa),item]));
const BY_ID=new Map(REBULO_VISIBLE_BATCH1.map(item=>[key(item.id),item]));
const BY_LABEL=new Map(REBULO_VISIBLE_BATCH1.map(item=>[key(item.label),item]));

export function visibleBatch1AssetForPiece(piece={}){
  const byId=BY_ID.get(key(piece.id));
  if(byId)return byId;
  const byLabel=BY_LABEL.get(key(piece.reading||piece.label));
  if(byLabel&&(!piece.ipa||normalizeIPA(piece.ipa)===normalizeIPA(byLabel.ipa)))return byLabel;
  const byIpa=BY_IPA.get(normalizeIPA(piece.ipa||piece.targetIpa||''));
  return byIpa&&key(piece.reading||piece.label)===key(byIpa.label)?byIpa:null;
}

export function mergeVisibleBatch1Lexicon(lexicon=[]){
  const out=(lexicon||[]).map(item=>({...item}));
  for(const asset of REBULO_VISIBLE_BATCH1){
    const index=out.findIndex(item=>key(item?.id)===key(asset.id)||key(item?.label)===key(asset.label));
    const existing=index>=0?out[index]:{};
    const merged={...existing,...asset,ipa:asset.ipa,image:asset.image,active:true};
    if(index>=0)out[index]=merged;else out.push(merged);
  }
  return out;
}

export function applyVisibleBatch1ToPieces(pieces=[]){
  return (pieces||[]).map(piece=>{
    if(piece?.kind&&piece.kind!=='image')return piece;
    const asset=visibleBatch1AssetForPiece(piece);
    return asset?{...piece,id:asset.id,image:asset.image,reading:piece.reading||asset.label,label:piece.label||asset.label,ipa:piece.ipa||asset.ipa}:piece;
  });
}

export function applyVisibleBatch1ToPlayCatalog(items=[]){
  return (items||[]).map(item=>({...item,pieces:applyVisibleBatch1ToPieces(item?.pieces||[])}));
}

export function applyVisibleBatch1ToCreatorTargets(items=[]){
  const patchCandidate=candidate=>candidate?{...candidate,pieces:applyVisibleBatch1ToPieces(candidate.pieces||[])}:candidate;
  return (items||[]).map(item=>({
    ...item,
    directCandidate:patchCandidate(item?.directCandidate),
    alternatives:(item?.alternatives||[]).map(alt=>({...alt,directCandidate:patchCandidate(alt?.directCandidate)}))
  }));
}

export function applyVisibleBatch1ToBankRows(rows=[]){
  const byIpa=new Map((rows||[]).map(row=>[normalizeIPA(row?.ipa||''),{
    ...row,
    exactImageRepresentations:[...(row?.exactImageRepresentations||[])]
  }]));
  for(const asset of REBULO_VISIBLE_BATCH1){
    const ipa=normalizeIPA(asset.ipa);
    const row=byIpa.get(ipa)||{ipa,syllableSpans:[asset.syllableSpan],exactImageRepresentations:[],letters:[],numbers:[],musicNotes:[]};
    row.syllableSpans=[...new Set([...(row.syllableSpans||[]),asset.syllableSpan])];
    row.exactImageRepresentations=(row.exactImageRepresentations||[]).filter(rep=>key(rep?.label)!==key(asset.label)&&key(rep?.id)!==key(asset.id));
    row.exactImageRepresentations.unshift({
      id:`visible-batch1:${asset.id}`,
      label:asset.label,
      image:asset.image,
      kind:'whole_word_image',
      tier:'exact_image_ready',
      source:'rebulo_visible_batch1',
      strictEligible:true
    });
    byIpa.set(ipa,row);
  }
  return [...byIpa.values()];
}

export function visibleBatch1Stats(){
  return {
    count:REBULO_VISIBLE_BATCH1.length,
    oneSyllable:REBULO_VISIBLE_BATCH1.filter(item=>item.syllableSpan===1).length,
    twoSyllable:REBULO_VISIBLE_BATCH1.filter(item=>item.syllableSpan===2).length
  };
}
