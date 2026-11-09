# 튠잇 프론트·애니메이션 랜딩 초기 구성 및 Git 정리

- 날짜: 2026-11-10
- 요청: 지금까지의 작업을 정리하고 `jooho-le/TUNIT`의 `main`에 한국어 커밋으로 업로드. 이후 작업마다 Markdown 기록과 커밋 메시지 제공.
- 원격 저장소: https://github.com/jooho-le/TUNIT

## 변경 내용

### Notion 요구사항과 프론트 구조

- 작업 트래커의 기능·UI/logic 플로우·아키텍처·폴더·환경변수·테스트 문서 7개를 읽고 React + TypeScript + Vite 프론트를 재구성했다.
- 루트 npm workspaces와 `frontend/`, `backend/`, `contracts/`, `deploy/`, `docs/` 모노레포 구조로 정리했다.
- React Router, 공통 세션 표시, 기능별 화면, 공통 UI, 타입과 API 인터페이스를 분리했다.
- 가입·로그인 → 단계별 취향 입력 → 기본 취향 프로필 → Home의 세 경로(혼자 탐색 / Music Twin / 친구 비교)를 연결했다.
- My Taste의 닉네임·취향 수정, 공개 변경, 취향 삭제, 로그아웃을 구현했다.
- 실제로 생성한 로컬 테스트 계정만 후보로 사용하며 초기 추천 사용자를 자동으로 만들지 않는다. 후보 0명은 정상 상태로 안내한다.
- 친구 초대의 링크 발급·복사·대기·미완료·공개/동의·만료·가입 후 복귀·1:1 비교를 연결했다.
- 관심 요청의 PENDING → ACCEPTED/REJECTED/CANCELLED, 발신자/수신자 권한, 본인·중복 요청 거절, 수락된 연결을 로컬 프론트에서 체험하도록 구현했다.
- 팔로우·공유는 P1 로컬 UI다. P2 채팅·공동 플레이리스트·피드는 준비 화면과 연결 확인만 제공한다.

### 디자인과 새 랜딩

- `#FFF21A`, `#171717`, `#A66BFF` 색상을 유지했다.
- 노란 헤드셋 이미지와 별도 보라색 SVG 물감 스플래시, 등장 모션·스크롤 패럴랙스를 사용한다.
- 추가된 Notion S01 요구사항에 따라 `LandingPage`, `IntroSequence`, `HeroSection`, `FeatureStory`, `FinalCTA`로 나눴다.
- `/landing`은 서비스 소개용 독립 랜딩이고 `/home`은 로그인·취향 완료 후 개인 화면이다. 루트 진입은 랜딩으로 이어진다.
- 약 1.8초의 로고·링 인트로, 움직이는 음파 Hero, 취향 분석·Music Twin·음악 발견·친구 비교 스토리와 마지막 CTA를 구성했다.
- 모든 시작 CTA는 프론트 `/start`에서 로그인·취향 상태를 확인해 로그인/온보딩/Home으로 안내한다.
- 인트로는 **오른쪽 Hero 시각 영역의 짧은 모션**이다. 전체 화면을 전환하는 인트로는 아직 구현하지 않았다. 같은 탭에서 완료/건너뛰기 후 반복하지 않으며 동작 줄이기 설정에서도 생략한다.
- 반복 모션은 화면 밖·백그라운드 탭에서 멈추고, 작은 화면·동작 줄이기·저속 갱신 화면에서는 효과를 줄인다.
- 디자인 참고 문서 `DESIGN.md`, `DESIGN (1).md`, `DESIGN3.md`와 기존 이미지 원본을 함께 보존한다. `DESIGN3.md` 전체를 구현에 반영했다는 의미는 아니다.

### 데이터·백엔드 경계

- 기본 동작은 브라우저 `localStorage`/`sessionStorage`를 쓰는 mock 어댑터다. 실제 사용자 인증·DB 저장이 아니다.
- 같은 출처 `/api/v1`, 세션 쿠키 포함, CSRF 헤더 처리, 오류 안내를 위한 미래 HTTP 어댑터와 OpenAPI 초안을 작성했다.
- 백엔드는 Java 패키지와 Gradle·환경·리소스·테스트 위치만 준비했다. Spring 실행 앱·Controller·Service·Entity·Repository·DB 스키마는 구현하지 않았다.
- JCloud용 Nginx 구성은 검토용 예시만 작성했으며 시스템에 설치하거나 배포하지 않았다.
- 실제 비밀값은 포함하지 않고 `.env.example`만 공유한다. Codex/MCP 설정·인증 파일·Notion 문서는 저장소에 반영하지 않는다.

### Git 및 이후 작업 방식

- 이 폴더는 원래 상위 홈 폴더의 `InsightSpend` Git 저장소 설정을 상속하고 있었다.
- 상위 저장소를 수정하지 않고 `TUNIT/.git`을 새로 구성해 지정한 TUNIT 원격 저장소에만 연결했다.
- 업로드 전 원격 저장소가 비어 있고 기본 브랜치가 `main`인 것을 확인했다. 기존 원격 커밋을 덮어쓰거나 강제 푸시하지 않는다.
- `node_modules`, 빌드 산출물, `.preview` 백업, 실제 `.env`, 세션/인증 파일은 업로드에서 제외한다. 기존 백업은 로컬에 유지한다.
- 루트 `AGENTS.md`에 작업별 Markdown 기록·한국어 커밋 메시지 제공 규칙과 기존 사용자 제약을 기록했다. 이후 자동 커밋/푸시를 허용하는 규칙은 아니다.

## 주요 파일

- [라우팅](../../frontend/src/app/App.tsx), [랜딩](../../frontend/src/features/landing/LandingPage.tsx), [랜딩 스타일](../../frontend/src/styles/landing.css)
- [프론트 API](../../frontend/src/api/types.ts), [로컬 어댑터](../../frontend/src/api/mock.ts), [HTTP 어댑터](../../frontend/src/api/http.ts)
- [전체 화면 지도](../screens.md), [아키텍처](../architecture.md), [API 계약](../api-spec.md), [상태 규칙](../state-transitions.md), [검증 기록](../test-results.md)
- [백엔드 준비 범위](../../backend/README.md), [배포 준비 범위](../../deploy/README.md), [작업 지침](../../AGENTS.md)

## 검증

- 기존 프론트 검증: Vitest **44개 테스트 통과**, TypeScript strict 검사·Vite production build 통과.
- 이번 Git 정리에서도 `npm test` **44/44**, `npm run build` **통과**를 재확인했다.
- 공유 대상 100개 파일의 주요 비밀값 패턴 검사에서 발견 0건이었다. 실제 환경변수·의존성·빌드·로컬 백업은 Git 제외 규칙으로 빠지고, `.env.example`만 포함됨을 확인했다.
- 개발·프리뷰·백엔드 서버는 실행하지 않는다.

## 미구현·미검증

- 전체 화면 브랜드 인트로 전환.
- 실제 브라우저·모바일 뷰포트·모션 프레임 시각 검증: 기존 탭 접근 시간 초과로 미완료.
- 실제 Spring Security 인증·BCrypt·HttpOnly 세션·CSRF 강제, PostgreSQL 저장·제약·롤백·동시 트랜잭션, JCloud 외부 접속.
- 다른 기기 간 초대·데이터 공유, 실제 팔로우 API, P2 채팅·공동 목록·피드.
- 로컬 테스트 결과를 실제 서버/DB 통합 성공으로 표시하지 않는다.

## 커밋 메시지

```text
feat: 튠잇 프론트와 애니메이션 랜딩 초기 구성

- Notion 플로우에 맞춰 가입·취향·추천·초대·관심 요청 화면 연결
- 기존 3색과 노란 헤드셋을 유지한 인트로·스크롤 랜딩 구성
- 브라우저 mock과 향후 Spring HTTP 어댑터·API 계약 분리
- 백엔드·JCloud 배포는 폴더와 설정 초안만 준비
- 프론트 테스트 44개와 TypeScript·빌드 검증
- 작업별 Markdown 기록과 한국어 커밋 메시지 제공 규칙 추가
```
