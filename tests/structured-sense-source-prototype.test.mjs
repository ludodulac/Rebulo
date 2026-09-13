import fs from 'node:fs';
import assert from 'node:assert/strict';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const gold=readJson('data/independent-sense-gold-150.json');
const rows=readJsonl('data/structured-sense-kaikki-bounded.jsonl');
const evaluation=readJson('data/structured-sense-source-evaluation.json');
const calibration=readJsonl('data/sense-candidates-calibration-400.jsonl');
const audit=readJson('data/b-to-c-industrial-sample-2-ab-editorial-audit.json');
const filterPath='scripts/lib/structured-sense-visual-filter.mjs';
const filterSource=fs.readFileSync(filterPath,'utf8');
const finalizerSource=fs.readFileSync('scripts/finalize-structured-sense-evaluation.mjs','utf8');

assert.equal(gold.selectedCount,150);
assert.equal(gold.status,'gold_frozen_before_source_ingestion');
assert.equal(gold.sourceLookedAt,false);
assert.equal(gold.rows.length,150);
assert.ok(gold.rows.every(r=>r.goldReview?.status==='editorial_reviewed_before_source'));
assert.ok(gold.rows.every(r=>typeof r.goldReview.seriousVisualConcept==='boolean'));
assert.ok(gold.rows.every(r=>['low','medium','high'].includes(r.goldReview.risk)));
assert.ok(gold.rows.every(r=>r.humanNamingEvidence==='none'));

const calibrationKeys=new Set(calibration.map(r=>`${r.ipa}|${r.exactWord}`));
assert.ok(gold.rows.every(r=>!calibrationKeys.has(`${r.ipa}|${r.exactWord}`)),'independent gold overlaps #293 calibration corpus');
const historicalWords=new Set(['club','oeuvre','star','drogue','mu','course','perte','chasse','pub','rêve','lettre','chose','droite','vote','geste']);
assert.ok(gold.rows.every(r=>!historicalWords.has(r.exactWord)),'independent gold overlaps historical 15 FN');

assert.equal(rows.length,165);
assert.equal(rows.filter(r=>r.unitKind==='independent_gold').length,150);
assert.equal(rows.filter(r=>r.unitKind==='historical_fn').length,15);
for(const r of rows){
 assert.equal(r.humanNamingEvidence??'none','none');
 for(const s of r.senseCandidates||[]){
  assert.equal(s.provenanceStatus,'observed');
  assert.equal(s.visualConceptCandidate,false,'observed lexical sense must never itself assert visual concept');
  assert.ok(s.sourceId&&s.sourceName&&s.sourceSenseId&&s.sourceDefinition&&s.sourcePOS&&s.sourceVersion&&s.sourceUrl);
  assert.equal(s.phoneticIdentity?.ipa,r.ipa);
  assert.match(s.phoneticIdentity?.ipaProvenance||'',/^B exact relation/);
  assert.ok(s.visualAssessment,'visual inference must be separate from observed sense');
 }
}

assert.equal(evaluation.formula290,'unchanged');
assert.equal(evaluation.humanNamingEvidence,'none');
assert.equal(evaluation.scope.independentGold,150);
assert.equal(evaluation.scope.historicalFN,15);
assert.ok(evaluation.coverage.relationsWithAtLeastOneObservedSensePercent>=90);
assert.ok(evaluation.states.C_source_plus_general_filter.precision>=95);
assert.ok(evaluation.states.C_source_plus_general_filter.fp<=1);
assert.ok(evaluation.states.C_source_plus_general_filter.recall>evaluation.states.A_baseline.recall);
assert.ok(evaluation.routes.newGreenFromObserved>0);
assert.equal(evaluation.historicalFN15.length,15);

// Decision code must stay data-independent: no file I/O, no imports of gold/audit data.
assert.ok(!/from ['"]node:fs['"]|readFile|goldReview|independent-sense|editorial-audit/.test(filterSource));
assert.ok(!/editorial_added/.test(filterSource));

function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function lexicalLiteralPresent(src,word){
 const w=esc(String(word));
 return new RegExp(`['"]${w}['"]|(?:\\||\\(\\?:)${w}(?:\\||\\))`,'iu').test(src);
}
const forbidden=new Set([...gold.rows.map(r=>r.exactWord),...historicalWords,...((audit.falsePositives||[]).map(r=>r.exactWord))]);
for(const word of forbidden){
 if(String(word).length<3)continue;
 assert.equal(lexicalLiteralPresent(filterSource,word),false,`decision filter contains forbidden lexical token: ${word}`);
}
// Finalizer may read evaluation labels, but must not encode lexical exceptions.
for(const word of historicalWords){
 if(word.length<3)continue;
 assert.equal(lexicalLiteralPresent(finalizerSource,word),false,`finalizer contains historical FN exception: ${word}`);
}

console.log(JSON.stringify({ok:true,gold:150,rows:165,precision:evaluation.states.C_source_plus_general_filter.precision,recall:evaluation.states.C_source_plus_general_filter.recall,newGreen:evaluation.routes.newGreenFromObserved},null,2));