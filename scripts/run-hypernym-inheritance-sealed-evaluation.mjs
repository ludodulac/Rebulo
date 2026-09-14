import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const part=process.argv[2]||'development';let s=fs.readFileSync('scripts/build-hypernym-inheritance-evaluation.mjs','utf8');
s=s.replace("data/hypernym-inheritance-gold-210.json","data/hypernym-inheritance-sealed-gold-180.json");
s=s.replace("gold.status!=='annotated_and_sealed_before_semantic_source_lookup'","gold.status!=='sealed_balanced_gold_before_any_source_lookup'");
s=s.replace("const units=gold.rows.filter(r=>r.partition===part),expected=part==='development'?135:75;if(units.length!==expected)throw new Error('bad partition');","const units=gold.rows.filter(r=>r.partition===part),expected=part==='development'?120:60;if(units.length!==expected)throw new Error('bad partition');");
s=s.replaceAll('data/hypernym-inheritance-${part}-','data/hypernym-inheritance-sealed-${part}-');
const tmp='scripts/.tmp-hypernym-sealed-eval.mjs';fs.writeFileSync(tmp,s);const r=spawnSync(process.execPath,[tmp,part],{stdio:'inherit'});fs.unlinkSync(tmp);if(r.status!==0)process.exit(r.status??1);