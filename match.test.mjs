import { validateFile } from './dist/image.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  inScope,
  validateIndex,
  rankCharacters,
  MODEL,
  REVISION,
  IMAGE_TOKENS,
  PREPROCESS,
} from './dist/match.mjs';
const vector = (x) => [x, ...Array(767).fill(0)];
assert.throws(() => validateFile({ type: 'image/svg+xml', size: 100 }));
assert.throws(() =>
  validateFile({ type: 'image/jpeg', size: 13 * 1024 * 1024 }),
);
assert.throws(() => validateFile({ type: 'image/png', size: 0 }));
validateFile({ type: 'image/webp', size: 100 });
const catalog = [
  { id: 'a', name: 'opposite' },
  { id: 'b', name: 'match' },
];
const index = {
  model: MODEL,
  revision: REVISION,
  dtype: 'q4',
  imageTokens: IMAGE_TOKENS,
  preprocess: PREPROCESS,
  dimensions: 768,
  items: [
    { id: 'b', vector: vector(3) },
    { id: 'a', vector: vector(-2) },
  ],
};
const vectors = validateIndex(index, catalog);
assert.deepEqual(
  rankCharacters(catalog, vectors, vector(7)).map((p) => [p.id, p.score]),
  [
    ['b', 1],
    ['a', -1],
  ],
);
assert.throws(() => validateIndex({ ...index, revision: 'wrong' }, catalog));
assert.throws(() =>
  validateIndex({ ...index, items: [index.items[0], index.items[0]] }, catalog),
);
assert.throws(() => rankCharacters(catalog, vectors, vector(0)));
assert.throws(() => rankCharacters(catalog, vectors, [1, 2]));
const actualCatalog = JSON.parse(
  fs.readFileSync('dist/characters.json', 'utf8'),
);
const actualIndex = JSON.parse(
  fs.readFileSync('dist/character-vectors.json', 'utf8'),
);
const actualVectors = validateIndex(actualIndex, actualCatalog);
assert.equal(actualCatalog.filter((x) => inScope(x, 'all')).length, 566);
assert.equal(inScope({ kind: 'special' }, 'nh'), false);
assert.equal(inScope({ kind: 'villager' }, 'unknown'), false);
assert.equal(new Set(actualCatalog.map((x) => x.id)).size, 566);
assert.equal(actualCatalog.filter((x) => inScope(x, 'villager')).length, 490);
assert.equal(actualCatalog.filter((x) => inScope(x, 'special')).length, 76);
assert.equal(actualCatalog.filter((x) => inScope(x, 'nh')).length, 417);
assert.equal(actualCatalog.filter((x) => x.nh && !x.localized).length, 0);
for (let i = 0; i < actualCatalog.length; i++) {
  const top = rankCharacters(actualCatalog, actualVectors, actualVectors[i]);
  assert.equal(top.length, 5);
  assert.equal(top[0].id, actualCatalog[i].id, actualCatalog[i].english);
  assert.ok(top[0].score > 0.99999);
  assert.ok(fs.existsSync('dist/' + actualCatalog[i].image));
  assert.ok(
    actualCatalog[i].imagePage.startsWith('https://nookipedia.com/wiki/File:'),
  );
}
console.log(
  'PASS: all 566 real vectors match their own character; 490 villagers / 76 NPC entries / 417 NH villagers; complete local image coverage.',
);
console.log(
  'PASS: file validation, cosine ranking, index compatibility, ID alignment, malformed vectors.',
);
