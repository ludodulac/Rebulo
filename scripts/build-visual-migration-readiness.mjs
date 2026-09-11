import fs from 'node:fs';

const dependencyPath=process.argv[2]||'data/active-dependency-report.json';
const assetPath=process.argv[3]||'data/asset-sources.json';
const productionReviewPath=process.argv[4]||'data/production-naming-reviews.json';
const outputPath=process.argv[5]||'data/visual-migration-readiness.json';

const dependencies=JSON.parse(fs.readFileSync(dependencyPath,'utf8'));
const assetRegistry=JSON.parse(fs.readFileSync(assetPath,'utf8'));
const reviewRegistry=JSON.parse(fs.readFileSync(productionReviewPath,'utf8'));
const assetByPath=new Map((assetRegistry.assets||[]).filter(x=>x.active).map(x=>[x.path,x]));
const reviewByRevision=new Map((reviewRegistry.reviews||[]).map(x=>[`${x.concept}:${x.revision}`,x]));

function riskBand(loss){
  if(loss<=10)return 'low';
  if(loss<=40)return 'moderate';
  if(loss<=80)return 'high';
  return 'critical';
}

function nextGate(item){
  if(!item.provenanceDocumented)return 'document_provenance';
  if(!item.revisionStamped)return 'stamp_current_revision';
  if(!item.namingReviewAvailable)return 'add_revision_bound_naming_review';
  return 'collect_human_naming_observations';
}

const queue=(dependencies.dependencies||[]).map(dep=>{
  const asset=assetByPath.get(dep.image)||null;
  const embeddedOpenMoji=String(dep.assetSource||'').startsWith('openmoji:');
  const source=asset?.source||(embeddedOpenMoji?'openmoji':null);
  const provenanceDocumented=Boolean((asset&&source&&source!=='undocumented')||embeddedOpenMoji);
  const artRevision=asset?.artRevision||dep.artRevision||null;
  const revisionStamped=Boolean(artRevision);
  const review=revisionStamped?reviewByRevision.get(`${dep.label}:${artRevision}`)||reviewByRevision.get(`${dep.id}:${artRevision}`)||null:null;
  const namingReviewAvailable=Boolean(review);
  const readinessScore=(provenanceDocumented?1:0)+(revisionStamped?1:0)+(namingReviewAvailable?1:0);
  return {
    id:dep.id,label:dep.label,ipa:dep.ipa,image:dep.image,
    strictUniqueLossIfUnavailable:dep.strictUniqueLossIfUnavailable,
    dependencyRisk:riskBand(dep.strictUniqueLossIfUnavailable),
    provenanceDocumented,source:source||dep.assetSource||'undocumented',
    revisionStamped,artRevision,
    namingReviewAvailable,
    clinicalStatus:asset?.clinicalStatus||dep.clinicalStatus||'undocumented',
    readinessScore,
    nextGate:null
  };
}).map(item=>({...item,nextGate:nextGate(item)}))
  .sort((a,b)=>a.strictUniqueLossIfUnavailable-b.strictUniqueLossIfUnavailable||b.readinessScore-a.readinessScore||a.label.localeCompare(b.label,'fr'));

const report={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  baseline:dependencies.baseline,
  methodology:{
    ordering:'Dépendance stricte croissante, puis maturité de traçabilité décroissante. Les petites pertes sont les meilleurs pilotes techniques, sans autoriser un remplacement automatique.',
    readiness:'Provenance documentée + révision exacte + protocole de dénomination lié à cette révision. La collecte et la décision humaines restent séparées.',
    clinicalCaution:'Cette file organise la migration visuelle du produit. Elle ne prouve ni stabilité de dénomination, ni efficacité thérapeutique, ni validation clinique.'
  },
  queue
};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(`Visual migration readiness: ${queue.length} active pictograms; first gates: ${queue.slice(0,5).map(x=>`${x.label}:${x.nextGate}`).join(', ')}`);
