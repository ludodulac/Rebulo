import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/visual-research-open-assets.json',import.meta.url),'utf8'));
assert.equal(data.status,'research_only');
assert.equal(data.items.length,3);
const item=reading=>data.items.find(entry=>entry.reading===reading);
assert.equal(item('tas').decision,'open_asset_gap');
assert.match(item('tas').contextualCue,/contributes no sound/);
assert.ok(item('tas').rejectedShortcuts.includes('old tas-v1 stones/blocks/geometric stimuli'));
assert.equal(item('pot').decision,'open_candidate_found');
assert.ok(item('pot').assetLeads.some(asset=>asset.title==='Vector flowerpot.svg' && asset.license==='CC BY-SA 4.0'));
assert.equal(item('do').decision,'open_notation_material_found_but_reading_unproven');
assert.equal(item('do').alternativeRepresentation,'dos');
assert.ok(item('do').assetLeads.every(asset=>asset.fit!=='validated_pictogram'));
console.log('visual research open assets: licensing leads remain separate from naming validation');
