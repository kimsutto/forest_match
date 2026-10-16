# Design

## Context

동기는 proposal.md의 Why 참고. 현재 구조는 `dist/`에 빌드 없이 직접 작성된 파일들이다:

```
dist/
  index.html   (341줄)  마크업 전체
  app.js       (325줄)  UI 상태, 이벤트, 도감 열람, 결과 렌더링
  image.mjs    ( 38줄)  흰 배경 합성 + 512px 리사이즈
  model.mjs    ( 52줄)  Transformers.js 로딩 (WebGPU)
  match.mjs    ( 58줄)  코사인 유사도, 범위 필터, TOP 5
  worker.js    ( 52줄)  Web Worker에서 모델 실행
  style.css    (1185줄) 전체 스타일
  characters.json / character-vectors.json (8.8MB) / characters/*.webp (19MB)
```

제약: 동작·화면 동일 유지(디자인 변경 금지), 이후 변경들이 이 구조 위에 쌓임, "중학생도 읽을 수 있는 코드" 원칙.

## Goals / Non-Goals

**Goals:**
- SvelteKit + 정적 어댑터로 완전 정적 빌드 (서버 런타임 없음, 기존처럼 아무 정적 호스팅에서 동작)
- 로직을 역할별 작은 모듈로 재배치하고 한국어 주석·서술적 이름 적용
- Vitest로 테스트 이전 + 도감 이미지로 자기 자신을 찾는 스펙 시나리오를 자동화 가능한 형태로
- 이후 wasm-fallback이 끼어들 자리(모델 로딩 추상화)를 깨끗하게 남기기

**Non-Goals:**
- 디자인·레이아웃·문구 변경 (design-refresh에서)
- WASM 폴백 구현 (wasm-fallback에서; 단, 구조는 대비)
- SEO 메타태그·캐릭터별 페이지 (deploy-and-seo에서)
- `tools/` 파이프라인 변경

## Decisions

**D1. SvelteKit + adapter-static, 전체 프리렌더**
- SSR 서버 없이 `npm run build` → 정적 파일. 기존 배포 모델(정적 호스팅) 유지.
- 대안인 순수 Vite+Svelte(킷 없이)도 가능하지만, 이후 캐릭터별 SEO 페이지에 파일 기반 라우팅이 필요하므로 SvelteKit 선택.

**D2. 디렉터리 구조**

```
src/
  routes/+page.svelte          홈 화면 (조립만)
  lib/components/              PhotoPicker, ResultList, CatalogBrowser,
                               StatusBar 등 화면 조각
  lib/matching/                image.js, match.js (기존 .mjs 거의 그대로)
  lib/model/                   loader.js (모델 로딩 추상화), worker.js
static/
  characters/, characters.json, character-vectors.json, examples/
```

- 기존 `image.mjs`·`match.mjs`는 프레임워크 무관 순수 함수라 `lib/`로 이동하되, 동작은 유지한 채 가독성 원칙(D4)에 맞게 재작성한다. 동작 보존은 이전된 Vitest 테스트로 보장한다.
- `app.js`의 DOM 조작(325줄)은 Svelte 컴포넌트 4~5개로 분해.

**D3. 모델 로딩 추상화 (wasm-fallback 대비)**
- `lib/model/loader.js`가 "환경 확인 → 엔진 선택 → 임베딩 함수 반환" 인터페이스를 갖는다. 지금은 WebGPU 엔진 하나만 등록하고, 폴백 변경에서 WASM 엔진을 추가하기만 하면 되는 구조.

**D4. 가독성 원칙 (코드 리뷰 기준)**
- 함수 30줄 이하, 파일 150줄 이하 지향
- 모든 모듈 상단에 "이 파일이 하는 일" 한국어 주석 2~3줄
- 축약 금지(`$` 헬퍼 제거), 상태는 Svelte `$state`로 명시적으로
- 영리한 코드보다 긴 코드: 삼항 중첩·체이닝 묶음 대신 이름 있는 중간 변수

**D5-0. CSS: 전역 토큰 + 컴포넌트 스코프 스타일**
- `style.css`(1185줄)를 그대로 연결하지 않고 해체한다: 색상(primary/secondary 등)·간격·글꼴 크기 같은 디자인 토큰만 전역 `:root` CSS 변수로 두고, 나머지 스타일은 각 컴포넌트의 `<style>` 블록(Svelte 기본 스코프)으로 옮긴다.
- 시각적 결과물은 기존과 동일해야 한다(픽셀 단위 결정은 유지, 코드 배치만 변경). 이후 design-refresh에서 토큰 값만 바꿔 전체 색을 교체할 수 있는 기반이 된다.

**D5. 테스트**
- `match.test.mjs` → Vitest로 이전. 전처리(흰 배경 합성)는 브라우저 API 의존이라 단위 테스트 대신 스펙의 "자기 자신 찾기" 시나리오를 수동 검증 체크리스트로 유지.

**D6-0. 의존성 목록 (전부 확정)**
- 런타임: `@huggingface/transformers` (기존 유일 의존성 유지)
- 개발: `svelte`, `@sveltejs/kit`(Vite 내장), `@sveltejs/adapter-static`, `vitest`, `prettier`(+prettier-plugin-svelte)
- CSS 프레임워크(Tailwind 등)는 쓰지 않는다 — 토큰 + 스코프 CSS로 충분하고 가독성 원칙에 부합.

**D6. 빌드 산출물과 저장소**
- `dist/`는 삭제하고 빌드 산출물은 `build/`(gitignore). 정적 대용량 자산(벡터 8.8MB, 이미지 19MB)은 `static/`에 git 추적 유지 — 현재도 추적 중이고 도감 갱신 빈도가 낮다.

## Risks / Trade-offs

- [style.css 해체 중 시각 회귀] → 토큰·스코프 분해는 컴포넌트 단위로 진행하고, 각 컴포넌트마다 기존 화면과 나란히 비교
- [마이그레이션 중 동작 회귀] → 이전 전 스냅샷 스크린샷 + 스펙 시나리오 체크리스트로 이전 후 수동 검증. 도감 벡터·이미지는 손대지 않으므로 매칭 결과 자체는 변하지 않는다.
- [Worker와 Vite 빌드 상호작용] → Vite는 `new Worker(new URL(...))` 패턴을 지원하지만 Transformers.js의 동적 import와 섞일 때 설정 이슈가 흔함. 초기에 worker 빌드부터 검증한다.
- [프레임워크 도입으로 초보자 진입장벽 상승] → 가독성 원칙(D4) + README에 "코드 읽는 순서" 안내 문단 추가로 상쇄.
- [대용량 정적 자산의 빌드 시간] → `static/`은 Vite 변환 대상이 아니라 복사만 되므로 영향 미미.

## Migration Plan

1. 새 SvelteKit 프로젝트를 저장소 루트에 구성 (기존 `dist/` 유지한 채)
2. 순수 모듈(image, match, model, worker) 이동 → Vitest 통과 확인
3. 화면을 컴포넌트로 재구성 → 기존 화면과 나란히 비교
4. 스펙 시나리오 전체 수동 검증 (WebGPU 매칭 포함)
5. `dist/` 삭제, README 갱신
- 롤백: 단일 커밋 단위로 진행하므로 git revert로 충분
