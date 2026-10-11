export const MODEL = 'onnx-community/embeddinggemma-2-ONNX';
export const REVISION = 'daa72c51243991dfcaf9f9137d2c573d8f7790c0';
export const IMAGE_TOKENS = 280;
export const PREPROCESS = 'white-fit-512-v1';
export function inScope(character, scope) {
  if (scope === 'nh') return Boolean(character.nh);
  return scope === 'all' || character.kind === scope;
}

function norm(vector) {
  if (
    !Array.isArray(vector) ||
    vector.length !== 768 ||
    vector.some((x) => !Number.isFinite(x))
  )
    throw new Error(
      '이미지 벡터가 올바르지 않습니다. AI를 다시 준비해 주세요.',
    );
  const n = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  if (!n) throw new Error('비어 있는 이미지 벡터입니다.');
  return n;
}
export function validateIndex(index, catalog) {
  if (
    index.model !== MODEL ||
    index.revision !== REVISION ||
    index.dtype !== 'q4' ||
    index.imageTokens !== IMAGE_TOKENS ||
    index.preprocess !== PREPROCESS ||
    index.dimensions !== 768 ||
    index.items?.length !== catalog.length
  )
    throw new Error('도감과 AI 버전이 일치하지 않습니다. 새로고침해 주세요.');
  const byId = new Map(index.items.map((item) => [item.id, item.vector]));
  if (byId.size !== catalog.length)
    throw new Error('도감 항목이 중복되었습니다.');
  return catalog.map((item) => {
    const vector = byId.get(item.id);
    norm(vector);
    return vector;
  });
}
export function rankCharacters(catalog, vectors, query) {
  if (catalog.length !== vectors.length)
    throw new Error('도감 벡터가 부족합니다.');
  const queryNorm = norm(query);
  return catalog
    .map((character, i) => {
      const vector = vectors[i];
      const dot = vector.reduce((sum, value, j) => sum + value * query[j], 0);
      const similarity = dot / (norm(vector) * queryNorm);
      return { ...character, score: Math.max(-1, Math.min(1, similarity)) };
    })
    .sort(
      (a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)),
    )
    .slice(0, 5);
}
