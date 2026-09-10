function normalizeKey(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

function evidenceKey(item={}){return String(item.image||item.asset||'').trim();}
function finiteOrNull(value){return value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;}

export function buildVisualEvidenceIndex({seed=[],openPictograms=[],namingReviews={}}={}){
  const byAsset=new Map();
  const add=(item={},source='')=>{
    const asset=evidenceKey(item);if(!asset)return;
    const current=byAsset.get(asset)||{asset};
    byAsset.set(asset,{...current,
      concept:item.label||current.concept||'',
      visualConfidence:finiteOrNull(item.visualConfidence)??current.visualConfidence??null,
      labelStability:finiteOrNull(item.labelStability)??current.labelStability??null,
      clinicalStatus:item.clinicalStatus||current.clinicalStatus||'unreviewed',
      artRevision:item.artRevision||current.artRevision||null,
      metadataSource:source||current.metadataSource||null
    });
  };
  for(const item of openPictograms||[])add(item,'open_pictogram_library');
  for(const item of seed||[])add(item,'production_seed');
  for(const review of namingReviews?.reviews||[]){
    for(const candidate of review?.candidates||[]){
      const asset=String(candidate?.asset||'').trim();if(!asset)continue;
      const current=byAsset.get(asset)||{asset};
      byAsset.set(asset,{...current,
        concept:review.concept||current.concept||'',
        artRevision:review.revision||current.artRevision||null,
        clinicalStatus:review.clinicalStatus||current.clinicalStatus||'unreviewed',
        namingTestStatus:candidate.namingTestStatus||'not_run',
        humanDecision:review.humanDecision??null,
        namingRisks:Array.isArray(candidate.namingRisks)?candidate.namingRisks:[],
        namingEvidenceSource:'production_naming_reviews'
      });
    }
  }
  return byAsset;
}

export function visualEvidenceForRepresentation(representation={},index=new Map()){
  const evidence=index.get(String(representation.image||''))||null;
  if(!evidence)return {...representation,visualEvidence:{status:'metadata_missing',visualConfidence:null,labelStability:null,namingTestStatus:'not_run',humanDecision:null,namingValidated:false}};
  const namingTestStatus=evidence.namingTestStatus||'not_run';
  const humanDecision=evidence.humanDecision??null;
  // Only an explicit human decision can be treated as naming validation. Numeric confidence remains design metadata.
  const namingValidated=namingTestStatus==='completed'&&['approve','approved','validated','accept','accepted'].includes(normalizeKey(humanDecision));
  return {...representation,visualEvidence:{
    status:'metadata_available',
    visualConfidence:evidence.visualConfidence??null,
    labelStability:evidence.labelStability??null,
    clinicalStatus:evidence.clinicalStatus||'unreviewed',
    artRevision:evidence.artRevision||null,
    namingTestStatus,
    humanDecision,
    namingValidated,
    namingRisks:evidence.namingRisks||[],
    metadataSource:evidence.metadataSource||null,
    namingEvidenceSource:evidence.namingEvidenceSource||null
  }};
}

export function summarizeVisualEvidence(representations=[]){
  const exactImages=(representations||[]).filter(item=>item?.image);
  return {
    imageCount:exactImages.length,
    metadataAvailableCount:exactImages.filter(item=>item.visualEvidence?.status==='metadata_available').length,
    strongDesignMetadataCount:exactImages.filter(item=>Number(item.visualEvidence?.visualConfidence)>=0.85&&Number(item.visualEvidence?.labelStability)>=0.85).length,
    namingReviewPendingCount:exactImages.filter(item=>item.visualEvidence?.namingTestStatus==='not_run').length,
    namingValidatedCount:exactImages.filter(item=>item.visualEvidence?.namingValidated===true).length
  };
}
