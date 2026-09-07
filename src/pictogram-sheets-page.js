import {buildPrintSheetPairs,pictogramIndexCsv} from './pictogram-print-sheets.js';
import {syllablePrintItems,syllablePrintMeta} from './syllable-print-library.js';

function el(tag,className='',text=''){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text)node.textContent=text;
  return node;
}

function card(entry,kind){
  const article=el('article','print-card');
  article.dataset.indexId=entry.indexId;
  const code=el('strong','print-card-id',entry.indexId);
  const visual=el('div',kind==='reference'?'print-card-visual':'print-card-drawing');
  if(kind==='reference'){
    const img=document.createElement('img');
    img.src=entry.image;
    img.alt=entry.label;
    img.loading='eager';
    visual.appendChild(img);
  }
  const label=el('div','print-card-label',entry.label);
  const data=el('div','print-card-data',`${entry.indexId} | ${entry.label}`);
  article.append(code,visual,label,data);
  return article;
}

function sheetPage(sheet,totalLots){
  const page=el('section',`print-sheet ${sheet.kind}`);
  page.dataset.kind=sheet.kind;
  page.dataset.lot=sheet.lot;
  const header=el('header','print-sheet-head');
  const title=el('strong','',sheet.kind==='reference'?'Référence - image + son':'Dessin - son + case vide');
  const meta=el('span','',`REBULO · lot ${sheet.lot}/${String(totalLots).padStart(3,'0')}`);
  header.append(title,meta);
  const grid=el('div','print-grid');
  sheet.entries.forEach(entry=>grid.appendChild(card(entry,sheet.kind)));
  page.append(header,grid);
  return page;
}

function downloadCsv(items){
  const blob=new Blob([pictogramIndexCsv(items)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='rebulo-index-briques-sonores.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function render(){
  const root=document.querySelector('#printSheets');
  const status=document.querySelector('#printStatus');
  const items=syllablePrintItems();
  const sheets=buildPrintSheetPairs(items);
  const meta=syllablePrintMeta();
  const lots=Math.ceil(items.length/20);
  root.replaceChildren();
  sheets.forEach(sheet=>root.appendChild(sheetPage(sheet,lots)));
  status.textContent=`${meta.count} briques sonores · ${meta.active} actives · ${meta.research} prototypes · ${lots} lots de 20 maximum`;
  document.querySelector('#printButton')?.addEventListener('click',()=>window.print());
  document.querySelector('#csvButton')?.addEventListener('click',()=>downloadCsv(items));
}

render();