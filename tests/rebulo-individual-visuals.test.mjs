import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REBULO_INDIVIDUAL_VISUALS} from '../src/rebulo-individual-visuals.js';

const entries=Object.entries(REBULO_INDIVIDUAL_VISUALS);
assert.ok(entries.length>0,'individual visual registry must not be empty');

for(const [concept,path] of entries){
  assert.match(concept,/^[a-z0-9-]+$/,'registry concept IDs must be stable ASCII keys');
  assert.match(path,/^assets\/visible-batch1\/individual\/[a-z0-9-]+\.png$/);
  assert.ok(fs.existsSync(path),`missing individual visual: ${concept} -> ${path}`);
  const png=fs.readFileSync(path);
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],`${concept} is not a real PNG`);
  assert.equal(png[25],6,`${concept} must be PNG RGBA (colour type 6)`);
  assert.equal(png.readUInt32BE(16),256,`${concept} width must be 256px`);
  assert.equal(png.readUInt32BE(20),256,`${concept} height must be 256px`);
}
console.log(`Individual visual registry OK: ${entries.length} asset(s)`);
