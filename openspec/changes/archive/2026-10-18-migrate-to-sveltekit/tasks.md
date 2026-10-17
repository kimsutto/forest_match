# Tasks

## 1. SvelteKit 기반 구축

- [x] 1.1 SvelteKit + adapter-static + Vitest 프로젝트를 저장소 루트에 구성하고(기존 `dist/` 유지), `npm run build`가 정적 산출물을 만드는지 확인
- [x] 1.2 `static/`에 도감 자산(characters.json, character-vectors.json, characters/, examples/)을 배치하고 빌드 산출물에 그대로 복사되는지 확인

## 2. 순수 로직 모듈 이전

- [x] 2.1 `match.mjs` → `src/lib/matching/match.js`로 가독성 원칙(D4)에 맞게 재작성(한국어 파일 설명 주석 포함)하고, `match.test.mjs`를 Vitest로 옮겨 동작 보존 확인
- [x] 2.2 `image.mjs` → `src/lib/matching/image.js`로 같은 기준으로 재작성하고 흰 배경 합성·512px 축소 동작을 브라우저에서 수동 확인
- [x] 2.3 `model.mjs`·`worker.js`를 `src/lib/model/`로 이전하되 "엔진 선택 → 임베딩 함수 반환" 인터페이스(design D3)로 감싸고, Vite 빌드에서 Worker가 정상 동작하는지 dev 서버로 확인

## 3. 화면 컴포넌트 재구성

- [x] 3.1 `index.html`+`app.js`의 사진 선택·미리보기·검증 부분을 PhotoPicker 컴포넌트로 옮기고, 형식·크기 검증 오류 메시지가 스펙대로 표시되는지 확인
- [x] 3.2 상태 표시(모델 로딩 진행·오류·WebGPU 미지원 안내)를 StatusBar 컴포넌트로 옮기고 WebGPU 끈 환경에서 안내 문구 확인
- [x] 3.3 비교 범위 선택과 TOP 5 결과 표시를 ResultList 컴포넌트로 옮기고, 범위 "특수 76개"로 분석 시 특수 캐릭터만 나오는지 확인
- [x] 3.4 도감 열람(24개 페이지네이션)을 CatalogBrowser 컴포넌트로 옮기고 페이지 이동 동작 확인
- [x] 3.5 `style.css`를 해체해 디자인 토큰(색상·간격 등)만 전역 `:root` 변수로 두고 나머지는 각 컴포넌트의 스코프 `<style>`로 분산, 기존 화면과 나란히 비교해 시각적 차이가 없는지 확인

## 4. 마무리 검증과 정리

- [x] 4.1 스펙 photo-matching의 전 시나리오를 수동 검증(도감 이미지 자기 자신 1위 포함)하고 결과를 기록
- [x] 4.2 `dist/` 삭제, README의 실행 방법을 `npm run dev`/`npm run build`로 갱신하고 "코드 읽는 순서" 문단 추가, 문서대로 처음부터 실행되는지 확인

## 검증 기록 (4.1, 2026-10-16, Chrome 계열 브라우저 / dev 서버)

- 지원 형식 오류: SVG 파일 선택 시 "JPG, PNG, WebP 사진을 선택해 주세요" 표시 확인. 크기(12MB)·픽셀(4,000만) 제한은 Vitest 단위 테스트로 확인
- 브라우저 내 분석: Worker가 모델·도감 정적 파일 외 요청 없이 동작 (코드 경로 상 사진 전송 없음)
- 전처리: 투명 배경 webp(잭슨 도감 이미지) 선택 시 흰 배경 미리보기 확인
- 자기 자신 1위: 잭슨 이미지 → 잭슨 1위, 유사도 1.000, 566개 비교 1.47초 (WebGPU). 전체 566개는 Vitest로 통과
- 비교 범위: "특수 76개" 선택 후 재비교 → 76개만 비교, 1위 특수 캐릭터(낯선고양이), SPECIAL FRIEND 표기, 범위 pill 갱신 확인
- 도감 열람: 페이지 2/24 이동, "25–48 표시" 및 카드 렌더링 확인
- 모델 로딩 안내: 다운로드 진행률(파일명·%·MB) 표시 후 자동으로 분석 이어짐 확인
- WebGPU 미지원 안내: supported=false 강제 시 안내 문구 표시·버튼 비활성 확인 (실제 미지원 브라우저에서는 미확인)
- 모델 로딩 실패(네트워크 차단) 시나리오는 수동 재현하지 않음 — 기존과 동일한 오류 경로(fail) 유지
- 시각 비교: 기존 dist와 새 페이지를 같은 뷰포트에서 나란히 비교, 차이 없음

## Workflow follow-up

- 검증 완료 후 변경을 archive하고 main 스펙에 photo-matching 반영
