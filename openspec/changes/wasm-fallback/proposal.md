# Proposal

## Why

현재 앱은 WebGPU가 없는 브라우저(구형 Safari, 일부 모바일 등)에서 "지원하지 않는다"는 안내만 보여주고 끝난다. 이런 방문자도 결과를 받을 수 있도록, 작은 모델을 CPU(WASM)로 돌리는 폴백 경로를 추가해 지원 범위를 사실상 모든 최신 브라우저로 넓힌다.

## What Changes

- WebGPU 미지원 환경에서 MobileCLIP2-S0(INT8 양자화 ONNX, 비전 인코더 수십 MB급)을 WASM 백엔드로 실행하는 폴백 엔진을 추가한다.
- 접속 시 `navigator.gpu` 가용성으로 엔진을 자동 선택한다: 지원 → EmbeddingGemma 2(WebGPU, 기존), 미지원 → MobileCLIP2-S0(WASM).
- `tools/` 파이프라인에 MobileCLIP2-S0 임베딩 생성을 추가해, 566개 도감 벡터를 폴백 모델용으로 한 벌 더 미리 계산·배포한다(임베딩 공간이 모델마다 달라 혼용 불가).
- 폴백 모드임을 사용자에게 표시한다(어떤 엔진으로 분석했는지, 결과가 기본 모드와 다를 수 있음).
- WebGPU 미지원 시 보여주던 차단 안내 메시지는 폴백 실패 시에만 보여주도록 바뀐다.

## Capabilities

### New Capabilities

(없음)

### Modified Capabilities

- `photo-matching`: "실행 환경 요구사항 안내" 요구가 "WebGPU 미지원 시 차단 안내" → "폴백 엔진으로 자동 전환, 양쪽 모두 불가할 때만 안내"로 바뀐다. 폴백 엔진 선택·표시에 대한 요구가 추가된다.

## Impact

- `src/lib/model/`의 엔진 선택 인터페이스(migrate-to-sveltekit의 design D3)에 WASM 엔진 구현 추가
- 새 정적 자산: 폴백용 도감 벡터 파일(512차원, 기존 768차원보다 작음)
- `tools/` 파이프라인에 폴백 모델 임베딩 생성 단계 추가
- 폴백 모델도 기본 모델처럼 Hugging Face CDN에서 받으며 브라우저에 캐시됨
- 선행 조건: migrate-to-sveltekit 완료 후 진행
