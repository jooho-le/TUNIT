# TUNIT

Notion 작업 트래커의 **진행중 7개 문서**를 기준으로 다시 구성한 음악 취향 서비스 프론트입니다. React + TypeScript + Vite + React Router를 사용합니다.

현재 구현 범위는 **프론트 UI와 브라우저 로컬 어댑터**입니다. Spring Boot·PostgreSQL은 폴더와 설정 초안만 준비했으며 실제 서버 인증, DB 저장, JCloud 배포는 아직 구현하지 않았습니다.

## 화면과 디자인

- 색상: `#FFF21A`, `#171717`, `#A66BFF` 유지.
- `DESIGN (1).md`의 큰 타이포그래피·여백·제품 중심 구성을 유지했습니다.
- 별도 애니메이션 랜딩: 짧은 TUNIT 인트로 → 움직이는 음파·노란 헤드셋 Hero → 네 가지 스크롤 소개 → 마지막 시작 CTA.
- 노란 헤드셋·보라색 물감 스플래시 유지. 작은 화면에서는 효과를 줄이고, 동작 줄이기·낮은 갱신 주기 설정에서는 정적으로 표시합니다.
- 가입 → 아티스트 → 곡 → 장르·무드 → 기본 분석 → Taste Profile → Home.
- Home에서 **혼자 탐색 / Music Twin / 친구 초대**로 이동합니다.
- 후보 0명, 초대 대기·미완료·동의·만료, 비공개, 요청 충돌·권한 오류를 별도 상태로 처리합니다.
- 관심 요청의 전송·조회·수락·거절·취소·연결까지 프론트에서 체험할 수 있습니다.
- 팔로우·공유는 P1 로컬 UI입니다. 대화·공동 플레이리스트·피드는 Notion의 P2 분류에 따라 경로와 준비 안내만 제공합니다.

전체 27개 화면 대응은 [화면 지도](docs/screens.md), 구현 경계는 [아키텍처](docs/architecture.md)를 확인하세요.

## 폴더

```text
frontend/
  src/
    app/          # Router, SessionProvider, route tests
    pages/        # 로그인 후 Home
    features/     # landing, auth, taste, matching, discovery, invitations, interests, social
    api/          # typed interface, local mock, future HTTP adapter
    components/ hooks/ types/ styles/ test/
  public/assets/  # 기존 이미지와 헤드셋
backend/           # Java 패키지·Gradle·환경 설정 초안 (실행 앱 없음)
contracts/         # OpenAPI 초안
deploy/           # JCloud Nginx 예시, 서비스 실행 위치 예약
docs/             # API·화면·상태·테스트 기록
```

설치·명령은 저장소 루트에서 수행합니다. 실행할 때만 사용자가 아래 명령을 직접 입력하세요. 이번 작업에서 개발·프리뷰·백엔드 서버를 시작하지 않았습니다.

```sh
npm ci
npm test
npm run build
# 사용자가 화면을 열기로 결정했을 때만:
npm run dev
```

Node 20.19 이상, npm workspaces 기준입니다. 개발 주소는 Vite 실행 시 출력되며, 빌드 결과는 **frontend/dist/**에 생성됩니다. `npm run build`와 `npm test`는 상시 서버를 띄우지 않습니다. CI 설정도 이 두 검사만 수행합니다.

## 로컬 체험

기본 `VITE_API_MODE=mock`입니다. 예시 사용자를 자동 생성하지 않습니다. 최초 회원가입한 한 명에게는 Music Twin 후보가 **0명**인 것이 정상입니다. 음악 선택용 예시 메타데이터만 포함하며 없는 음악은 직접 추가할 수 있습니다.

1. 계정 A를 가입하고 취향 입력을 완료합니다. 친구 비교를 원하면 공개 설정을 켭니다.
2. Home → 친구 비교 → 비교 동의 → 초대 링크를 만듭니다.
3. My Taste에서 로그아웃하고 같은 브라우저에서 계정 B를 가입합니다. 별도 탭에서도 가입할 수 있지만 탭 복제 시 세션이 복사될 수 있으므로 다른 계정으로 로그인했는지 확인하세요.
4. B의 취향 입력을 끝내고 초대 링크를 열어 비교에 동의합니다.
5. 공개 프로필 → 관심 보내기 → 보낸 요청을 확인합니다. 상대 계정으로 전환하면 받은 요청에서 수락·거절할 수 있습니다. 보낸 계정은 대기 요청을 취소할 수 있습니다.
6. 취향 수정·삭제·비공개는 이후 추천/비교 조회에 반영됩니다. 다른 탭에서 변경했다면 페이지의 상태 확인 버튼 또는 재진입으로 갱신합니다.

로컬 계정·취향·요청은 `localStorage`의 `tunit-browser-demo-v1`, 로그인 상태는 탭별 `sessionStorage`의 `tunit-browser-demo-session`을 사용합니다. 실제 서비스 비밀번호는 사용하지 마세요. 로컬 체험용 비밀번호는 PBKDF2 단방향 값으로 보관하지만 서버 보안 경계가 아니며, 실제 Spring의 BCrypt·HttpOnly 세션을 대신하지 않습니다. 기존 `tunit-profile` 저장값은 덮어쓰지 않습니다.

로컬 초대 링크는 같은 출처·브라우저 저장소 안에서만 유효합니다. 다른 기기·시크릿 창·다른 포트는 데이터를 공유하지 않습니다. 데이터 공유, 실제 사용자 인증과 영속 저장은 Spring API 연결 후 검증해야 합니다. 음악 듣기는 외부 음악 검색을 새 탭으로 열며 앱 내부에서 음원을 재생하지 않습니다.

## 향후 API 연결

`frontend/.env.example`에 공개 설정 예시가 있습니다. 백엔드가 준비되면 개인 `.env.local`에 `VITE_API_MODE=http`, `VITE_API_BASE_URL=/api/v1`을 설정합니다. `VITE_` 값에 키·DB 비밀번호를 넣지 않습니다.

HTTP 어댑터는 같은 출처 `/api/v1`, `credentials: include`, 변경 요청 전 CSRF 토큰 발급을 사용합니다. 로그인 후 토큰을 새로 받으며, 401은 로그인 화면으로, 403/409는 권한·충돌 안내로 처리합니다. HTTP 실패를 가짜 성공으로 대체하거나 변경 요청을 자동 재전송하지 않습니다. 로컬 Vite `/api` 프록시 대상은 `127.0.0.1:8080`입니다.

계약은 [API 문서](docs/api-spec.md)와 [OpenAPI](contracts/openapi.yaml), 이후 서버 작업은 [backend/README.md](backend/README.md)에 정리했습니다. 현재 실제 API를 호출하면 서버 미연결 오류가 나는 것이 정상입니다.

## 검증과 보존

실행 결과와 Notion T01~T24의 적용 범위는 [테스트 기록](docs/test-results.md)에 있습니다. jsdom UI 테스트를 실제 브라우저·Spring·PostgreSQL·JCloud 통합 성공으로 취급하지 않습니다.

기존 디자인 문서와 이미지, 노란 헤드셋 수정본을 유지했습니다. 변경 전 앱과 중단된 구현은 로컬 `.preview/`에 보관하며 Git 업로드에서는 제외합니다. 실제 환경변수·Codex 설정·Notion 문서는 수정하지 않았고, 배포·자동 동기화도 수행하지 않았습니다.

작업별 변경 내용·검증·남은 사항·한국어 커밋 메시지는 [작업 기록](docs/work-log/README.md)에 정리합니다. 이후 작업 원칙은 [AGENTS.md](AGENTS.md)를 따릅니다. 커밋·푸시는 사용자의 명시적 요청이 있을 때 진행합니다.
