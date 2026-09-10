import fs from 'node:fs';
import path from 'node:path';

const curationPath=process.argv[2]||'data/rebus-sound-visual-curation.json';
const assetSourcesPath=process.argv[3]||'data/asset-sources.json';
const batchPath=process.argv[4]||'data/rebus-representation-curation-batch.json';
const outputPath=process.argv[5]||'data/rebus-prototype-asset-gap-audit.json';
const reportPath=process.argv[6]||'docs/REBUS_PROTOTYPE_ASSET_GAPS.md';
for(const file of [curationPath,assetSourcesPath,batchPath])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

const curation=JSON.parse(fs.readFileSync(curationPath,'utf8'));
const assetSources=JSON.parse(fs.readFileSync(assetSourcesPath,'utf8'));
const batch=JSON.parse(fs.readFileSync(batchPath,'utf8'));
const normalized=value=>String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
const prototypeEntries=(curation.entries||[]).filter(item=>item?.decision==='prototype_candidate');
const batchByIpa=new Map((batch.rows||[]).map(row=>[String(row.ipa||''),row]));
const assetsByConcept=new Map();
for(const asset of assetSources.assets||[]){
  const key=normalized(asset.concept||'');
  if(!key)continue;
  const list=assetsByConcept.get(key)||[];list.push(asset);assetsByConcept.set(key,list);
}

const rows=prototypeEntries.map(entry=>{
  const assets=assetsByConcept.get(normalized(entry.candidate))||[];
  const research=assets.filter(asset=>asset.lifecycleStatus==='research_prototype'&&!asset.active);
  const production=assets.filter(asset=>asset.active);
  const historical=assets.filter(asset=>asset.lifecycleStatus==='historical');
  const queue=batchByIpa.get(entry.ipa)||{};
  const state=research.length?'research_asset_exists':production.length?'production_asset_exists_not_naming_validated':historical.length?'historical_asset_only':'no_registered_asset';
  return {
    ipa:entry.ipa,
    candidate:entry.candidate,
    visualConcept:entry.visualConcept||null,
    visualPlausibility:entry.visualPlausibility||null,
    spontaneousNamingRisk:entry.spontaneousNamingRisk||null,
    mainConfusions:entry.mainConfusions||[],
    usefulTargetCount:Number(queue.usefulTargetCount)||0,
    usefulExamples:(queue.usefulExamples||[]).slice(0,6),
    state,
    researchAssets:research.map(asset=>({path:asset.path,artRevision:asset.artRevision,clinicalStatus:asset.clinicalStatus})),
    productionAssets:production.map(asset=>({path:asset.path,artRevision:asset.artRevision,clinicalStatus:asset.clinicalStatus})),
    historicalAssets:historical.map(asset=>({path:asset.path,artRevision:asset.artRevision,clinicalStatus:asset.clinicalStatus})),
    nextGate:research.length?'run_naming_test_on_existing_research_asset':production.length?'review_exact_production_revision_before_any_replacement':historical.length?'decide_whether_historical_concept_is_reusable_or_redesign':'create_research_prototype_then_naming_test',
    automaticActivation:false
  };
}).sort((a,b)=>{
  const stateRank={research_asset_exists:0,production_asset_exists_not_naming_validated:1,historical_asset_only:2,no_registered_asset:3};
  return (stateRank[a.state]??9)-(stateRank[b.state]??9)||b.usefulTargetCount-a.usefulTargetCount||a.candidate.localeCompare(b.candidate,'fr');
});
const counts={
  curatedPrototypeCount:rows.length,
  researchAssetExists:rows.filter(row=>row.state==='research_asset_exists').length,
  productionAssetExists:rows.filter(row=>row.state==='production_asset_exists_not_naming_validated').length,
  historicalAssetOnly:rows.filter(row=>row.state==='historical_asset_only').length,
  noRegisteredAsset:rows.filter(row=>row.state==='no_registered_asset').length
};
const output={schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'asset_gap_audit_only',purpose:'Prevent duplicate drawing work and identify the smallest safe visual-production wave for already curated sound candidates.',counts,rows};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
const lines=['# Rebulo — audit des assets pour les prototypes curatés','', '> Cet audit ne crée ni n’active aucune image. Il vérifie d’abord si un stimulus existe déjà avant toute nouvelle production.','',`- Hypothèses visuelles curatées : ${counts.curatedPrototypeCount}.`,`- Prototype de recherche déjà enregistré : ${counts.researchAssetExists}.`,`- Asset de production du même concept déjà enregistré : ${counts.productionAssetExists}.`,`- Asset uniquement historique : ${counts.historicalAssetOnly}.`,`- Aucun asset enregistré : ${counts.noRegisteredAsset}.`,'','| Son | Candidat | État asset | Cibles utiles | Risque | Prochaine étape |','|---|---|---|---:|---|---|',...rows.map(row=>`| /${row.ipa}/ | ${row.candidate} | ${row.state} | ${row.usefulTargetCount} | ${row.spontaneousNamingRisk||'—'} | ${row.nextGate} |`),'','## Décision','', 'Réutiliser et tester les prototypes existants avant d’en dessiner de nouveaux. Pour les concepts sans asset, produire seulement une petite vague de recherche, en privilégiant rendement produit et faible ambiguïté de dénomination.'];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(counts,null,2));
