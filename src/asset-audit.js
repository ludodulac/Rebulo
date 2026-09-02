const STATUS_LABELS={
  clinical_approved:'Validé clinique',
  'clinical-approved':'Validé clinique',
  clinical_reviewed:'Relu cliniquement',
  'clinical-reviewed':'Relu cliniquement',
  prototype_priority:'Prototype prioritaire — dénomination à valider',
  naming_test_required:'Test de dénomination requis',
  unreviewed:'Illustration générale — non revue cliniquement',
  no_suitable_asset:'Aucun visuel adapté'
};

export function assetStatusLabel(status=''){return STATUS_LABELS[status]||'Validation visuelle non documentée';}

export function auditRebusAssets(pieces=[],registry={}){
  const assets=registry?.assets||[];const sources=registry?.sources||{};
  const items=(pieces||[]).map(piece=>{
    const path=piece?.image||'';
    const record=assets.find(asset=>asset.path===path)||null;
    const embeddedOpenMoji=!record&&String(piece?.assetSource||'').startsWith('openmoji:');
    const source=record?sources[record.source]||null:embeddedOpenMoji?sources.openmoji||null:null;
    const clinicalStatus=record?.clinicalStatus||piece?.clinicalStatus||(embeddedOpenMoji?'unreviewed':'');
    const documented=Boolean(record||embeddedOpenMoji&&source);
    return {
      label:piece?.reading||piece?.label||'',path,
      documented,source:source?.project||record?.source||(embeddedOpenMoji?'OpenMoji':''),license:source?.license||piece?.sourceLicense||'',
      clinicalStatus,statusLabel:documented?assetStatusLabel(clinicalStatus):'Provenance et validation à auditer',
      note:record?.note||(embeddedOpenMoji?'Asset OpenMoji épinglé dans la bibliothèque phonétique ; aucune validation clinique implicite.':'Asset historique sans provenance structurée dans data/asset-sources.json.')
    };
  });
  return {items,allDocumented:items.length>0&&items.every(item=>item.documented),allClinicalApproved:items.length>0&&items.every(item=>['clinical_approved','clinical-approved'].includes(item.clinicalStatus))};
}
