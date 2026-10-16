// 이 파일이 하는 일:
// 사진에서 뽑은 숫자 묶음(벡터)과 도감 캐릭터들의 벡터를 비교해서,
// "가장 닮은 캐릭터 TOP 5"를 골라냅니다. 수학은 코사인 유사도 하나뿐입니다.

// 어떤 AI 모델·버전·전처리로 벡터를 만들었는지 기록한 값들.
// 도감 벡터 파일과 이 값이 정확히 일치해야 비교가 의미 있습니다.
export const MODEL = "onnx-community/embeddinggemma-2-ONNX";
export const REVISION = "daa72c51243991dfcaf9f9137d2c573d8f7790c0";
export const IMAGE_TOKENS = 280;
export const PREPROCESS = "white-fit-512-v1";

// 벡터 하나가 가진 숫자의 개수. 이 모델은 사진 한 장을 768개의 숫자로 요약합니다.
const VECTOR_LENGTH = 768;

// 결과로 보여줄 캐릭터 수
const TOP_COUNT = 5;

/**
 * 캐릭터가 선택된 비교 범위(scope)에 들어가는지 알려줍니다.
 * - 'all'      : 전체
 * - 'villager' : 일반 주민
 * - 'special'  : 특수 캐릭터
 * - 'nh'       : 모여봐요 동물의 숲(NH)에 나오는 주민
 */
export function inScope(character, scope) {
  if (scope === "nh") return Boolean(character.nh);
  return scope === "all" || character.kind === scope;
}

/**
 * 벡터의 "길이"(크기)를 구합니다. 피타고라스 정리를 768차원으로 확장한 것과 같습니다.
 * 벡터가 망가져 있으면(개수가 다르거나, 숫자가 아니거나, 전부 0이면) 오류를 냅니다.
 */
function vectorLength(vector) {
  const isBroken =
    !Array.isArray(vector) ||
    vector.length !== VECTOR_LENGTH ||
    vector.some((x) => !Number.isFinite(x));
  if (isBroken) {
    throw new Error(
      "이미지 벡터가 올바르지 않습니다. AI를 다시 준비해 주세요.",
    );
  }

  const sumOfSquares = vector.reduce((sum, x) => sum + x * x, 0);
  const length = Math.sqrt(sumOfSquares);
  if (!length) throw new Error("비어 있는 이미지 벡터입니다.");
  return length;
}

/**
 * 도감 벡터 파일(index)이 지금 앱이 쓰는 모델·전처리와 맞는지 검사하고,
 * 통과하면 도감(catalog) 순서에 맞춰 벡터 배열을 돌려줍니다.
 * 버전이 하나라도 다르면 비교 결과를 믿을 수 없으므로 바로 멈춥니다.
 */
export function validateIndex(index, catalog) {
  const versionMatches =
    index.model === MODEL &&
    index.revision === REVISION &&
    index.dtype === "q4" &&
    index.imageTokens === IMAGE_TOKENS &&
    index.preprocess === PREPROCESS &&
    index.dimensions === VECTOR_LENGTH &&
    index.items?.length === catalog.length;
  if (!versionMatches) {
    throw new Error("도감과 AI 버전이 일치하지 않습니다. 새로고침해 주세요.");
  }

  // id → 벡터 로 찾기 쉽게 바꿔 둡니다.
  const vectorById = new Map(index.items.map((item) => [item.id, item.vector]));
  if (vectorById.size !== catalog.length) {
    throw new Error("도감 항목이 중복되었습니다.");
  }

  // 도감 순서대로 벡터를 꺼내면서, 각 벡터가 멀쩡한지도 함께 확인합니다.
  return catalog.map((character) => {
    const vector = vectorById.get(character.id);
    vectorLength(vector);
    return vector;
  });
}

/**
 * 사용자 사진의 벡터(query)와 모든 캐릭터 벡터를 비교해,
 * 닮은 순서대로 상위 5명을 돌려줍니다.
 *
 * 닮은 정도는 "코사인 유사도"로 잽니다: 두 벡터가 같은 방향을 보면 1,
 * 정반대 방향이면 -1. 식은 (내적) ÷ (두 벡터 길이의 곱) 입니다.
 */
export function rankCharacters(catalog, vectors, query) {
  if (catalog.length !== vectors.length) {
    throw new Error("도감 벡터가 부족합니다.");
  }
  const queryLength = vectorLength(query);

  const scored = catalog.map((character, i) => {
    const vector = vectors[i];
    const dot = vector.reduce((sum, value, j) => sum + value * query[j], 0);
    const similarity = dot / (vectorLength(vector) * queryLength);
    // 계산 오차로 1을 아주 살짝 넘는 일이 있어 -1 ~ 1 사이로 눌러 줍니다.
    const score = Math.max(-1, Math.min(1, similarity));
    return { ...character, score };
  });

  // 점수가 높은 순서로, 점수가 같으면 id 순서로 정렬합니다.
  scored.sort(
    (a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)),
  );
  return scored.slice(0, TOP_COUNT);
}
