# 요구사항과 참고 원문

[문서 안내](README.md) · [화면 지도](screens.md) · [작업 기록](work-log/README.md)

2026-11-27에는 TUNIT 작업 트래커의 `작업 구분`이 **Codex 개발 또는 설계 완료**인 26개(10개/16개)를 상태 필터 없이 모두 읽고 대조했다. 전체 제목·원문·구현 연결과 충돌 해결은 [26문서 대조](notion-p0-implementation-review.md)에 있다. Notion의 상태·문서는 수정하지 않았다.

아래 14개 링크는 앞선 작업에서 축적한 참고 출처다. 환경변수 문서는 이번 필터 대상과 별도인 기존 참고 문서이며, 현재 26개 전체 목록을 대신하지 않는다.

| 원문                                                                                 | 이 저장소의 대응 문서                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [UI 플로우 차트](https://www.notion.so/bb2d062130a9825b96dd8146e5be5194)             | [화면 지도](screens.md), [현재 디자인](../DESIGN.md)               |
| [Logic 플로우 차트](https://www.notion.so/bf2d062130a9827fa1b4810bb2064ecb)          | [상태 규칙](state-transitions.md), [API 계약](api-spec.md)         |
| [핵심 기능 MVP](https://www.notion.so/cd9d062130a982ce8ff081028f1a0f24)              | [현재 구현 상태](README.md), [화면 지도](screens.md)               |
| [프론트·백엔드·DB·배포 구조](https://www.notion.so/facd062130a982a9976c0106e84da547) | [아키텍처](architecture.md)                                        |
| [폴더 구조](https://www.notion.so/40bd062130a983068865015edc17e6de)                  | [아키텍처](architecture.md), [백엔드 안내](../backend/README.md)   |
| [환경변수](https://www.notion.so/83ad062130a982469a0b817a26000d4a)                   | [개발 가이드](development.md), [백엔드 안내](../backend/README.md) |
| [테스트 시나리오](https://www.notion.so/22ed062130a98319b1d30169bb47cbf7)            | [검증 기록](test-results.md)                                       |
| [기획서 작성](https://app.notion.com/p/e6ad062130a983c6aebf81017c8a84a5) | [화면 지도](screens.md), [요구사항 범위](README.md) |
| [데이터 목록 만들기](https://app.notion.com/p/428d062130a9834e8ac7814b95f7cdbe) | [DB 스키마](erd.md), [추가 검토](backend-api-gap-review.md) |
| [각 데이터 필드 정의](https://app.notion.com/p/bc6d062130a98224984081f41d45a5a4) | [DB 스키마](erd.md), [최초 설계 비교](backend-design-review.md) |
| [기능 요청/응답 쪼개기](https://app.notion.com/p/08bd062130a983e88a2701f841818397) | [추가 API 검토](backend-api-gap-review.md) |
| [엔드포인트 목록 설계 (GET/POST/PUT/DELETE)](https://app.notion.com/p/368d062130a98360983881a6a9f6594f) | [실제 API](../contracts/backend-foundation.openapi.json), [구현/보류](backend-api-gap-review.md) |
| [요청값/응답값 형태 설계](https://app.notion.com/p/c13d062130a983d69dd501963e87f5a1) | [실제 API](../contracts/backend-foundation.openapi.json) |
| [에러 규칙 정하기](https://app.notion.com/p/dfad062130a98315822a818db3d79ad1) | [검증 기록](test-results.md), [실제 API](../contracts/backend-foundation.openapi.json) |

## 범위 해석

- P0: 가입·취향 CRUD·개인 탐색·추천·친구 비교·관심 상태전이의 핵심 흐름. 현재 Spring P0와 HTTP 어댑터를 구현하고 각각 검증했다. 실제 브라우저→HTTP→DB·JCloud 완료 조건은 별도다.
- P1: 팔로우·공유의 로컬 UI.
- P2: 채팅·공동 목록·피드는 구조·준비 화면만 둔다.
- 사용자 1명·후보 0명은 유효한 상태다. 가짜 추천 사용자·매칭 수를 생성하지 않는다.
- 화면 정보량과 색상은 사용자 지정 디자인 제약을 따른다. 원본 참고 문서의 모든 규칙을 자동 적용하지 않는다.

이번에 승인한 취향 수·초대24시간·재신청·초기 추천식은 [상태 규칙](state-transitions.md)과 [Notion 대조](notion-p0-implementation-review.md)를 따른다. 회원탈퇴/보존·P1 초대 철회 등 미확정 정책은 보류한다. 변경이 생기면 해당 문서와 구현·검증 기록을 함께 갱신한다.
