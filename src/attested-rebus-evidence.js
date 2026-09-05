const normalizePiece=piece=>String(piece??'').trim();

export function summarizeAttestedPieces(corpus){
  const rebuses=Array.isArray(corpus?.attestedRebuses)?corpus.attestedRebuses:[];
  const byPiece=new Map();
  for(const rebus of rebuses){
    const answer=String(rebus?.answer??'').trim();
    const sourceIds=Array.isArray(rebus?.sourceIds)?rebus.sourceIds:[];
    for(const rawPiece of Array.isArray(rebus?.pieces)?rebus.pieces:[]){
      const piece=normalizePiece(rawPiece);
      if(!piece)continue;
      let entry=byPiece.get(piece);
      if(!entry){
        entry={reading:piece,occurrenceCount:0,answers:new Set(),sourceIds:new Set()};
        byPiece.set(piece,entry);
      }
      entry.occurrenceCount+=1;
      if(answer)entry.answers.add(answer);
      for(const sourceId of sourceIds)entry.sourceIds.add(sourceId);
    }
  }
  return [...byPiece.values()].map(entry=>({
    reading:entry.reading,
    occurrenceCount:entry.occurrenceCount,
    rebusCount:entry.answers.size,
    sourceCount:entry.sourceIds.size,
    answers:[...entry.answers].sort((a,b)=>a.localeCompare(b,'fr')),
    sourceIds:[...entry.sourceIds].sort(),
    evidenceTier:entry.sourceIds.size>=3?'repeated_multi_source':entry.sourceIds.size>=2?'multi_source':entry.answers.size>=2?'repeated_single_source':'single_attestation'
  })).sort((a,b)=>
    b.sourceCount-a.sourceCount||
    b.rebusCount-a.rebusCount||
    b.occurrenceCount-a.occurrenceCount||
    a.reading.localeCompare(b.reading,'fr')
  );
}

export function rankVisualResearchPriorities(corpus,{exclude=[]}={}){
  const excluded=new Set(exclude.map(normalizePiece));
  return summarizeAttestedPieces(corpus)
    .filter(item=>!excluded.has(item.reading))
    .map(item=>({...item,priorityScore:item.sourceCount*100+item.rebusCount*10+item.occurrenceCount}));
}
