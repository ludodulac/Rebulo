const LITERAL_REJECT_TAGS=new Set(['figuratively','metonymically','analogy','broadly','form-of','inflection-template','misspelling','obsolete','rare']);
const STRONG_VISUAL_TOPICS=new Set(['anatomy','architecture','astronomy','botany','clothing','food','nautical','transport','vehicles','zoology']);
const STRONG_VISUAL_GLOSS_RE=/\b(?:animal|mammifère|oiseau|poisson|insecte|plante|arbre|fruit|légume|aliment|nourriture|boisson|objet|instrument|outil|appareil|machine|récipient|vêtement|chaussure|organe|partie du corps|véhicule|bateau|bâtiment|édifice|minéral|roche|étoile|astre|cours d[’']eau)\b/iu;

export function assessObservedSenseVisuality(senseCandidate){
  if(senseCandidate?.provenanceStatus!=='observed')return {status:'not_applicable',visualConceptCandidate:false,confidence:0,ruleId:'observed-required'};
  const pos=String(senseCandidate.sourcePOS||senseCandidate.pos||'').toLowerCase();
  if(!['noun','proper_noun','name'].includes(pos))return {status:'rejected',visualConceptCandidate:false,confidence:0.92,ruleId:'noun-pos-required'};
  const tags=(senseCandidate.sourceTags||[]).map(x=>String(x).toLowerCase());
  if(tags.some(t=>LITERAL_REJECT_TAGS.has(t)))return {status:'rejected',visualConceptCandidate:false,confidence:0.9,ruleId:'nonliteral-or-form-tag'};
  const topics=(senseCandidate.sourceTopics||[]).map(x=>String(x).toLowerCase());
  const def=String(senseCandidate.sourceDefinition||'');
  const topicHit=topics.some(t=>STRONG_VISUAL_TOPICS.has(t));
  const glossHit=STRONG_VISUAL_GLOSS_RE.test(def);
  if(topicHit||glossHit)return {status:'inferred_candidate',visualConceptCandidate:true,confidence:topicHit&&glossHit?0.92:0.85,ruleId:topicHit&&glossHit?'literal-noun-strong-topic-and-gloss':'literal-noun-strong-semantic-cue',evidence:[...(topicHit?['strong_visual_topic']:[]),...(glossHit?['strong_visual_gloss_hypernym']:[])]};
  return {status:'unresolved',visualConceptCandidate:false,confidence:0.68,ruleId:'observed-sense-without-strong-visual-proof'};
}

export const FILTER_VERSION='structured-visual-filter-v2.1';