import fs from 'node:fs';
import {pictogramGuaranteeRecord} from '../src/pictogram-guarantee.js';

const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const productionReviews=JSON.parse(fs.readFileSync(new URL('../data/production-naming-reviews.json',import.meta.url),'utf8'));
const comparisons=JSON.parse(fs.readFileSync(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));

const reviews=[...(productionReviews.reviews||[]),...(comparisons.comparisons||[])];
const reviewByKey=new Map();
for(const review of reviews){
  const concept=String(review?.concept||'').trim();
  const revision=String(review?.revision||review?.comparisonRevision||'').trim();
  if(concept)reviewByKey.set(`${concept}::${revision}`,review);
}

function matchingReview(item={}){
  const label=String(item.label||item.id||'').trim();
  const revision=String(item.artRevision||'').trim();
  return reviewByKey.get(`${label}::${revision}`)||reviews.find(review=>review?.concept===label&&(!revision||review?.revision===revision||review?.comparisonRevision===revision))||null;
}

const records=(lexicon||[]).map(item=>pictogramGuaranteeRecord(item,matchingReview(item)));
const summary={
  total:records.length,
  active:records.filter(record=>record.active).length,
  withAmbiguity:records.filter(record=>record.denominationCandidates.length>1).length,
  byHighestGuarantee:Object.fromEntries([...new Set(records.map(record=>record.highestGuarantee||'none'))].sort().map(level=>[level,records.filter(record=>(record.highestGuarantee||'none')===level).length]))
};

process.stdout.write(`${JSON.stringify({schemaVersion:'1.0',generatedFrom:['data/lexicon-seed.json','data/production-naming-reviews.json','data/pictogram-prototype-comparisons.json'],summary,records},null,2)}\n`);
