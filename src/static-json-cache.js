const jsonPromises=new Map();

export function loadStaticJSON(path,{cache='force-cache',fetcher=null}={}){
  const key=String(path||'');
  if(!key)return Promise.reject(new Error('Missing static JSON path'));
  if(jsonPromises.has(key))return jsonPromises.get(key);
  const request=(async()=>{
    const run=fetcher||globalThis.fetch?.bind(globalThis);
    if(!run)throw new Error('Fetch unavailable');
    const response=await run(key,{cache});
    if(!response.ok)throw new Error(`${key}: ${response.status}`);
    return response.json();
  })();
  jsonPromises.set(key,request);
  request.catch(()=>jsonPromises.delete(key));
  return request;
}

export function hasStaticJSON(path){return jsonPromises.has(String(path||''));}
