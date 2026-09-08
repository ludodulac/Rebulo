import fs from 'node:fs';
import path from 'node:path';
import {parseEduscolFrequencyOdsXml,eduscolFrequencyDataset} from '../src/eduscol-frequency.js';

const input=process.argv[2]||'.cache/eduscol-frequency-content.xml';
const output=process.argv[3]||'data/eduscol-frequency-lexicon.json';
if(!fs.existsSync(input)){
  console.error(`Contenu ODS Éduscol introuvable: ${input}`);
  process.exit(1);
}
const entries=parseEduscolFrequencyOdsXml(fs.readFileSync(input,'utf8'));
if(entries.length<1000){
  console.error(`Import Éduscol insuffisant: ${entries.length} entrées détectées; attendu environ 1500.`);
  process.exit(2);
}
const dataset=eduscolFrequencyDataset(entries);
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(dataset,null,2));
console.log(`Imported ${entries.length} Eduscol frequency entries -> ${output}`);
