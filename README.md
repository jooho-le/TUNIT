# TUNIT

음악 취향으로 나를 발견하고 사람을 연결하는 웹 프론트. React + TypeScript + Vite + React Router를 사용한다.

프론트는 기본 **브라우저 로컬 데모**와 **Spring HTTP 어댑터**를 제공한다. Spring Boot·PostgreSQL에는 인증·취향 관리·검색·프로필·추천·친구 초대·관심·연결 해제의 30개 API를 구현했다. [Notion 26문서 대조](docs/notion-p0-implementation-review.md)와 [검증 기록](docs/test-results.md)에 확인 범위를 정리했다. 브라우저부터 실제 서버까지의 통합 실행과 JCloud 배포는 아직 검증하지 않았다.

개발 흐름은 **작업 브랜치 → dev → main**이다. 현재 코드는 `dev`에 통합하고, `main`은 개발 완료 후 반영한다. 자세한 기준은 [브랜치 운영](docs/git-workflow.md)에 있다.

## 시작

Node 20.19 이상과 npm workspaces를 사용한다. 저장소 루트에서 실행한다.

```sh
npm ci
npm test
npm run build
```

개발 서버는 사용자가 화면을 실행하기로 할 때만 직접 시작한다.

```sh
npm run dev
```

- 랜딩: `/#/landing` — 루트 접속도 이 화면으로 연결
- 개인 Home: `/#/home` — 로그인·취향 입력 후 사용
- 빌드 결과: `frontend/dist/`
- 환경변수 예시: [frontend/.env.example](frontend/.env.example)

기본 mock의 계정은 브라우저에만 저장되므로 실제 서비스 비밀번호를 사용하지 않는다. HTTP 모드는 별도 개발 DB·Spring과 검토한 음악/태그 데이터가 필요하다. 두 테스트 계정으로 체험하는 방법은 [개발 가이드](docs/development.md)에 있다.

현재 화면은 `DESIGN3.md`의 큰 이탤릭 워드마크·얇은 선·각진 구성·하단 필름 릴을 반영한다. 주요 색상은 기존 노랑·차콜·보라를 유지한다.

## 문서

| 목적                          | 문서                                 |
| ----------------------------- | ------------------------------------ |
| 현재 구현 상태·문서 전체 탐색 | [문서 안내](docs/README.md)          |
| 작업 브랜치·통합·최종 반영    | [브랜치 운영](docs/git-workflow.md)  |
| 색상·화면 구성·모션 기준      | [현재 디자인 기준](DESIGN.md)        |
| 화면별 경로·랜딩 동작         | [화면 지도](docs/screens.md)         |
| 코드 구조·데이터·백엔드 경계  | [아키텍처](docs/architecture.md)     |
| 현재 Spring API 요청·응답     | [API 계약](docs/api-spec.md)         |
| 백엔드 기반·PostgreSQL 테스트 | [백엔드 안내](backend/README.md)     |
| 최신 Notion과 코드의 차이     | [백엔드 설계 비교](docs/backend-design-review.md) |
| 실행했던 검사와 미검증 범위   | [검증 기록](docs/test-results.md)    |
| 변경 이력·한국어 커밋 메시지  | [작업 기록](docs/work-log/README.md) |
| 작업 시 지켜야 할 사용자 지침 | [AGENTS.md](AGENTS.md)               |

## 저장소 구조

```text
frontend/    React 앱·테스트·정적 자산
backend/     Spring Boot·14개 JPA/Repository·Flyway·세션 인증·통합 테스트
contracts/   OpenAPI 정본·타입 생성기·초기 계약 보존본
deploy/      JCloud 역방향 프록시 예시
docs/        개발·명세·디자인 참고·검증·작업 기록
```
