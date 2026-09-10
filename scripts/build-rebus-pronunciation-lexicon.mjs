import fs from 'node:fs';
import path from 'node:path';
import {normalizeIPA} from '../src/phonetic-engine.js';

const inputPath=process.argv[2]||'data/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-pronunciation-lexicon.json';
if(!fs.existsSync(inputPath)){console.error(`Lexique compact introuvable: ${inputPath}`);process.exit(1);}
const source=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const entries=Array.isArray(source.entries)?source.entries:[];

const normalized=value=>String(value||'').trim().toLocaleLowerCase('fr').replace(/[’]/g,"'").normalize('NFC');
const groups=new Map();
for(const raw of entries){
  const form=normalized(raw.word||'');
  const ipa=normalizeIPA(raw.ipa||'');
  if(!form||!ipa||form.length>32||!/^[\p{L}\p{N}'’-]+$/u.test(form))continue;
  const frequency=Math.max(0,Number(raw.frequency)||0);
  const key=`${form}\u0001${ipa}`;
  const previous=groups.get(key);
  if(!previous||frequency>previous.frequency)groups.set(key,{form,ipa,lemma:normalized(raw.lemma||form),frequency,pos:String(raw.pos||''),source:'Lexique 4'});
}

const rows=[...groups.values()]
  .sort((a,b)=>a.form.localeCompare(b.form,'fr')||b.frequency-a.frequency||a.ipa.localeCompare(b.ipa))
  .map(item=>[item.form,item.ipa,item.lemma,Number(item.frequency.toFixed(4)),item.pos,item.source]);
const uniqueForms=new Set(rows.map(row=>row[0]));
const ambiguousForms=new Set();
let previousForm=null;let pronunciationCount=0;
for(const row of rows){
  if(row[0]!==previousForm){if(previousForm!==null&&pronunciationCount>1)ambiguousForms.add(previousForm);previousForm=row[0];pronunciationCount=1;}else pronunciationCount++;
}
if(previousForm!==null&&pronunciationCount>1)ambiguousForms.add(previousForm);

const output={
  formatVersion:1,
  generatedAt:new Date().toISOString(),
  status:'lexical_pronunciation_resource_not_clinical_validation',
  purpose:'Resolve ordinary French phrase tokens to attested lexical IPA before continuous rebus path search.',
  methodology:{
    scope:'All usable Lexique 4 surface forms with a stored IPA are retained; this lexicon intentionally includes grammatical words as well as content words.',
    ambiguity:'Multiple pronunciations for the same written form are preserved and ranked by Lexique frequency at runtime.',
    phraseBoundary:'Word provenance is retained only to explain routes; the downstream representation planner searches the concatenated IPA continuously and may cross boundaries.',
    limitation:'This is lexical lookup, not connected-speech phonology. Liaison, elision variants and context-conditioned pronunciation require explicit future rules rather than silent invention.'
  },
  source:{name:source.source||'Lexique 4',license:source.license||null,entryCount:entries.length},
  stats:{rowCount:rows.length,uniqueFormCount:uniqueForms.size,ambiguousFormCount:ambiguousForms.size},
  rowSchema:['form','ipa','lemma','frequency','pos','source'],
  rows
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(output));
console.log(JSON.stringify(output.stats,null,2));
