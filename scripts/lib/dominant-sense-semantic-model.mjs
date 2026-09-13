export const TAXONOMY=['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool','material','event','action','abstract','relation','symbol','text','quantity','other'];
export const MODEL_VERSION='dominant-sense-semantic-v1';
const lower=x=>String(x??'').toLocaleLowerCase('fr');
const joined=s=>[s.sourceDefinition,...(s.sourceGlosses||[]),...(s.sourceTopics||[]),...(s.sourceCategories||[]),...(s.sourceTags||[])].map(lower).join(' ');
const has=(t,re)=>re.test(t);
const BAD_TAG=/\b(?:obsolete|archaic|rare|dated|historical|figurative|figuratively|metonymic|metonymically|form-of|inflection|misspelling|nonstandard)\b/iu;

export function semanticType(s){
 const t=joined(s),pos=lower(s.sourcePOS||s.pos);
 if(has(t,/\b(?:zoolog|animal|mammif|oiseau|poisson|insecte|reptile|amphibien|mollusque)\b/iu))return 'animal';
 if(has(t,/\b(?:botan|plante|arbre|arbuste|herbe|fleur|végétal|mousse végétale)\b/iu))return 'plant';
 if(has(t,/\b(?:aliment|nourriture|boisson|culin|gastronom|plat|fromage|viande|fruit|légume)\b/iu))return 'food';
 if(has(t,/\b(?:anatom|partie du corps|organe|doigt|peau|visage|muscle|os\b|cheveu|joue\b|flanc\b)\b/iu))return 'body_part';
 if(has(t,/\b(?:profession|métier|personne qui|travailleur|officier|chef|seigneur|chanteur|danseur|chasseur|coiffeur|facteur postal|shérif|shogun)\b/iu))return 'person_role';
 if(has(t,/\b(?:véhicule|automobile|voiture|camion|charriot|chariot|bateau|navire|aéronef|transport)\b/iu))return 'vehicle';
 if(has(t,/\b(?:géograph|lieu|endroit|bâtiment|édifice|quartier|chantier|couvent|halle|tanière|cachette)\b/iu))return 'place';
 if(has(t,/\b(?:vêtement|habillement|chaussure|chemise|pantalon|robe|chapeau)\b/iu))return 'clothing';
 if(has(t,/\b(?:outil|instrument|appareil|machine|broyeur|canne|pieu|ustensile)\b/iu))return 'tool';
 if(has(t,/\b(?:chimie|substance|matière|matériau|minéral|gaz\b|liquide|carburant|métal|mousse|shampoing|azote|essence)\b/iu))return 'material';
 if(has(t,/\b(?:document|texte|livre|ouvrage|manuel|journal|lettre écrite|bande dessinée|comics|poème)\b/iu))return 'text';
 if(has(t,/\b(?:lettre de l['’]alphabet|caractère|symbole|signe|typograph|notation|glyphe)\b/iu))return 'symbol';
 if(has(t,/\b(?:nombre|quantité|numéral|cardinal|ordinal|mathém|portion|millier)\b/iu))return 'quantity';
 if(['verb'].includes(pos))return 'action';
 if(has(t,/\b(?:action de|fait de|événement|collision|orage|saison|session|pique-nique|hiver)\b/iu))return 'event';
 if(['prep','preposition','conj','conjunction','det','determiner','pron','pronoun'].includes(pos))return 'relation';
 if(['adj','adjective','adv','adverb'].includes(pos))return 'abstract';
 if(has(t,/\b(?:relation|direction|côté|manière|degré|état|qualité|sentiment|idée|notion|concept|bonheur|peur|fierté|mystère)\b/iu))return 'abstract';
 if(has(t,/\b(?:objet|récipient|meuble|bijou|boîte|bulle|bougie|chandelle|volant|casier|microphone|compteur)\b/iu))return 'physical_object';
 if(pos==='noun'||pos==='proper_noun'||pos==='name')return 'other';
 return 'other';
}

const VISUAL_TYPES=new Set(['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool','material']);
export function visualEligibility(s){
 const type=semanticType(s),tags=(s.sourceTags||[]).map(lower),t=joined(s);
 if(tags.some(x=>BAD_TAG.test(x))||BAD_TAG.test(t))return {eligible:false,type,reason:'usage_or_nonliteral_penalty'};
 if(VISUAL_TYPES.has(type))return {eligible:true,type,reason:'concrete_semantic_type'};
 if(type==='action'&&has(t,/\b(?:courir|chanter|pêcher|voler|toucher|botter|danser|masser)\b/iu))return {eligible:true,type,reason:'directly_depictable_action'};
 if(type==='event'&&has(t,/\b(?:collision|orage|pique-nique|hiver)\b/iu))return {eligible:true,type,reason:'directly_depictable_event'};
 if(type==='symbol')return {eligible:true,type,reason:'autonomous_symbol'};
 return {eligible:false,type,reason:'semantic_type_not_safely_visual'};
}

export function rankSense(s,index){
 const t=joined(s),type=semanticType(s),elig=visualEligibility(s),pos=lower(s.sourcePOS||s.pos);let score=0;const evidence=[];
 const orderPrior=Math.max(0,24-Math.min(index,12)*2);score+=orderPrior;evidence.push(`source_order_prior:${orderPrior}`);
 if(['noun','proper_noun','name'].includes(pos)){score+=10;evidence.push('noun_pos:+10');}
 else if(pos==='verb'){score+=4;evidence.push('verb_pos:+4');}
 if(elig.eligible){score+=18;evidence.push(`visual_type_${type}:+18`);}else if(['abstract','relation','quantity'].includes(type)){score-=8;evidence.push(`nonvisual_type_${type}:-8`);}
 const tags=(s.sourceTags||[]).map(lower);if(tags.some(x=>BAD_TAG.test(x))||BAD_TAG.test(t)){score-=24;evidence.push('marked_or_nonliteral:-24');}
 const metadata=((s.sourceTopics||[]).length+(s.sourceCategories||[]).length);if(metadata){const b=Math.min(6,metadata);score+=b;evidence.push(`structured_metadata:+${b}`);}
 const def=String(s.sourceDefinition||'');if(def.length>=25&&def.length<=220){score+=3;evidence.push('specific_gloss:+3');}
 return {score,type,visualEligibility:elig,evidence,sourceOrder:index+1};
}

export function rankObservedSenses(senses){return senses.map((s,i)=>({...s,semanticAnalysis:rankSense(s,i)})).sort((a,b)=>b.semanticAnalysis.score-a.semanticAnalysis.score||a.semanticAnalysis.sourceOrder-b.semanticAnalysis.sourceOrder);}
