function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function buildCreatorTargets(report={}){
  const rows=Array.isArray(report?.constructible)?report.constructible:[];
  const ordered=[...rows].sort((a,b)=>Number(b?.frequency||0)-Number(a?.frequency||0));
  const seen=new Set();
  const targets=[];
  for(const row of ordered){
    const pieces=Array.isArray(row?.decomposition)?row.decomposition:[];
    if(!row?.word||!row?.ipa||pieces.length<2||pieces.length>4)continue;
    const key=normalizeKey(row.word);
    if(!key||seen.has(key))continue;
    seen.add(key);
    targets.push({
      target:row.word,
      targetIpa:row.ipa,
      mode:'strict',
      assets:'ready',
      therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','syllable-blending','oral-to-written'],
      source:'coverage-report',
      generated:true
    });
  }
  return targets;
}
