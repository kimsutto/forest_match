import { loadEmbedder } from '../dist/model.mjs';
import { MODEL, REVISION, IMAGE_TOKENS, PREPROCESS } from '../dist/match.mjs';

const send = (type, data = {}) => self.postMessage({ type, ...data });
self.onmessage = async () => {
  try {
    const embed = await loadEmbedder(send);
    const response = await fetch('../dist/characters.json');
    if (!response.ok) throw new Error('캐릭터 목록을 읽지 못했습니다.');
    const catalog = await response.json();
    const index = {
      model: MODEL,
      revision: REVISION,
      dtype: 'q4',
      imageTokens: IMAGE_TOKENS,
      preprocess: PREPROCESS,
      dimensions: 768,
      items: [],
    };
    for (const item of catalog) {
      send('status', {
        message: `도감 벡터 생성 ${index.items.length + 1} / ${catalog.length} · ${item.name}`,
      });
      const image = await fetch(
        new URL(item.image, new URL('../dist/', import.meta.url)),
      );
      if (!image.ok) throw new Error(`이미지 로딩 실패: ${item.id}`);
      index.items.push({
        id: item.id,
        vector: await embed(await image.blob()),
      });
      if (index.items.length % 10 === 0) send('checkpoint', { index });
    }
    send('index', { index });
  } catch (error) {
    send('error', { message: error.message || String(error) });
  }
};
