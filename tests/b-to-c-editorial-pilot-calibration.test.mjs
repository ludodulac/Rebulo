#!/usr/bin/env node
import fs from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const artifact = process.argv[2] || "data/b-to-c-editorial-pilot-90.json";
const doc = JSON.parse(fs.readFileSync(artifact,"utf8"));

execFileSync(process.execPath, ["scripts/validate-b-to-c-editorial-pilot.mjs", artifact], {stdio:"inherit"});

assert.equal(doc.cases.length, 90);
assert.deepEqual(doc.distribution, {A:44,B:31,C:6,D:9});

const controls = new Set(["chien","chat","train","voiture","bébé","œil","pied","soleil","cheval","porte","livre","mer","scie","pie","lit","nid","route","pomme","table","nez"]);
for (const word of controls) {
  const c=doc.cases.find(x=>x.exactWord===word);
  assert.ok(c,`missing positive control ${word}`);
  assert.equal(c.provisionalClass,"A",`positive control ${word} should be A`);
}
const falseNegatives = new Set(["maman","bureau","prison","tour","visage","but","dossier","vaisseau","cerveau","journal","planète","village","papier","monstre","os","bâton","goutte"]);
for (const word of falseNegatives) {
  const c=doc.cases.find(x=>x.exactWord===word);
  assert.ok(c,`missing historical false negative ${word}`);
  assert.ok(["A","B"].includes(c.provisionalClass),`historical false negative ${word} should be A/B, got ${c.provisionalClass}`);
}
for (const c of doc.cases) {
  assert.equal(c.humanNamingEvidence,"none");
  assert.equal(c.editorialReview,"unreviewed");
}
console.log("PASS b-to-c calibration: controls=20/20 A; historical false negatives=17/17 A-or-B; evidence gates intact");
