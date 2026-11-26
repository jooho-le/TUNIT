# API 계약 정본

- [backend-foundation.openapi.json](backend-foundation.openapi.json): 현재 Spring P0 30개 작업·직접 DTO·PageResponse 계약. 이름은 초기 기반 작업과의 연결을 위해 유지한다.
- [생성 타입](../frontend/src/api/generated.ts): `node contracts/generate-types.mjs`로 갱신하고 `node contracts/generate-types.mjs --check`로 차이를 검사한다.
- [openapi.yaml](openapi.yaml): 초기 프론트 제안 보존본. 현재 서버 구현·새 클라이언트 개발의 기준으로 사용하지 않는다.

요청·오류·권한·보류 범위는 [API 문서](../docs/api-spec.md), 실제 실행 증거는 [검증 기록](../docs/test-results.md)에 있다. 생성 타입은 DTO 모양을 검사하며 런타임 데이터 전체 검증기를 대신하지 않는다.
