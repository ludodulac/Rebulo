import fs from 'node:fs';
import path from 'node:path';

const input=process.argv[2];
const output=process.argv[3]||'data/lexique4.compact.json';
if(!input){
  console.error('Usage: npm run import:lexique -- <Lexique4.tsv|csv> [output.json]');
  process.exit(1);
}

const raw=fs.readFileSync(input,'utf8').replace(/^\uFEFF/,'');
const firstLine=raw.split(/\r?\n/,1)[0]||'';
const counts={tab:(firstLine.match(/\t/g)||[]).length,semi:(firstLine.match(/;/g)||[]).length,comma:(firstLine.match(/,/g)||[]).length};
const separator=counts.tab>=counts.semi&&counts.tab>=counts.comma?'\t':counts.semi>=counts.comma?';':',';

function parseLine(line,sep){
  const cells=[];let cell='';let quoted=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){
      if(quoted&&line[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(c===sep&&!quoted){cells.push(cell);cell='';}
    else cell+=c;
  }
  cells.push(cell);return cells;
}

function normalizeHeader(value){
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/^\d+[_\s.-]*/,'')
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_|_$/g,'');
}

const lines=raw.split(/\r?\n/).filter(Boolean);
const headers=parseLine(lines.shift(),separator).map(x=>x.trim());
const normalizedHeaders=headers.map(normalizeHeader);

function findColumn(candidates){
  for(const candidate of candidates){
    const i=normalizedHeaders.indexOf(candidate);
    if(i>=0)return i;
  }
  return -1;
}

const columns={
  word:findColumn(['mot','ortho','word','forme','graphie']),
  lemma:findColumn(['lemme','lemma']),
  ipa:findColumn(['phono_ipa','phon_ipa','ipa']),
  phon:findColumn(['phono','phon','phonologie','phonology','phoneme']),
  freq:findColumn(['freqmot','freq_mot','freqlivres','freqfilms2','freq','frequency']),
  pos:findColumn(['cgram','pos','categorie','categorie_grammaticale'])
};

const phonColumn=columns.ipa>=0?columns.ipa:columns.phon;
for(const [required,index] of [['word',columns.word],['phonology',phonColumn]]){
  if(index<0){
    console.error(`Colonne requise introuvable: ${required}. En-têtes: ${headers.join(', ')}`);
    process.exit(2);
  }
}

const rows=[];
for(const line of lines){
  const cells=parseLine(line,separator);
  const word=(cells[columns.word]||'').trim();
  const phon=(cells[phonColumn]||'').trim();
  if(!word||!phon)continue;
  const freqRaw=columns.freq>=0?(cells[columns.freq]||'').replace(',','.'):'';
  rows.push({
    word,
    lemma:columns.lemma>=0?(cells[columns.lemma]||'').trim():word,
    ipa:phon,
    frequency:freqRaw?Number(freqRaw)||0:0,
    pos:columns.pos>=0?(cells[columns.pos]||'').trim():''
  });
}

rows.sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({
  source:'Lexique 4',
  license:'CC BY-SA 4.0',
  generatedAt:new Date().toISOString(),
  count:rows.length,
  entries:rows
},null,2));
console.log(`Imported ${rows.length} Lexique entries -> ${output}`);
