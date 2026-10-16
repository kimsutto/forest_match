// 이 파일이 하는 일:
// 매칭 로직이 마이그레이션 후에도 예전과 똑같이 동작하는지 검사합니다.
// 작은 가짜 데이터 검사 + 실제 도감 566개 전체 검사(자기 자신이 1위인지)로 나뉩니다.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { validateFile } from "./image.js";
import {
  inScope,
  validateIndex,
  rankCharacters,
  MODEL,
  REVISION,
  IMAGE_TOKENS,
  PREPROCESS,
} from "./match.js";

// 첫 숫자만 x이고 나머지 767개는 0인 간단한 테스트용 벡터
const vector = (x) => [x, ...Array(767).fill(0)];

describe("validateFile: 사진 파일 검사", () => {
  it("지원하지 않는 형식은 거부한다", () => {
    expect(() => validateFile({ type: "image/svg+xml", size: 100 })).toThrow();
  });
  it("12MB를 넘으면 거부한다", () => {
    expect(() =>
      validateFile({ type: "image/jpeg", size: 13 * 1024 * 1024 }),
    ).toThrow();
  });
  it("빈 파일은 거부한다", () => {
    expect(() => validateFile({ type: "image/png", size: 0 })).toThrow();
  });
  it("정상 WebP는 통과한다", () => {
    expect(() => validateFile({ type: "image/webp", size: 100 })).not.toThrow();
  });
});

describe("매칭 로직 (가짜 데이터)", () => {
  const catalog = [
    { id: "a", name: "opposite" },
    { id: "b", name: "match" },
  ];
  const index = {
    model: MODEL,
    revision: REVISION,
    dtype: "q4",
    imageTokens: IMAGE_TOKENS,
    preprocess: PREPROCESS,
    dimensions: 768,
    items: [
      { id: "b", vector: vector(3) },
      { id: "a", vector: vector(-2) },
    ],
  };

  it("같은 방향 벡터는 1점, 반대 방향은 -1점", () => {
    const vectors = validateIndex(index, catalog);
    const top = rankCharacters(catalog, vectors, vector(7));
    expect(top.map((p) => [p.id, p.score])).toEqual([
      ["b", 1],
      ["a", -1],
    ]);
  });

  it("모델 버전이 다르면 거부한다", () => {
    expect(() =>
      validateIndex({ ...index, revision: "wrong" }, catalog),
    ).toThrow();
  });

  it("도감 항목이 중복되면 거부한다", () => {
    expect(() =>
      validateIndex(
        { ...index, items: [index.items[0], index.items[0]] },
        catalog,
      ),
    ).toThrow();
  });

  it("비어 있거나 길이가 틀린 질의 벡터는 거부한다", () => {
    const vectors = validateIndex(index, catalog);
    expect(() => rankCharacters(catalog, vectors, vector(0))).toThrow();
    expect(() => rankCharacters(catalog, vectors, [1, 2])).toThrow();
  });
});

describe("실제 도감 데이터 (static/)", () => {
  const catalog = JSON.parse(fs.readFileSync("static/characters.json", "utf8"));
  const index = JSON.parse(
    fs.readFileSync("static/character-vectors.json", "utf8"),
  );
  const vectors = validateIndex(index, catalog);

  it("분류별 개수가 맞는다 (전체 566 / 주민 490 / 특수 76 / NH 417)", () => {
    expect(catalog.filter((x) => inScope(x, "all")).length).toBe(566);
    expect(catalog.filter((x) => inScope(x, "villager")).length).toBe(490);
    expect(catalog.filter((x) => inScope(x, "special")).length).toBe(76);
    expect(catalog.filter((x) => inScope(x, "nh")).length).toBe(417);
    expect(new Set(catalog.map((x) => x.id)).size).toBe(566);
  });

  it("범위 규칙이 맞는다", () => {
    expect(inScope({ kind: "special" }, "nh")).toBe(false);
    expect(inScope({ kind: "villager" }, "unknown")).toBe(false);
    expect(catalog.filter((x) => x.nh && !x.localized).length).toBe(0);
  });

  it("모든 캐릭터는 자기 벡터로 검색하면 자기 자신이 1위다", () => {
    for (let i = 0; i < catalog.length; i++) {
      const top = rankCharacters(catalog, vectors, vectors[i]);
      expect(top.length).toBe(5);
      expect(top[0].id, catalog[i].english).toBe(catalog[i].id);
      expect(top[0].score).toBeGreaterThan(0.99999);
    }
  });

  it("모든 캐릭터의 이미지 파일과 출처 링크가 존재한다", () => {
    for (const character of catalog) {
      expect(fs.existsSync("static/" + character.image)).toBe(true);
      expect(
        character.imagePage.startsWith("https://nookipedia.com/wiki/File:"),
      ).toBe(true);
    }
  });
});
