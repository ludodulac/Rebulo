import fs from 'node:fs';
import path from 'node:path';

const input=process.argv[2];
const output=process.argv[3]||'data/lexique4.compact.json';
if(!input){
  console.error('Usage: npm run import:lexique -- <lexique4.csv|tsv> [output.json]');
  process.exit(1);
}

const raw=fs.readFileSync(input,'utf8').replace(/^\uFEFF/,'');
const firstLine=raw.split(/\r?\n/,1)[0]||'';
const separator=(firstLine.match(/\t/g)||[]).length>(firstLine.match(/;/g)||[]).length?'\t':';';

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

const lines=raw.split(/\r?\n/).filter(Boolean);
const headers=parseLine(lines.shift(),separator).map(x=>x.trim());
const normalizedHeaders=headers.map(h=>h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));

function findColumn(candidates){
  for(const candidate of candidates){
    const i=normalizedHeaders.indexOf(candidate);
    if(i>=0)return i;
  }
  return -1;
}

const columns={
  word:findColumn(['ortho','word','forme','graphie']),
  lemma:findColumn(['lemme','lemma']),
  phon:findColumn(['phon','phonologie','phonology','phoneme']),
  freq:findColumn(['freqlivres','freqfilms2','freq','frequency']),
  pos:findColumn(['cgram','pos','categorie'])
};

for(const required of ['word','phon']){
  if(columns[required]<0){
    console.error(`Colonne requise introuvable: ${required}. En-têtes: ${headers.join(', ')}`);
    process.exit(2);
  }
}

const rows=[];
for(const line of lines){
  const cells=parseLine(line,separator);
  const word=(cells[columns.word]||'').trim();
  const phon=(cells[columns.phon]||'').trim();
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
