const sessionDock=document.querySelector('.session-dock');
const queueCount=document.querySelector('#queueCount');
const queue=document.querySelector('#worksheetQueue');
const add=document.querySelector('#addToWorksheet');
const oneSheet=document.querySelector('#downloadRebus');
const sessionSheet=document.querySelector('#downloadSeries');
const print=document.querySelector('#printRebus');
const layout=document.querySelector('#worksheetLayout');

function relabelStaticActions(){
  if(add){add.textContent='＋ Ajouter à la séance';add.setAttribute('aria-label','Ajouter ce rébus à la séance');}
  if(oneSheet){oneSheet.textContent='🖨️ Fiche à imprimer';oneSheet.setAttribute('aria-label','Créer une fiche à imprimer pour ce rébus');}
  if(sessionSheet){sessionSheet.textContent='🖨️ Fiche de séance';sessionSheet.setAttribute('aria-label','Créer une fiche à imprimer avec les rébus de la séance');}
  if(print){print.textContent='🖨️ Imprimer la fiche';}
  if(layout){
    const labels={1:'1 grand rébus / page',2:'2 rébus / page',4:'4 rébus / page'};
    [...layout.options].forEach(option=>{if(labels[option.value])option.textContent=labels[option.value];});
    const label=layout.closest('label');if(label&&label.firstChild)label.firstChild.textContent='Format de fiche';
  }
}

function ensureProgress(){
  if(!sessionDock)return null;
  let node=sessionDock.querySelector('.session-progress');
  if(node)return node;
  node=document.createElement('div');
  node.className='session-progress';
  node.setAttribute('role','progressbar');
  node.setAttribute('aria-valuemin','0');
  node.setAttribute('aria-valuemax','4');
  const copy=document.createElement('span');copy.className='session-progress-copy';
  const track=document.createElement('span');track.className='session-progress-track';
  const fill=document.createElement('span');fill.className='session-progress-fill';track.appendChild(fill);
  node.append(copy,track);
  sessionDock.appendChild(node);
  return node;
}

function countItems(){return queue?.querySelectorAll('.queue-item').length||0;}
function syncSession(){
  const count=countItems();
  if(queueCount)queueCount.textContent=`${count} / 4`;
  const progress=ensureProgress();
  if(progress){
    progress.setAttribute('aria-valuenow',String(count));
    const copy=progress.querySelector('.session-progress-copy');
    const fill=progress.querySelector('.session-progress-fill');
    if(copy)copy.textContent=count===0?'Ajoute des rébus pour préparer une séance.':count===1?'1 rébus préparé.':`${count} rébus préparés dans l’ordre.`;
    if(fill)fill.style.width=`${count/4*100}%`;
  }
  if(sessionSheet){sessionSheet.hidden=count<2;sessionSheet.disabled=count<2;}
}

relabelStaticActions();
if(queue)new MutationObserver(syncSession).observe(queue,{childList:true,subtree:true});
syncSession();
