import {buildPrintSheetPairs,pictogramIndexCsv,printLibraryMeta} from './pictogram-print-sheets.js';

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
  const data=el('div','print-card-data',`${entry.indexId} | ${entry.id}`);
  article.append(code,visual,label,data);
  return article;
}

function sheetPage(sheet,totalLots){
  const page=el('section',`print-sheet ${sheet.kind}`);
  page.dataset.kind=sheet.kind;
  page.dataset.lot=sheet.lot;
  const header=el('header','print-sheet-head');
  const title=el('strong','',sheet.kind==='reference'?'Référence — image + nom':'Dessin — nom + case vide');
  const meta=el('span','',`REBULO · lot ${sheet.lot}/${String(totalLots).padStart(3,'0')}`);
  header.append(title,meta);
  const grid=el('div','print-grid');
  sheet.entries.forEach(entry=>grid.appendChild(card(entry,sheet.kind)));
  page.append(header,grid);
  return page;
}

function downloadCsv(){
  const blob=new Blob([pictogramIndexCsv()],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='rebulo-pictogram-index.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function render(){
  const root=document.querySelector('#printSheets');
  const status=document.querySelector('#printStatus');
  const sheets=buildPrintSheetPairs();
  const meta=printLibraryMeta();
  root.replaceChildren();
  sheets.forEach(sheet=>root.appendChild(sheetPage(sheet,meta.pages)));
  status.textContent=`${meta.count} images indexées · ${meta.pages} lots · ${meta.pages*2} feuilles A4`;
  document.querySelector('#printButton')?.addEventListener('click',()=>window.print());
  document.querySelector('#csvButton')?.addEventListener('click',downloadCsv);
}

render();
