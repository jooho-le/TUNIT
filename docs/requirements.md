# 요구사항과 참고 원문

[문서 안내](README.md) · [화면 지도](screens.md) · [작업 기록](work-log/README.md)

초기 프론트의 7개 문서, 기획서, 백엔드 기반의 3개 문서와 뒤늦게 추가 대조한 3개 문서까지 참고 출처 14개를 모았다. UI 플로우차트의 S01-A~D는 랜딩에 반영했다. 이 목록은 참고 출처이며 모든 문서의 기능 구현 완료나 Notion 상태 변경을 뜻하지 않는다. 백엔드의 현재 추가 범위는 [추가 API 검토](backend-api-gap-review.md)를 따른다.

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

- P0: 가입·취향 CRUD·개인 탐색·추천·친구 비교·관심 상태전이의 핵심 흐름. 현재는 로컬 프론트 구현이며 실제 서버·DB 완료 조건은 별도다.
- P1: 팔로우·공유의 로컬 UI.
- P2: 채팅·공동 목록·피드는 구조·준비 화면만 둔다.
- 사용자 1명·후보 0명은 유효한 상태다. 가짜 추천 사용자·매칭 수를 생성하지 않는다.
- 화면 정보량과 색상은 사용자 지정 디자인 제약을 따른다. 원본 참고 문서의 모든 규칙을 자동 적용하지 않는다.

확정되지 않은 선택 개수·기한·재요청 정책은 [아키텍처](architecture.md)와 [상태 규칙](state-transitions.md)에 현재 임시 동작을 적었다. 변경이 생기면 해당 문서와 구현·검증 기록을 함께 갱신한다.
