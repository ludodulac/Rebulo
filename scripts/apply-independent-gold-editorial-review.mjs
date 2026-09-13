import fs from 'node:fs';
const p='data/independent-sense-gold-150.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
const YES=new Set(['ISG-001','ISG-002','ISG-003','ISG-004','ISG-005','ISG-006','ISG-007','ISG-008','ISG-009','ISG-010','ISG-011','ISG-012','ISG-013','ISG-014','ISG-015','ISG-016','ISG-017','ISG-018','ISG-019','ISG-020','ISG-021','ISG-042','ISG-052','ISG-054','ISG-056','ISG-058','ISG-059','ISG-060','ISG-061','ISG-062','ISG-073','ISG-085','ISG-087','ISG-091','ISG-098','ISG-108','ISG-109','ISG-111','ISG-118','ISG-119','ISG-120','ISG-125','ISG-126','ISG-127','ISG-131','ISG-132','ISG-143','ISG-145']);
const LOW=new Set(['ISG-001','ISG-002','ISG-003','ISG-004','ISG-008','ISG-009','ISG-010','ISG-013','ISG-014','ISG-017','ISG-018','ISG-019','ISG-021','ISG-052','ISG-054','ISG-058','ISG-059','ISG-061','ISG-118','ISG-120','ISG-127','ISG-143']);
const conceptOverride={
 'ISG-042':'pasteur (personne exerçant le rôle religieux)',
 'ISG-054':'cahier (objet de papeterie)',
 'ISG-056':'grenier (pièce sous toiture)',
 'ISG-060':'marché (lieu de vente avec étals)',
 'ISG-073':'allée (chemin aménagé)',
 'ISG-085':'bouchon (obturateur de bouteille)',
 'ISG-087':'kit (ensemble d’éléments vendu comme unité)',
 'ISG-091':'vison (animal)',
 'ISG-098':'fax (appareil ou document de télécopie)',
 'ISG-108':'rosé (vin rosé)',
 'ISG-109':'proue (avant d’un navire)',
 'ISG-111':'pâtée (nourriture préparée, notamment animale)',
 'ISG-119':'espace (espace cosmique)',
 'ISG-125':'champagne (boisson effervescente)',
 'ISG-126':'argent (monnaie)',
 'ISG-132':'appart (appartement)',
 'ISG-145':'rôti (pièce de viande rôtie)'
};
for(const r of d.rows){
 const yes=YES.has(r.goldId);
 r.goldReview={
  status:'editorial_reviewed_before_source',
  seriousVisualConcept:yes,
  expectedConcept:yes?(conceptOverride[r.goldId]??r.exactWord):null,
  risk:yes?(LOW.has(r.goldId)?'low':'medium'):'high',
  rationale: yes
   ? (LOW.has(r.goldId)?'Entité ou objet autonome, lexicalement courant et visuellement distinctif.':'Concept visuel plausible mais avec synonymie, polysémie ou contexte à surveiller.')
   : 'Le mot ne fournit pas ici un concept visuel autonome assez stable : abstraction, flexion/action, rareté, polysémie ou dénomination concurrente trop forte.'
 };
}
d.status='gold_frozen_before_source_ingestion';
d.sourceLookedAt=false;
d.editorialReview={reviewerKind:'project_editorial_analysis',humanNamingEvidence:'none',reviewedCount:d.rows.length,positiveCount:d.rows.filter(r=>r.goldReview.seriousVisualConcept).length,negativeCount:d.rows.filter(r=>!r.goldReview.seriousVisualConcept).length,reviewCompletedBeforeStructuredSourceIngestion:true,notes:['This is editorial semantic/visual gold, not human naming evidence.','Gold decisions are evaluation labels only and must never be imported into decision rules.']};
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
console.log(JSON.stringify(d.editorialReview,null,2));