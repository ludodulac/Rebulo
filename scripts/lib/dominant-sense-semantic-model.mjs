export const TAXONOMY=['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool','material','event','action','abstract','relation','symbol','text','quantity','other'];
export const MODEL_VERSION='dominant-sense-semantic-v2';
const lower=x=>String(x??'').toLocaleLowerCase('fr');
const BAD_TAG=/\b(?:obsolete|archaic|rare|dated|historical|figurative|figuratively|metonymic|metonymically|form-of|inflection|misspelling|nonstandard)\b/iu;
const topicText=s=>(s.sourceTopics||[]).map(lower).join(' ');
const defText=s=>lower(s.sourceDefinition||'').replace(/^\([^)]*\)\s*/u,'').trim();
const starts=(d,re)=>re.test(d.slice(0,180));

export function semanticType(s){
 const d=defText(s),topics=topicText(s),pos=lower(s.sourcePOS||s.pos);
 // Structured topical metadata has priority when it is specific.
 if(/\b(?:zoology|ornithology|ichthyology|entomology)\b/u.test(topics))return 'animal';
 if(/\b(?:botany)\b/u.test(topics))return 'plant';
 if(/\b(?:anatomy)\b/u.test(topics))return 'body_part';
 if(/\b(?:food|cuisine|cooking|gastronomy)\b/u.test(topics))return 'food';
 if(/\b(?:clothing|fashion)\b/u.test(topics))return 'clothing';
 if(/\b(?:transport|vehicles|automotive|nautical|aviation)\b/u.test(topics)&&starts(d,/^(?:véhicule|voiture|automobile|camion|chariot|charriot|bateau|navire|aéronef)/u))return 'vehicle';
 // Hypernym / head-of-definition patterns: evidence about the defined sense itself, not incidental words later in the gloss.
 if(starts(d,/^(?:animal|mammifère|oiseau|poisson|insecte|reptile|amphibien|mollusque)\b/u))return 'animal';
 if(starts(d,/^(?:plante|arbre|arbuste|herbe|végétal|nom usuel des arbres|genre d['’]arbre)\b/u))return 'plant';
 if(starts(d,/^(?:aliment|nourriture|boisson|plat|préparation culinaire)\b/u))return 'food';
 if(starts(d,/^(?:doigt|partie (?:du|de la) corps|partie anatomique|organe anatomique|os\b|muscle\b|peau\b|cheveu\b|joue\b|flanc\b)/u))return 'body_part';
 if(starts(d,/^(?:personne|individu|celui|celle|homme|femme|professionnel|ouvrier|officier|travailleur)\b/u))return 'person_role';
 if(starts(d,/^(?:véhicule|voiture|automobile|camion|chariot|charriot|bateau|navire|aéronef)\b/u))return 'vehicle';
 if(starts(d,/^(?:lieu|endroit|bâtiment|édifice|habitation|local|site|quartier|voie|terrain)\b/u))return 'place';
 if(starts(d,/^(?:vêtement|chaussure|habit|pièce de vêtement)\b/u))return 'clothing';
 if(starts(d,/^(?:instrument|outil|machine|appareil|ustensile|dispositif)\b/u))return 'tool';
 if(starts(d,/^(?:objet|récipient|meuble|bijou|ornement|élément mécanique|organe en forme|pièce mécanique)\b/u))return 'physical_object';
 if(starts(d,/^(?:substance|matière|matériau|minéral|mélange|liquide|gaz\b|élément chimique|produit)\b/u))return 'material';
 if(starts(d,/^(?:livre|document|texte|ouvrage|poème|journal|lettre écrite|bande dessinée)\b/u))return 'text';
 if(starts(d,/^(?:lettre (?:de|d['’])|caractère|symbole|signe|glyphe|notation)\b/u))return 'symbol';
 if(starts(d,/^(?:nombre|quantité|numéral|portion|millier)\b/u))return 'quantity';
 if(['verb'].includes(pos))return 'action';
 if(starts(d,/^(?:action de|fait de|événement|collision|saison|période)\b/u))return 'event';
 if(['prep','preposition','conj','conjunction','det','determiner','pron','pronoun'].includes(pos))return 'relation';
 if(['adj','adjective','adv','adverb'].includes(pos))return 'abstract';
 if(starts(d,/^(?:relation|direction|côté|manière|degré|état|qualité|sentiment|idée|notion|concept)\b/u))return 'abstract';
 return 'other';
}

const SAFE_VISUAL_TYPES=new Set(['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool']);
export function visualEligibility(s){
 const type=semanticType(s),tags=(s.sourceTags||[]).map(lower),d=defText(s);
 if(tags.some(x=>BAD_TAG.test(x)))return {eligible:false,type,reason:'usage_or_form_penalty'};
 if(SAFE_VISUAL_TYPES.has(type))return {eligible:true,type,reason:'safe_concrete_semantic_type'};
 if(type==='symbol')return {eligible:true,type,reason:'autonomous_symbol'};
 if(type==='event'&&starts(d,/^(?:collision|orage|pique-nique)\b/u))return {eligible:true,type,reason:'directly_depictable_event'};
 return {eligible:false,type,reason:'semantic_type_not_safely_visual'};
}

export function rankSense(s,index){
 const type=semanticType(s),elig=visualEligibility(s),pos=lower(s.sourcePOS||s.pos),tags=(s.sourceTags||[]).map(lower),def=String(s.sourceDefinition||'');let score=0;const evidence=[];
 // Dictionary order is only a lexicographic prior; it is explicitly not treated as corpus frequency.
 const orderPrior=Math.max(0,40-Math.min(index,10)*4);score+=orderPrior;evidence.push(`lexicographic_order_prior:${orderPrior}`);
 if(['noun','proper_noun','name'].includes(pos)){score+=8;evidence.push('noun_pos:+8');}else if(pos==='verb'){score+=2;evidence.push('verb_pos:+2');}
 if(elig.eligible){score+=12;evidence.push(`safe_visual_type_${type}:+12`);}else if(['abstract','relation','quantity'].includes(type)){score-=6;evidence.push(`nonvisual_type_${type}:-6`);}
 if(tags.some(x=>BAD_TAG.test(x))){score-=30;evidence.push('marked_usage_or_form:-30');}
 const structured=(s.sourceTopics||[]).length;if(structured){const b=Math.min(4,structured*2);score+=b;evidence.push(`specific_topics:+${b}`);}
 if(def.length>=20&&def.length<=200){score+=2;evidence.push('specific_gloss:+2');}
 return {score,type,visualEligibility:elig,evidence,sourceOrder:index+1};
}
export function rankObservedSenses(senses){return senses.map((s,i)=>({...s,semanticAnalysis:rankSense(s,i)})).sort((a,b)=>b.semanticAnalysis.score-a.semanticAnalysis.score||a.semanticAnalysis.sourceOrder-b.semanticAnalysis.sourceOrder);}
