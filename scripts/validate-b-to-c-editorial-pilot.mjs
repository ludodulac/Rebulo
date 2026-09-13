#!/usr/bin/env node
import fs from "node:fs";

const path = process.argv[2] || "data/b-to-c-editorial-pilot-90.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const keys = [
  "concreteness","drawability","expectedNameability","alternativeNameResistance",
  "visualAmbiguityResistance","visualSimplicity","lexicalFamiliarity",
  "phoneticReuse","compactness","multiRepresentationValue"
];
const weights = doc.weights;
const aggregate = scores =>
  Math.round(keys.reduce((sum,k)=>sum + (scores[k]/4)*weights[k],0)*10)/10;

function classify(score,s) {
  if (s.drawability <= 1 || s.expectedNameability <= 1) {
    return (score < 45 || s.expectedNameability === 0) ? "D" : "C";
  }
  if (score >= 80 && s.expectedNameability >= 3 && s.drawability >= 3 && s.visualSimplicity >= 3) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "D";
}
if (doc.caseCount !== doc.cases.length) throw new Error(`caseCount mismatch: ${doc.caseCount}/${doc.cases.length}`);
if (doc.cases.length !== 90) throw new Error(`pilot must contain 90 cases, got ${doc.cases.length}`);

const required = ["ipa","exactWord","senseId","conceptLabel","conceptCategory","conceptDescription","scores","aggregateScore","provisionalClass","anticipatedAlternativeNames","anticipatedNamingRisk","decisionRationale","legacyEvidence","humanNamingEvidence","editorialReview"];
const seen = new Set();
const dist = {A:0,B:0,C:0,D:0};
for (const [i,c] of doc.cases.entries()) {
  for (const k of required) if (!(k in c)) throw new Error(`case ${i} missing ${k}`);
  const id = `${c.ipa}\u0000${c.exactWord}\u0000${c.senseId}`;
  if (seen.has(id)) throw new Error(`duplicate unit ${c.ipa}/${c.exactWord}/${c.senseId}`);
  seen.add(id);
  for (const k of keys) {
    if (!Number.isInteger(c.scores[k]) || c.scores[k] < 0 || c.scores[k] > 4) throw new Error(`bad score ${k} for ${c.exactWord}`);
  }
  const score = aggregate(c.scores);
  if (score !== c.aggregateScore) throw new Error(`aggregate mismatch for ${c.exactWord}: ${c.aggregateScore}/${score}`);
  const expected = classify(score,c.scores);
  if (expected !== c.provisionalClass) throw new Error(`class mismatch for ${c.exactWord}: ${c.provisionalClass}/${expected}`);
  if (!["low","medium","high","unknown"].includes(c.anticipatedNamingRisk)) throw new Error(`bad risk for ${c.exactWord}`);
  if (c.humanNamingEvidence !== "none") throw new Error(`human naming evidence must remain none for ${c.exactWord}`);
  if (c.editorialReview !== "unreviewed") throw new Error(`editorialReview must remain unreviewed for ${c.exactWord}`);
  dist[c.provisionalClass]++;
}
for (const k of ["A","B","C","D"]) if (dist[k] !== doc.distribution[k]) throw new Error(`distribution mismatch ${k}: ${dist[k]}/${doc.distribution[k]}`);
console.log(`PASS b-to-c score validation: ${doc.cases.length} cases; A=${dist.A} B=${dist.B} C=${dist.C} D=${dist.D}`);
