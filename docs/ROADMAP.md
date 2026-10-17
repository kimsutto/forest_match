# 작업 로드맵

다른 컴퓨터에서 이어서 작업하기 위한 기록입니다. (마지막 갱신: 2026-10-18)

## 지금까지 된 것

- **SvelteKit 마이그레이션 완료** — OpenSpec 변경 `migrate-to-sveltekit`은 아카이브됨
  (`openspec/changes/archive/2026-10-18-migrate-to-sveltekit/`).
  앱 동작 스펙은 `openspec/specs/photo-matching/spec.md` (요구사항 8개).
- 실행: `npm install` → `npm run dev` (http://localhost:5173). 테스트: `npm test` (12개).
- 코드 구조와 읽는 순서는 README의 "코드 읽는 순서" 참고.

## 남은 작업 (이 순서대로)

### 1. wasm-fallback — WebGPU 없는 브라우저 지원 ★ 다음 작업

**제안·설계·태스크 7개가 전부 준비돼 있음**: `openspec/changes/wasm-fallback/`.
Claude Code에서 `/opsx:apply wasm-fallback` 으로 바로 시작하면 됩니다.

핵심 결정(design.md에 상세):

- 폴백 모델: MobileCLIP2-S0 INT8 ONNX (~11MB, 512차원), Transformers.js `device: 'wasm'`
- `src/lib/model/engines.js`의 엔진 목록에 WASM 엔진을 추가하기만 하면 되는 구조로 이미 준비됨
- 도감 벡터를 S0으로 한 벌 더 생성 (`static/character-vectors-s0.json`) — tools/ 파이프라인 확장
- 임베딩 혼용 금지, L2 정규화 주의, 폴백 모드 표시 UI

### 2. design-refresh — 디자인 리뉴얼 (아직 OpenSpec 변경 없음)

- 진행 방식 합의됨: Claude가 로컬 웹을 띄우고, 사용자가 화면을 보며 하나하나 지적 → 반영하는 반복 방식
- 기반 준비됨: 전역 색 토큰은 `src/app.css`(`--color-primary` 등)에만 있고
  나머지 스타일은 각 컴포넌트에 스코프되어 있어 토큰 교체로 전체 색 변경 가능
- 시작할 때 `/opsx:propose` 로 변경을 만들 것

### 3. deploy-and-seo — 배포·보안·SEO (아직 OpenSpec 변경 없음)

합의된 방향:

- 정적 호스팅 + CDN (Cloudflare Pages 등, 서버·DB 없음) + 도메인 구입
- 모델은 사용자 브라우저가 Hugging Face CDN에서 직접 받음(IP당 rate limit이라 트래픽 걱정 없음).
  HF 장애 대비가 필요해지면 모델 파일을 Cloudflare R2 등으로 복사하는 옵션 검토
- 보안 헤더 설정: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options 등
  (정적 사이트라 호스팅 설정 파일 몇 줄)
- SEO: 메타태그·OG 이미지, 그리고 캐릭터 566개 각각의 프리렌더 페이지
  (SvelteKit 파일 기반 라우팅 + `prerender` 활용) — 검색 유입의 핵심
- 시작할 때 `/opsx:propose` 로 변경을 만들 것

## 미해결 메모

- 사용자가 로컬 테스트 중 "닮은꼴 찾기가 매우 느리다"고 보고 (2026-10-17).
  첫 실행 모델 다운로드(284MB)로 추정되나 확인되지 않음. wasm-fallback 작업 전에 재확인 권장.
- WebGPU 미지원 안내 문구는 실제 미지원 브라우저(구형 Safari 등)에서는 아직 미확인.
