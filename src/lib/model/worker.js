// 이 파일이 하는 일:
// 무거운 AI 계산을 화면과 분리된 작업 스레드(Web Worker)에서 돌립니다.
// 화면 쪽에서 { type: 'match', blob: 사진, scope: 범위 } 메시지를 보내면,
// 여기서 분석해서 'results'(결과) / 'status'(진행) / 'error'(오류) 메시지로 답합니다.
import { inScope, rankCharacters, validateIndex } from "../matching/match.js";
import { loadBestEngine } from "./engines.js";

let engine; // 준비된 AI 엔진 ({ id, embed })
let catalog; // 캐릭터 도감 목록
let vectors; // 캐릭터별 벡터 (도감과 같은 순서)
let busy = false; // 분석이 겹치지 않도록 하는 잠금

const send = (type, data = {}) => self.postMessage({ type, ...data });

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      "캐릭터 도감을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.",
    );
  }
  return response.json();
}

self.onmessage = async ({ data }) => {
  if (busy || data.type !== "match") return;
  busy = true;
  try {
    // 첫 요청 때 한 번만: 엔진 준비 + 도감 불러오기
    if (!engine) engine = await loadBestEngine(send);
    if (!vectors) {
      catalog = await readJSON("/characters.json");
      vectors = validateIndex(
        await readJSON("/character-vectors.json"),
        catalog,
      );
    }

    send("status", {
      message: "사진의 특징을 읽고 선택한 친구들과 비교하고 있어요…",
    });
    const start = performance.now();

    // 사진 → 벡터
    const query = await engine.embed(data.blob);

    // 선택한 범위(전체/주민/특수/NH)에 드는 캐릭터만 추려서 비교
    const subset = catalog
      .map((character, i) => ({ character, vector: vectors[i] }))
      .filter(({ character }) => inScope(character, data.scope));

    send("results", {
      results: rankCharacters(
        subset.map((x) => x.character),
        subset.map((x) => x.vector),
        query,
      ),
      count: subset.length,
      ms: performance.now() - start,
      engine: engine.id,
    });
  } catch (error) {
    send("error", { message: error.message || String(error) });
  } finally {
    busy = false;
  }
};
