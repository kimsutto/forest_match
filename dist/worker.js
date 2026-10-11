import { inScope, rankCharacters, validateIndex } from './match.mjs';
import { loadEmbedder } from './model.mjs';

let embed, catalog, vectors;
let busy = false;
const send = (type, data = {}) => self.postMessage({ type, ...data });

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      '캐릭터 도감을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.',
    );
  }
  return response.json();
}

self.onmessage = async ({ data }) => {
  if (busy || data.type !== 'match') return;
  busy = true;
  try {
    if (!embed) embed = await loadEmbedder(send);
    if (!vectors) {
      catalog = await readJSON('./characters.json');
      vectors = validateIndex(
        await readJSON('./character-vectors.json'),
        catalog,
      );
    }
    send('status', {
      message: '사진의 특징을 읽고 선택한 친구들과 비교하고 있어요…',
    });
    const start = performance.now();
    const query = await embed(data.blob);
    const subset = catalog
      .map((item, i) => ({ item, vector: vectors[i] }))
      .filter(({ item }) => inScope(item, data.scope));
    send('results', {
      results: rankCharacters(
        subset.map((x) => x.item),
        subset.map((x) => x.vector),
        query,
      ),
      count: subset.length,
      ms: performance.now() - start,
    });
  } catch (error) {
    send('error', { message: error.message || String(error) });
  } finally {
    busy = false;
  }
};
