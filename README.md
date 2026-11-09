# TUNIT

음악 취향으로 나를 발견하고 사람을 연결하는 웹 프론트. React + TypeScript + Vite + React Router를 사용한다.

현재 동작 범위는 **브라우저 로컬 데모**다. 가입·취향 관리·친구 비교·관심 요청 UI를 체험할 수 있으며, Spring Boot·PostgreSQL·JCloud는 구조와 설정 초안만 준비되어 있다.

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

계정은 브라우저에만 저장되므로 실제 서비스 비밀번호를 사용하지 않는다. 두 테스트 계정으로 체험하는 방법은 [개발 가이드](docs/development.md)에 있다.

현재 화면은 `DESIGN3.md`의 큰 이탤릭 워드마크·얇은 선·각진 구성·하단 필름 릴을 반영한다. 주요 색상은 기존 노랑·차콜·보라를 유지한다.

## 문서

| 목적                          | 문서                                 |
| ----------------------------- | ------------------------------------ |
| 현재 구현 상태·문서 전체 탐색 | [문서 안내](docs/README.md)          |
| 작업 브랜치·통합·최종 반영    | [브랜치 운영](docs/git-workflow.md)  |
| 색상·화면 구성·모션 기준      | [현재 디자인 기준](DESIGN.md)        |
| 화면별 경로·랜딩 동작         | [화면 지도](docs/screens.md)         |
| 코드 구조·데이터·백엔드 경계  | [아키텍처](docs/architecture.md)     |
| 미래 Spring API 요청·응답     | [API 계약](docs/api-spec.md)         |
| 실행했던 검사와 미검증 범위   | [검증 기록](docs/test-results.md)    |
| 변경 이력·한국어 커밋 메시지  | [작업 기록](docs/work-log/README.md) |
| 작업 시 지켜야 할 사용자 지침 | [AGENTS.md](AGENTS.md)               |

## 저장소 구조

```text
frontend/    React 앱·테스트·정적 자산
backend/     Java 패키지·Gradle·환경 설정 초안
contracts/   OpenAPI 계약 초안
deploy/      JCloud 역방향 프록시 예시
docs/        개발·명세·디자인 참고·검증·작업 기록
```
