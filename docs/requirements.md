# 요구사항과 참고 원문

[문서 안내](README.md) · [화면 지도](screens.md) · [작업 기록](work-log/README.md)

초기 프론트는 아래 Notion 문서 7개를 읽고 구성했다. 이후 UI 플로우차트에 추가된 S01-A~D를 랜딩에 반영했다. 이 목록은 작업 당시 참고한 출처이며 Notion의 실시간 상태나 모든 항목의 구현 완료를 뜻하지 않는다.

| 원문                                                                                 | 이 저장소의 대응 문서                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [UI 플로우 차트](https://www.notion.so/bb2d062130a9825b96dd8146e5be5194)             | [화면 지도](screens.md), [현재 디자인](../DESIGN.md)               |
| [Logic 플로우 차트](https://www.notion.so/bf2d062130a9827fa1b4810bb2064ecb)          | [상태 규칙](state-transitions.md), [API 계약](api-spec.md)         |
| [핵심 기능 MVP](https://www.notion.so/cd9d062130a982ce8ff081028f1a0f24)              | [현재 구현 상태](README.md), [화면 지도](screens.md)               |
| [프론트·백엔드·DB·배포 구조](https://www.notion.so/facd062130a982a9976c0106e84da547) | [아키텍처](architecture.md)                                        |
| [폴더 구조](https://www.notion.so/40bd062130a983068865015edc17e6de)                  | [아키텍처](architecture.md), [백엔드 안내](../backend/README.md)   |
| [환경변수](https://www.notion.so/83ad062130a982469a0b817a26000d4a)                   | [개발 가이드](development.md), [백엔드 안내](../backend/README.md) |
| [테스트 시나리오](https://www.notion.so/22ed062130a98319b1d30169bb47cbf7)            | [검증 기록](test-results.md)                                       |

## 범위 해석

- P0: 가입·취향 CRUD·개인 탐색·추천·친구 비교·관심 상태전이의 핵심 흐름. 현재는 로컬 프론트 구현이며 실제 서버·DB 완료 조건은 별도다.
- P1: 팔로우·공유의 로컬 UI.
- P2: 채팅·공동 목록·피드는 구조·준비 화면만 둔다.
- 사용자 1명·후보 0명은 유효한 상태다. 가짜 추천 사용자·매칭 수를 생성하지 않는다.
- 화면 정보량과 색상은 사용자 지정 디자인 제약을 따른다. 원본 참고 문서의 모든 규칙을 자동 적용하지 않는다.

확정되지 않은 선택 개수·기한·재요청 정책은 [아키텍처](architecture.md)와 [상태 규칙](state-transitions.md)에 현재 임시 동작을 적었다. 변경이 생기면 해당 문서와 구현·검증 기록을 함께 갱신한다.
