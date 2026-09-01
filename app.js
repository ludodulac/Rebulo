import {
  normalizeIPA,
  segmentTargetWithLexicon,
  rankDecompositions,
  validateStrictRebus
} from './src/phonetic-engine.js';
import {exportRebusPdf,worksheetCopy} from './src/pdf-export.js';

const state={catalog:[],lexicon:[],corpus:[],current:null,score:0,streak:0,lastId:null,creatorCurrent:null,sheetMode:'pro'};
const els={
  age:document.querySelector('#age'),rebus:document.querySelector('#rebus'),answer:document.querySelector('#answer'),form:document.querySelector('#answerForm'),feedback:document.querySelector('#feedback'),score:document.querySelector('#score'),streak:document.querySelector('#streak'),difficulty:document.querySelector('#difficulty'),hint:document.querySelector('#hint'),solution:document.querySelector('#solution'),newRebus:document.querySelector('#newRebus'),
  creatorForm:document.querySelector('#creatorForm'),target:document.querySelector('#target'),creatorFeedback:document.querySelector('#creatorFeedback'),result:document.querySelector('#result'),resultLabel:document.querySelector('#resultLabel'),resultWord:document.querySelector('#resultWord'),sheetInstruction:document.querySelector('#sheetInstruction'),creatorRebus:document.querySelector('#creatorRebus'),phoneticProof:document.querySelector('#phoneticProof'),worksheetAnswer:document.querySelector('#worksheetAnswer'),changeImage:document.querySelector('#changeImage'),childMode:document.querySelector('#childMode'),proMode:document.querySelector('#proMode'),printRebus:document.querySelector('#printRebus'),downloadRebus:document.querySelector('#downloadRebus'),exportFeedback:document.querySelector('#exportFeedback')
};

function normalize(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
function setFeedback(text,type=''){if(!els.feedback)return;els.feedback.textContent=text;els.feedback.className='feedback'+(type?' '+type:'')}
function setExportFeedback(text,type=''){if(!els.exportFeedback)return;els.exportFeedback.textContent=text;els.exportFeedback.className='export-feedback'+(type?' '+type:'')}
function readingOf(piece){return piece.reading||piece.label||''}
function pieceNode(piece){const box=document.createElement('div');box.className='piece';const img=document.createElement('img');img.src=piece.image;img.alt=readingOf(piece);const label=document.createElement('span');label.textContent=readingOf(piece);box.append(img,label);return box}
function renderPieces(container,pieces){container.replaceChildren();pieces.forEach((piece,index)=>{container.appendChild(pieceNode(piece));if(index<pieces.length-1){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');container.appendChild(plus)}})}
function targetEntry(wanted){return state.corpus.find(item=>normalize(item.target)===wanted)}
function generatedPieces(target){const decompositions=segmentTargetWithLexicon(target.targetIpa,state.lexicon,4);return rankDecompositions(decompositions)[0]||null}
function createRebus(){
  const wanted=normalize(els.target.value);
  els.creatorFeedback.className='creator-feedback';
  setExportFeedback('');
  if(!wanted){els.result.hidden=true;els.creatorFeedback.textContent='Écris d’abord un mot.';els.creatorFeedback.classList.add('bad');return}
  const target=targetEntry(wanted);
  if(!target){state.creatorCurrent=null;els.result.hidden=true;els.creatorFeedback.textContent='Ce mot n’est pas encore dans le corpus pilote. Rebulo ne devine pas sa prononciation.';els.creatorFeedback.classList.add('bad');return}
  if(target.mode!=='strict'||!target.targetIpa){state.creatorCurrent=null;els.result.hidden=true;els.creatorFeedback.textContent=`Refus phonétique : ${target.reason||'cet item n’est pas validé en mode strict.'}`;els.creatorFeedback.classList.add('bad');return}
  const pieces=generatedPieces(target);
  if(!pieces){state.creatorCurrent=null;els.result.hidden=true;els.creatorFeedback.textContent='La prononciation cible est connue, mais les concepts illustrables disponibles ne permettent pas encore une décomposition exacte.';els.creatorFeedback.classList.add('bad');return}
  const candidate={answer:target.target,targetIpa:target.targetIpa,pieces:pieces.map(piece=>({...piece,reading:piece.label}))};
  if(!validateStrictRebus(candidate).ok){state.creatorCurrent=null;els.result.hidden=true;els.creatorFeedback.textContent='La décomposition générée a échoué à la vérification phonétique stricte.';els.creatorFeedback.classList.add('bad');return}
  state.creatorCurrent=candidate;
  renderCreator();
}
function applySheetMode(mode){
  if(mode!=='child'&&mode!=='pro')return;
  state.sheetMode=mode;
  if(!state.creatorCurrent)return;
  const copy=worksheetCopy(state.creatorCurrent,mode);
  els.result.dataset.sheetMode=mode;
  els.childMode.setAttribute('aria-pressed',String(mode==='child'));
  els.proMode.setAttribute('aria-pressed',String(mode==='pro'));
  els.childMode.classList.toggle('secondary',mode!=='child');
  els.proMode.classList.toggle('secondary',mode!=='pro');
  els.resultLabel.textContent=mode==='child'?'Fiche enfant':'Correction professionnelle';
  els.resultWord.textContent=copy.title;
  els.sheetInstruction.textContent=copy.subtitle;
  els.worksheetAnswer.hidden=!copy.answerLine;
  els.phoneticProof.textContent=mode==='pro'?copy.proof:'';
  setExportFeedback('');
}
function renderCreator(){const r=state.creatorCurrent;if(!r)return;els.result.hidden=false;els.creatorFeedback.textContent='Solution stricte générée par le moteur.';renderPieces(els.creatorRebus,r.pieces);els.changeImage.disabled=true;els.changeImage.title='Une seule illustration est disponible pour le moment.';applySheetMode(state.sheetMode)}
async function downloadPdf(){
  const r=state.creatorCurrent;if(!r)return;
  els.downloadRebus.disabled=true;
  setExportFeedback('Création du PDF…');
  try{
    const filename=await exportRebusPdf(r,{mode:state.sheetMode});
    setExportFeedback(`${filename} créé.`,'good');
  }catch(error){
    console.error(error);
    setExportFeedback('Le PDF n’a pas pu être généré. L’impression reste disponible.','bad');
  }finally{
    els.downloadRebus.disabled=false;
  }
}

function isStrictCatalogRebus(rebus){return validateStrictRebus(rebus).ok}
function eligible(){const age=Number(els.age?.value||7);return state.catalog.filter(r=>r.minAge<=age&&isStrictCatalogRebus(r))}
function pickRebus(){if(!els.rebus)return;const pool=eligible();if(!pool.length){setFeedback('Aucun rébus disponible pour cet âge.','bad');return}let choices=pool.filter(r=>r.id!==state.lastId);if(!choices.length)choices=pool;state.current=choices[Math.floor(Math.random()*choices.length)];state.lastId=state.current.id;renderGame()}
function renderGame(){const r=state.current;renderPieces(els.rebus,r.pieces);els.answer.value='';els.difficulty.textContent=`Niveau ${r.difficulty}`;setFeedback('Les images donnent des sons français.')}
function validate(){const typed=normalize(els.answer.value);if(!typed){setFeedback('Écris d’abord une réponse.','bad');return}if(typed===normalize(state.current.answer)){state.score+=10*state.current.difficulty;state.streak+=1;els.score.textContent=state.score;els.streak.textContent=`🔥 ${state.streak}`;setFeedback(`Bravo ! ${state.current.answer} — ${state.current.pieces.map(p=>readingOf(p)).join(' + ')}.`,'good');setTimeout(pickRebus,1100)}else{state.streak=0;els.streak.textContent='🔥 0';setFeedback('Ce n’est pas encore le bon son. Prononce chaque image à voix haute.','bad')}}

async function loadJSON(path){const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(path);return response.json()}
async function init(){try{const [catalog,lexicon,corpus]=await Promise.all([loadJSON('data/rebus.json'),loadJSON('data/lexicon-seed.json'),loadJSON('data/corpus-pilot.json')]);state.catalog=catalog;state.lexicon=lexicon;state.corpus=corpus.items||[];createRebus();pickRebus()}catch(error){els.result.hidden=true;els.creatorFeedback.textContent='Les données Rebulo ne peuvent pas être chargées. Lance l’application via un serveur HTTP ou GitHub Pages.';els.creatorFeedback.className='creator-feedback bad';setFeedback('Le catalogue ne peut pas être chargé. Lance Rebulo via un serveur HTTP ou GitHub Pages.','bad')}}

els.creatorForm?.addEventListener('submit',e=>{e.preventDefault();createRebus()});
els.changeImage?.addEventListener('click',()=>{});
els.childMode?.addEventListener('click',()=>applySheetMode('child'));
els.proMode?.addEventListener('click',()=>applySheetMode('pro'));
els.printRebus?.addEventListener('click',()=>window.print());
els.downloadRebus?.addEventListener('click',downloadPdf);
els.form?.addEventListener('submit',e=>{e.preventDefault();validate()});
els.hint?.addEventListener('click',()=>{if(state.current)setFeedback(`💡 ${state.current.hint}`)});
els.solution?.addEventListener('click',()=>{if(!state.current)return;state.streak=0;els.streak.textContent='🔥 0';setFeedback(`Solution : ${state.current.answer}. Sons : ${state.current.pieces.map(p=>`${readingOf(p)} ${p.ipa}`).join(' + ')}.`)});
els.newRebus?.addEventListener('click',pickRebus);
els.age?.addEventListener('change',()=>{state.streak=0;els.streak.textContent='🔥 0';pickRebus()});

init();
