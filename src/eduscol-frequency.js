const POS_PATTERN=/^(?:subst\.?|sub\.?st\.?|verbe|adj\.?|adv\.?|d[ée]t\.?|pr[ée]p\.?|pron\.?|conj\.?|num[ée]r\.?|interj\.?)$/iu;
const TEXT_ENTRY_PATTERN=/^(.+?)\s+(subst\.?|sub\.?st\.?|verbe|adj\.?|adv\.?|d[ée]t\.?|pr[ée]p\.?|pron\.?|conj\.?|num[ée]r\.?|interj\.?)\s+(\d+(?:[.,]\d+)?)\s*$/iu;

function decodeXml(value=''){
  return String(value).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
}
function plainCell(value=''){
  return decodeXml(String(value).replace(/<text:line-break\s*\/>/g,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}
function normalizedWord(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').replace(/[’]/g,"'").normalize('NFC');
}
function dedupeAndRank(raw=[]){
  const byWord=new Map();
  for(const item of raw){const previous=byWord.get(item.word);if(!previous||item.frequency>previous.frequency)byWord.set(item.word,item);}
  return [...byWord.values()].sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr')).map((item,index)=>({...item,rank:index+1}));
}

export function parseEduscolFrequencyOdsXml(xml=''){
  const rows=String(xml||'').split(/<table:table-row\b[^>]*>/i).slice(1),raw=[];
  for(const row of rows){
    const body=row.split(/<\/table:table-row>/i)[0]||'';
    const cells=[...body.matchAll(/<table:table-cell\b[^>]*>([\s\S]*?)<\/table:table-cell>/gi)].map(match=>plainCell(match[1])).filter(Boolean);
    if(cells.length<3)continue;
    const posIndex=cells.findIndex(cell=>POS_PATTERN.test(cell));
    if(posIndex<0)continue;
    let word='';
    for(let i=posIndex-1;i>=0;i--){if(/[\p{L}]/u.test(cells[i])&&!/^\d+(?:[.,]\d+)?$/.test(cells[i])){word=cells[i];break;}}
    let frequency=null;
    for(let i=posIndex+1;i<cells.length;i++){const value=Number(String(cells[i]).replace(/\s/g,'').replace(',','.'));if(Number.isFinite(value)){frequency=value;break;}}
    word=normalizedWord(word);
    if(!word||frequency===null)continue;
    raw.push({word,pos:cells[posIndex],frequency});
  }
  return dedupeAndRank(raw);
}

export function parseEduscolFrequencyText(text=''){
  const raw=[];
  for(const sourceLine of String(text||'').split(/\r?\n/)){
    const line=sourceLine.replace(/\s+/g,' ').trim();
    const match=line.match(TEXT_ENTRY_PATTERN);
    if(!match)continue;
    const word=normalizedWord(match[1]),frequency=Number(match[3].replace(',','.'));
    if(!word||!/[\p{L}]/u.test(word)||!Number.isFinite(frequency))continue;
    raw.push({word,pos:match[2],frequency});
  }
  return dedupeAndRank(raw);
}

export function eduscolFrequencyDataset(entries=[]){
  return {
    version:'1.0.0',
    source:'Éduscol — Liste de fréquence lexicale, Étienne Brunet',
    sourceUrl:'https://eduscol.education.gouv.fr/6873/liste-de-frequence-lexicale',
    sourceDocument:'https://eduscol.education.gouv.fr/sites/default/files/document/liste-mots-par-frequence115206pdf-76251.pdf',
    license:'Licence Ouverte / Open Licence Etalab 2.0',
    status:'public_school_frequency_evidence',
    caution:"Cette liste documente le vocabulaire de base de la langue écrite lu par les élèves; elle ne constitue pas un âge d'acquisition ni une validation clinique.",
    entries
  };
}
