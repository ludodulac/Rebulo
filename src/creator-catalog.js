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
    const syllableCount=Number.isInteger(row.syllableCount)&&row.syllableCount>0?row.syllableCount:null;
    const therapy=['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending'];
    if(syllableCount)therapy.push('syllable-count');
    therapy.push('syllable-blending','oral-to-written');
    targets.push({
      target:row.word,
      targetIpa:row.ipa,
      syllableCount,
      mode:'strict',
      assets:'ready',
      therapy,
      source:'coverage-report',
      generated:true
    });
  }
  return targets;
}
