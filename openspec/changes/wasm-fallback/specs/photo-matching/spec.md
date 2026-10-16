# Spec Delta

## MODIFIED Requirements

### Requirement: 실행 환경 요구사항 안내
The system SHALL WebGPU를 사용할 수 없는 브라우저에서 자동으로 폴백 엔진(CPU/WASM)으로 전환해 분석을 제공해야 하며(MUST), 폴백 엔진도 실행할 수 없는 환경에서만 지원 브라우저를 안내하는 메시지를 보여야 한다(MUST). 분석을 조용히 실패시키면 안 된다(MUST NOT).

#### Scenario: WebGPU 미지원 브라우저
- **WHEN** WebGPU를 지원하지 않는 브라우저로 접속해 분석을 시도하면
- **THEN** 폴백 엔진으로 분석이 수행되고 TOP 5 결과가 표시된다

#### Scenario: 폴백도 불가능한 환경
- **WHEN** WebGPU와 WASM 실행이 모두 불가능한 환경에서 접속하면
- **THEN** 지원 환경을 안내하는 메시지가 표시된다

## ADDED Requirements

### Requirement: 엔진 자동 선택
The system SHALL 접속한 브라우저의 WebGPU 가용성을 확인하여 기본 엔진(WebGPU)과 폴백 엔진(CPU/WASM) 중 하나를 자동으로 선택해야 하며(MUST), 사용자에게 별도 설정을 요구하면 안 된다(MUST NOT).

#### Scenario: WebGPU 지원 브라우저
- **WHEN** WebGPU를 지원하는 브라우저로 접속하면
- **THEN** 기본 엔진이 선택되고 기존과 동일하게 동작한다

#### Scenario: WebGPU 미지원 브라우저
- **WHEN** WebGPU가 없는 브라우저로 접속하면
- **THEN** 폴백 엔진이 자동 선택되어 사진 선택부터 결과까지 동일한 흐름으로 진행된다

### Requirement: 엔진별 도감 벡터 일치
The system SHALL 사용자 사진 임베딩과 비교하는 도감 벡터를, 현재 선택된 엔진과 같은 모델·버전·전처리로 미리 계산된 것만 사용해야 한다(MUST). 서로 다른 모델의 임베딩을 혼용하면 안 된다(MUST NOT).

#### Scenario: 폴백 엔진으로 분석
- **WHEN** 폴백 엔진이 선택된 상태에서 분석하면
- **THEN** 폴백 모델로 미리 계산된 566개 도감 벡터와만 비교한다

#### Scenario: 폴백 엔진으로 자기 자신 찾기
- **WHEN** 폴백 엔진에서 도감에 포함된 캐릭터의 원본 이미지를 입력하면
- **THEN** 해당 캐릭터가 1위로 표시된다

### Requirement: 사용 엔진 표시
The system SHALL 분석 결과와 함께 어떤 엔진(기본/폴백)으로 분석했는지 표시해야 하며(MUST), 폴백 모드에서는 기본 모드와 결과가 다를 수 있음을 안내해야 한다(MUST).

#### Scenario: 폴백 모드 결과 표시
- **WHEN** 폴백 엔진으로 분석이 완료되면
- **THEN** 결과 화면에 폴백 모드 표시와 "기본 모드와 결과가 다를 수 있다"는 안내가 포함된다
