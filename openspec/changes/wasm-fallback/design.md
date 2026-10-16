# Design

## Context

동기는 proposal.md 참고. 선행 변경 migrate-to-sveltekit이 `src/lib/model/loader.js`에 "환경 확인 → 엔진 선택 → 임베딩 함수 반환" 인터페이스를 만들어 둔다. 이 변경은 그 인터페이스에 두 번째 엔진을 등록하는 일이다.

```
                 loader.js
                     |
         navigator.gpu 있나?
            |              |
           yes             no
            |              |
   +----------------+  +------------------------+
   | WebGPU 엔진    |  | WASM 엔진 (신규)       |
   | EmbeddingGemma2|  | MobileCLIP2-S0 INT8    |
   | 768차원        |  | 512차원                |
   +----------------+  +------------------------+
            |              |
   character-vectors   character-vectors
   .json (768d, 기존)  -s0.json (512d, 신규)
```

## Goals / Non-Goals

**Goals:**
- WebGPU 없는 브라우저에서도 전체 흐름(선택→분석→TOP 5) 동작
- 폴백 모델 다운로드 수십 MB 이내, CPU 분석 수 초 이내 체감
- 도감 벡터 생성 파이프라인(tools/)에서 두 모델을 같은 전처리로 처리

**Non-Goals:**
- 사용자가 엔진을 수동 선택하는 UI (자동 선택만)
- WebGPU 환경에서 두 모델 결과를 비교·병합하는 기능
- 기본 모델 교체나 품질 개선

## Decisions

**D1. 폴백 모델: MobileCLIP2-S0 INT8 ONNX**
- 비전 인코더 INT8 기준 수십 MB, CPU 프레임당 수십 ms 수준으로 폴백 목적에 가장 적합.
- 대안 SigLIP 2 Base(~90MB+)는 품질은 낫지만 폴백 사용자(저사양·구형 환경일 확률 높음)에게 다운로드 부담이 커서 보류. 품질 불만 시 S2/SigLIP2로 올리는 후속 변경 가능.

**D2. 실행: Transformers.js의 WASM 백엔드 재사용**
- 기존 스택(Transformers.js)이 ONNX Runtime Web을 내장하므로 `device: 'wasm'` 지정으로 실행. onnxruntime-web을 별도 의존성으로 직접 쓰는 대안은 로딩·전처리 코드가 이원화되어 기각.
- 모델 소스는 기본 모델과 동일하게 Hugging Face CDN + 브라우저 Cache Storage.

**D3. 폴백용 도감 벡터는 별도 파일로 분리 배포**
- `static/character-vectors-s0.json`(512차원). 엔진 선택 후 해당 파일만 받는다 — WebGPU 사용자는 폴백 벡터를 내려받지 않는다(기존 8.8MB에 추가 비용 없음).
- 한 파일에 두 벌을 합치는 대안은 모든 사용자가 양쪽을 받게 되어 기각.

**D4. tools/ 파이프라인 확장**
- 기존 build-index 흐름에 모델 선택 매개변수를 추가해 같은 566개 이미지·같은 전처리(흰 배경·512px)로 S0 임베딩을 생성. 전처리 불일치가 품질 저하의 가장 흔한 원인이므로 전처리 코드를 두 경로가 공유하도록 한다.

**D5. 폴백 표시 UI**
- 상태 표시줄에 엔진 뱃지(예: "간단 모드로 분석했어요"), 결과 영역에 한 줄 안내. 문구는 기술 용어(WASM/WebGPU) 대신 쉬운 말로.

## Risks / Trade-offs

- [폴백 결과 품질이 기본 모드보다 낮음] → 스펙의 "사용 엔진 표시" 요구로 기대치 관리 + 자기 자신 찾기 시나리오를 폴백에서도 통과하는지 검증
- [S0 ONNX 커뮤니티 패키징의 출력 정규화 누락 이슈(미정규화 출력)] → 임베딩 생성·질의 양쪽에서 L2 정규화를 명시적으로 수행하고 테스트로 고정
- [구형 기기에서 WASM 추론이 수 초 이상] → 진행 상태 표시 유지, 모델이 작아 실용 범위로 예상. 실측 후 느리면 이미지 입력 해상도 조정 검토
- [두 벡터 파일의 버전 불일치(도감 갱신 시 한쪽만 재생성)] → tools/가 항상 두 벌을 함께 생성하도록 단일 명령으로 묶음

## Migration Plan

1. tools/에 S0 임베딩 생성 추가 → `character-vectors-s0.json` 생성
2. loader.js에 WASM 엔진 등록 + 엔진별 벡터 파일 로딩
3. UI에 엔진 표시 추가
4. Chrome에서 WebGPU 끄고(플래그) 폴백 경로 전체 검증, 가능하면 구형 Safari에서도
- 롤백: 엔진 등록 한 줄 제거로 기존 동작 복귀

## Open Questions

- 폴백 안내 문구의 정확한 표현(디자인 리뉴얼과 함께 다듬어도 됨)
