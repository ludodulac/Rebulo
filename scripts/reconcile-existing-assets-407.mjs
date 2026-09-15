import fs from 'node:fs';

const queue = JSON.parse(fs.readFileSync('data/rebulo-image-production-list-407.json','utf8'));
const pilot = JSON.parse(fs.readFileSync('data/rebulo-visual-asset-evidence-72.json','utf8'));
const evidence = JSON.parse(fs.readFileSync('data/rebulo-asset-reconciliation-evidence.json','utf8'));

const norm = s => (s ?? '').normalize('NFC').trim().toLocaleLowerCase('fr');
const pilotById = new Map(pilot.rows.map(r => [r[0], {stableId:r[0], individual:r[1], filename:r[2], source:r[3], classification:r[4]}]));
const repoByConcept = new Map(evidence.sources.repositoryAssets.map(([c,p]) => [norm(c), p]));
const compositeByConcept = new Map();
for (const c of evidence.sources.driveComposites) for (const concept of c.concepts) compositeByConcept.set(norm(concept), c);

const rows = queue.entries.map(entry => {
  let assetStatus='À_PRODUIRE', existingSource=null, existingFilename=null, needsExtraction=false, notes='Aucune représentation existante démontrée dans les sources durables contrôlées.';
  const p = entry.stableId ? pilotById.get(entry.stableId) : null;
  const repo = repoByConcept.get(norm(entry.concept));
  const composite = compositeByConcept.get(norm(entry.concept));

  if (p?.individual) {
    assetStatus='RÉCUPÉRÉ'; existingSource=p.source; existingFilename=p.filename; notes=`Preuve registre pilote: ${p.classification}.`;
  } else if (p && p.classification === 'ASSET_EXISTANT_À_RÉCUPÉRER' && p.source) {
    assetStatus='À_EXTRAIRE'; existingSource=p.source; existingFilename=null; needsExtraction=true; notes='Dessin prouvé dans une source/panel validé; absence de PNG individuel ne justifie pas un redessin.';
  } else if (composite) {
    assetStatus='À_EXTRAIRE'; existingSource=`Google Drive fileId ${composite.fileId}`; existingFilename=composite.filename; needsExtraction=true; notes='Dessin prouvé dans un composite durable; extraction requise, pas de redessin.';
  } else if (repo) {
    assetStatus='RÉCUPÉRÉ'; existingSource='GitHub main'; existingFilename=repo; notes='Asset de dépôt dont le nom/concept correspond exactement; fichier directement récupérable.';
  }

  return {
    productionNumber: entry.productionNumber,
    ipa: entry.ipa,
    word: entry.word,
    concept: entry.concept,
    targetFilename: entry.targetFilename,
    assetStatus,
    existingSource,
    existingFilename,
    needsExtraction,
    needsProduction: assetStatus === 'À_PRODUIRE',
    notes
  };
});

const counts = Object.fromEntries(['RÉCUPÉRÉ','À_EXTRAIRE','À_VÉRIFIER','À_PRODUIRE'].map(s => [s, rows.filter(r=>r.assetStatus===s).length]));
if (rows.length !== 407) throw new Error(`Expected 407 rows, got ${rows.length}`);
if (Object.values(counts).reduce((a,b)=>a+b,0) !== 407) throw new Error('Status sum != 407');
if (rows.some(r => !['RÉCUPÉRÉ','À_EXTRAIRE','À_VÉRIFIER','À_PRODUIRE'].includes(r.assetStatus))) throw new Error('Invalid status');

const out={schemaVersion:'1.0', referenceMain:evidence.referenceMain, sourceQueue:'data/rebulo-image-production-list-407.json', evidence:'data/rebulo-asset-reconciliation-evidence.json', matchingRule:evidence.rules.match, counts, entries:rows};
fs.writeFileSync('data/rebulo-image-asset-reconciliation-407.json', JSON.stringify(out,null,2)+'\n');

const historical = rows.filter(r=>r.assetStatus!=='À_PRODUIRE');
const md=[];
md.push('# REBULO — Réconciliation des assets existants sur la file 407','',`Main de référence : \`${evidence.referenceMain}\`.`,`Total : **407** — RÉCUPÉRÉ=${counts['RÉCUPÉRÉ']}, À_EXTRAIRE=${counts['À_EXTRAIRE']}, À_VÉRIFIER=${counts['À_VÉRIFIER']}, À_PRODUIRE=${counts['À_PRODUIRE']}.`,'','Règle : correspondance par stableId lorsqu’il existe, sinon par concept exact normalisé. Jamais par IPA seule.','','## Assets existants/récupérables recroisés avec la file 407','');
for (const r of historical) md.push(`- #${String(r.productionNumber).padStart(3,'0')} — **${r.word} / ${r.concept}** — ${r.assetStatus} — ${r.existingFilename ?? r.existingSource}`);
md.push('','## Reliquat exact à dessiner','');
for (const r of rows.filter(r=>r.assetStatus==='À_PRODUIRE')) md.push(`- #${String(r.productionNumber).padStart(3,'0')} — ${r.word} — ${r.concept} — \`${r.targetFilename}\``);
fs.writeFileSync('docs/REBULO_ASSET_RECONCILIATION_407.md', md.join('\n')+'\n');
console.log(JSON.stringify(counts));
