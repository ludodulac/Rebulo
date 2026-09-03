export const GENERAL_OPERATION_PICTOGRAMS=Object.freeze([
  Object.freeze({
    id:'yoyo',
    label:'yo-yo',
    reading:'yo-yo',
    ipa:'/jojo/',
    image:'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/1FA80.svg',
    assetSource:'openmoji:1FA80',
    sourceFile:'color/svg/1FA80.svg',
    sourceCommit:'aeb8bb3a59e2de39c754ac79180c8131c906acea',
    sourceLicense:'CC BY-SA 4.0',
    active:true,
    strictEligible:false,
    libraryTier:'general_illustration',
    clinicalStatus:'unreviewed',
    visualConfidence:0.95,
    labelStability:0.9,
    operationUse:'explicit_deletion',
    note:'Le yoyo entier garde toujours sa lecture entière. La lecture « yo » n’est permise que lorsque la suppression d’une moitié est explicitement dessinée.'
  })
]);

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function mergeGeneralOperationPictograms(seed=[]){
  const result=[...(seed||[])];
  const ids=new Set(result.map(item=>item?.id).filter(Boolean));
  const labels=new Set(result.map(item=>normalizeKey(item?.label)).filter(Boolean));
  for(const item of GENERAL_OPERATION_PICTOGRAMS){
    const key=normalizeKey(item.label);
    if(ids.has(item.id)||labels.has(key))continue;
    result.push({...item});
    ids.add(item.id);
    labels.add(key);
  }
  return result;
}
