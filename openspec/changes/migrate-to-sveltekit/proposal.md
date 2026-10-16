# Proposal

## Why

현재 앱은 `dist/` 폴더의 바닐라 HTML·CSS·JS 파일로 구성되어 있어, 앞으로 계획된 작업(WASM 폴백, 디자인 리뉴얼, 캐릭터별 SEO 페이지, 배포)을 쌓아 올리기에 구조가 부족하다. 빌드 시스템과 컴포넌트 구조가 없으면 이후 변경마다 수작업 비용이 커지므로, 기능 추가 전에 SvelteKit 기반으로 먼저 이전한다. SvelteKit의 정적 프리렌더링은 이후 SEO 단계의 전제 조건이기도 하다.

## What Changes

- 프로젝트를 SvelteKit(정적 어댑터, SSR 없는 프리렌더 구성)으로 재구성한다.
- 기존 `dist/`의 로직(app.js, image.mjs, model.mjs, match.mjs, worker.js)을 Svelte 컴포넌트와 `src/lib/` 모듈로 옮긴다. **동작·화면은 기존과 동일하게 유지**하며, 디자인 변경은 별도 변경(design-refresh)에서 다룬다.
- 코드 가독성 원칙을 도입한다: 중학생 수준의 독자가 따라갈 수 있도록 작은 함수, 서술적인 한국어 주석, 명확한 이름, 파일당 하나의 역할. 순수 로직 모듈(image, match, model)도 이 기준으로 재작성한다(동작은 테스트로 보존).
- `style.css`(1185줄)를 해체한다: 색상 등 디자인 토큰만 전역 CSS 변수로 두고, 나머지는 각 Svelte 컴포넌트의 스코프 스타일로 옮긴다. 시각적 결과는 동일하게 유지한다.
- 기존 수동 테스트(match.test.mjs)를 Vitest로 이전하고 빌드 검증을 추가한다.
- 도감 데이터(characters.json, character-vectors.json, 캐릭터 이미지)는 정적 자산으로 그대로 유지한다.
- **BREAKING**: 로컬 실행 방법이 `python3 -m http.server` → `npm run dev`/`npm run build`로 바뀐다 (README 갱신 포함).

## Capabilities

### New Capabilities

- `photo-matching`: 사용자가 사진 한 장을 선택하면 브라우저 안에서만 분석하여(서버 전송 없음) 동물의 숲 캐릭터 566종 중 가장 닮은 TOP 5를 보여주는 핵심 동작. 사진 형식·크기 검증, 전처리, WebGPU 기반 임베딩, 코사인 유사도 순위까지 포함한다. 현재 구현되어 있으나 스펙이 없으므로, 이 변경에서 기존 동작을 스펙으로 문서화하고 마이그레이션 후에도 동일하게 유지됨을 보장한다.

### Modified Capabilities

(없음 — 기존 스펙이 아직 없다)

## Impact

- 저장소 구조 전체: `dist/` 직접 편집 방식 → `src/` + 빌드 산출물 방식으로 전환
- 새 의존성: SvelteKit, Vite, @sveltejs/adapter-static, Vitest (모두 개발 의존성; 런타임 외부 의존성은 기존과 동일하게 Transformers.js뿐)
- `tools/`의 도감 벡터 생성 파이프라인은 영향 없음
- README의 실행 방법 문단 갱신 필요
- 이후 변경(wasm-fallback, design-refresh, deploy-and-seo)이 모두 이 구조 위에서 진행됨
