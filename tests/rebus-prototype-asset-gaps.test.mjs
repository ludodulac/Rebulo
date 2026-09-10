import assert from 'node:assert/strict';
import fs from 'node:fs';

const script=fs.readFileSync('scripts/build-prototype-asset-gap-audit.mjs','utf8');
assert.match(script,/decision==='prototype_candidate'/);
assert.match(script,/research_asset_exists/);
assert.match(script,/no_registered_asset/);
assert.match(script,/automaticActivation:false/);
assert.match(script,/run_naming_test_on_existing_research_asset/);
assert.match(script,/create_research_prototype_then_naming_test/);
assert.doesNotMatch(script,/active:true/);
console.log('rebus-prototype-asset-gaps.test.mjs: asset-gap audit reuses registered prototypes and never activates them');
