export function normalizeLayout(value){const n=Number(value);return [1,2,4].includes(n)?n:1;}

export function paginateSession(items=[],perPage=1){
  const size=normalizeLayout(perPage);const pages=[];
  for(let index=0;index<(items||[]).length;index+=size)pages.push(items.slice(index,index+size));
  return pages;
}

export function moveSessionItem(items=[],fromIndex=0,toIndex=0){
  const copy=[...(items||[])];
  if(fromIndex<0||fromIndex>=copy.length||toIndex<0||toIndex>=copy.length||fromIndex===toIndex)return copy;
  const [item]=copy.splice(fromIndex,1);copy.splice(toIndex,0,item);return copy;
}

export function buildSessionProgression(items=[]){
  return (items||[]).map((item,index)=>({step:index+1,target:item?.answer||'',activity:item?.activity?.label||'',activityId:item?.activity?.id||''}));
}
