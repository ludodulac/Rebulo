import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_ROOTS = [
  ['assets/rebus', 'production'],
  ['assets/prepared/comic', 'prepared'],
  ['assets/research', 'research']
];
const TEXT_EXTENSIONS = new Set(['.json', '.js', '.mjs', '.html', '.md']);

async function readJson(root, relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
}

async function walk(root, relativeDir, predicate = () => true) {
  const absoluteDir = path.join(root, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDir.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, relativePath, predicate));
    else if (predicate(relativePath)) files.push(relativePath);
  }
  return files;
}

function normalizeReading(value = '') {
  return value.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function inferReading(assetPath, registryRecord) {
  if (registryRecord?.concept) return registryRecord.concept;
  const basename = path.posix.basename(assetPath, '.svg');
  return basename.split('-')[0];
}

function inferStyle(assetPath, registryRecord) {
  if (registryRecord?.source === 'rebulo_original' || assetPath.includes('-comic.svg') || assetPath.startsWith('assets/prepared/comic/')) return 'comic';
  return 'legacy_or_external';
}

export async function buildAssetInventory(root = process.cwd()) {
  const lexicon = await readJson(root, 'data/lexicon-seed.json');
  const sourceRegistry = await readJson(root, 'data/asset-sources.json');
  const researchSounds = await readJson(root, 'data/research-reading-sounds.json');
  const sourceByPath = new Map(sourceRegistry.assets.map(item => [item.path, item]));
  const lexiconByPath = new Map(lexicon.map(item => [item.image, item]));
  const ipaByReading = new Map();
  for (const item of lexicon) ipaByReading.set(normalizeReading(item.label || item.id), item.ipa);
  for (const item of researchSounds.items || []) ipaByReading.set(normalizeReading(item.reading), item.ipa);
  ipaByReading.set('corps', '/kɔʁ/');

  const textFiles = await walk(root, '.', file => TEXT_EXTENSIONS.has(path.extname(file)) && !file.startsWith('node_modules/'));
  const textContents = new Map();
  for (const file of textFiles) textContents.set(file.replace(/^\.\//, ''), await fs.readFile(path.join(root, file), 'utf8'));

  const rawAssets = [];
  for (const [assetRoot, lifecycle] of ASSET_ROOTS) {
    const files = await walk(root, assetRoot, file => file.endsWith('.svg'));
    for (const assetPath of files) rawAssets.push({ assetPath, lifecycle });
  }

  const readingCounts = new Map();
  for (const { assetPath } of rawAssets) {
    const reading = normalizeReading(inferReading(assetPath, sourceByPath.get(assetPath)));
    readingCounts.set(reading, (readingCounts.get(reading) || 0) + 1);
  }

  const assets = rawAssets.map(({ assetPath, lifecycle }) => {
    const source = sourceByPath.get(assetPath) || null;
    const lexical = lexiconByPath.get(assetPath) || null;
    const reading = inferReading(assetPath, source);
    const references = [...textContents.entries()]
      .filter(([file, content]) => file !== 'data/asset-library-inventory.json' && content.includes(assetPath))
      .map(([file]) => file)
      .sort();
    const normalized = normalizeReading(reading);
    return {
      reading,
      ipa: lexical?.ipa || ipaByReading.get(normalized) || null,
      path: assetPath,
      references,
      active: Boolean(lexical?.active || source?.active),
      lifecycle,
      style: inferStyle(assetPath, source),
      duplicateReading: (readingCounts.get(normalized) || 0) > 1,
      clinicalStatus: source?.clinicalStatus || lexical?.clinicalStatus || 'undocumented',
      provenance: source?.source || lexical?.assetSource || 'undocumented',
      revision: source?.artRevision || lexical?.artRevision || null
    };
  }).sort((a, b) => a.path.localeCompare(b.path));

  return {
    schemaVersion: '1.0',
    generatedFrom: ['assets/rebus/', 'assets/prepared/comic/', 'assets/research/'],
    summary: {
      total: assets.length,
      production: assets.filter(item => item.lifecycle === 'production').length,
      prepared: assets.filter(item => item.lifecycle === 'prepared').length,
      research: assets.filter(item => item.lifecycle === 'research').length,
      activeLegacyStyle: assets.filter(item => item.active && item.style !== 'comic').map(item => item.path),
      duplicateReadings: [...new Set(assets.filter(item => item.duplicateReading).map(item => item.reading))].sort()
    },
    assets
  };
}

async function main() {
  const inventory = await buildAssetInventory(process.cwd());
  const output = JSON.stringify(inventory, null, 2) + '\n';
  const outputPath = process.argv[2];
  if (outputPath) await fs.writeFile(path.resolve(outputPath), output);
  else process.stdout.write(output);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
