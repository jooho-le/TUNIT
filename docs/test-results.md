# 검증 기록

[문서 안내](README.md) · [화면 지도](screens.md) · [작업 기록](work-log/README.md)

## 백엔드 기반 검증 — 2026-11-19

실행 명령은 저장소 루트의 `backend/scripts/test-postgres.sh`다. Java 21·생성한 Gradle Wrapper 9.5.1·Spring Boot 4.1.2·실제 PostgreSQL 16.15를 사용했다. SCRAM 인증을 쓰는 임시 DB에 적용했으며 검사 후 해당 클러스터를 종료·삭제했다. 상시 Spring HTTP 서버·운영 DB·프론트는 실행하지 않았다.

| 검사 | 결과 | 확인한 범위 |
| --- | --- | --- |
| CommonContractTest | 4 PASS | OpenAPI 필수 필드와 DTO 대조·페이지 DTO 불변성·미확정 size 상한 미적용·민감 경로 마스킹·자격 증명 toString 비노출 |
| DatabaseFoundationTest | 9 PASS | V1·14개 테이블/Entity/Repository·재적용 no-op·PK/FK/CHECK/UQ·UUID 순서·@Version·실패 롤백·GENRE DB 보류 경계 |
| SecurityFoundationTest | 14 PASS | CSRF·세션 로그인/조회/로그아웃·ID 변경·옛/다른 세션 CSRF 거절·비활성 계정·로그인 DB 조회 실패 후 미인증 유지·잘못된 JSON 타입 거절·공통 오류 형식 |
| OwnTasteApiTest | 15 PASS | 가입 201·BCrypt·Unicode/UTF-8 경계·동시 중복 201/409·취향 CRUD/완료/입력/소유권·부분 설정·CSRF·삭제 계정·롤백·동시 전체 교체·활성 태그 |
| ApiRouteContractTest | 1 PASS | 실제 Controller와 Security 로그아웃의 11개 HTTP 작업이 OpenAPI와 일치 |
| 전체 JUnit | **43/43 PASS, FAIL 0, SKIP 0** | 실제 Spring 필터·Controller·임시 PostgreSQL, H2 미사용 |
| bootJar | PASS | 실행 JAR 생성, 테스트 전용 Controller가 포함되지 않음 |
| Gradle Wrapper | PASS | 공식 SHA-256 고정, Java 21에서 실제 실행 |

Security 검사에서 인증·CSRF·입력 오류 및 프로토콜 오류를 확인했지만, 관심 수락/취소 전체 동시성·친구 비교·비공개 후보 제외 같은 미구현 업무 API의 성공을 의미하지 않는다. GENRE의 DB 직접 쓰기와 PENDING 중복 방지는 보류 상태다. MockMvc는 브라우저 쿠키 전송·JCloud 외부 HTTP까지 확인한 결과가 아니다. 이 백엔드 작업에서는 변경하지 않은 프론트 검사를 재실행하지 않았다.

로그인 응답 준비 중 DB 조회가 실패하면 신규 인증 세션을 저장하지 않으며, JSON 문자열 필드에 숫자·불리언을 보내면 400으로 거절한다. 장애 테스트는 Repository 예외 주입이며 실제 DB 중단 시험은 아니다. 수정 전 실패·수정 후 통과와 동일 DB 재실행 근거는 [백엔드 재검증 기록](work-log/2026-11-19-backend-verification.md)에 있다.

생성된 로컬 증거는 `backend/build/reports/tests/test/index.html`, `backend/build/test-results/test/TEST-*.xml`, `backend/build/reports/postgres-verification.txt`다. 마지막 파일은 Flyway V1 성공 1건·업무 테이블 14개를 실제 PostgreSQL에서 조회한 결과다. 소스·변경 파일은 [백엔드 작업 기록](work-log/2026-11-19-backend-foundation.md)을 참고한다.

추가 API·사용자가 승인한 정책과 최신 파일 목록은 [누락 명세 추가 구현 기록](work-log/2026-11-19-backend-missing-specs.md)에 있다. 동시 가입은 사전 중복 검사를 통과하도록 두 요청을 맞춘 뒤 실제 PostgreSQL UNIQUE 경합으로 201/409를 확인했다. 취향 교체는 실제 FK 오류를 주입하고, 초기화는 앞의 두 관계 삭제 후 Repository 장애를 주입해 전체 롤백을 확인했다. PostgreSQL 프로세스 중단·장애 복구 시험은 아니다.

## 마지막 프론트 앱 검증

검증일은 2026-11-19(KST), 기준은 가독성·행동 구분을 개선한 `frontend` 파일이다. 앱 테스트·빌드와 HTML 보드 생성을 다시 실행했다. React·Vite·Vitest·React Testing Library·jsdom의 기존 검사 환경을 사용했다. 초기 검증 이력은 [25f5410](https://github.com/jooho-le/TUNIT/commit/25f54107bea95fbcc09d2183afc880d94601afab)에 보존한다.

| 검사                       | 기록된 결과              | 범위                                                          |
| -------------------------- | ------------------------ | ------------------------------------------------------------- |
| `npm test`                 | **51/51 통과**, 6개 파일 | 로컬 데이터·HTTP 계약·DOM 흐름·랜딩·모션 수명주기             |
| `npm run build`            | **통과**                 | TypeScript strict·Vite production build                       |
| HTML 디자인 보드 검사      | **3/3 통과**, 2개 파일   | 45개 상태 추출·CSS 구문·개별 화면/Escape·전체 HTML 내보내기 |
| 디자인 내보내기 TS 검사    | **통과**                 | 내보내기 소스·템플릿·전용 설정; 보기 JS는 별도 구문 검사 |
| 의존성 설치 당시 npm audit | **발견 0건**             | Vitest 4.1.12로 조정한 당시 lockfile 검사; 실시간 재검사 아님 |

변경 내용과 실행 범위는 [가독성 개선 작업 기록](work-log/2026-11-19-frontend-readability.md)에 있다. 이전 [DESIGN3 개편](work-log/2026-11-10-freshman-redesign.md)과 [문서 정리](work-log/2026-11-10-documentation-cleanup.md)는 각각의 기록에 보존한다. 수정본의 실제 브라우저 실측은 컴퓨터 사용 도구 오류로 완료하지 못했다. DOM·빌드 성공을 브라우저·Figma 반입·서버/DB 통합 성공으로 표시하지 않는다.

## 자동화 테스트 위치

| 파일                                                                                | 개수 | 확인한 것                                                                          |
| ----------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------- |
| [mock.test.ts](../frontend/src/api/mock.test.ts)                                    | 16   | 계정·취향·후보·초대·관심 상태·로컬 저장 실패                                       |
| [client.test.ts](../frontend/src/api/client.test.ts)                                | 6    | 쿠키·CSRF 헤더·오류·자동 재시도 차단                                               |
| [App.test.tsx](../frontend/src/app/App.test.tsx)                                    | 12   | 가입·온보딩·후보 0명·취향 변경/삭제·요청·비공개·로그아웃·외부 링크                 |
| [LandingPage.test.tsx](../frontend/src/features/landing/LandingPage.test.tsx)       | 11   | 인트로 완료/건너뛰기·전체 타이틀·즉시 CTA·초점·저장값 보존·동작 줄이기·상태별 이동 |
| [scrollMotion.test.ts](../frontend/src/hooks/scrollMotion.test.ts)                  | 2    | 늦게 마운트된 장면·등장·화면 밖 일시 정지·observer/프레임 정리                     |
| [EditorialShell.test.tsx](../frontend/src/components/shell/EditorialShell.test.tsx) | 4    | 메뉴 초점·Escape·경로 보호·스크롤 복구·릴 경로/활성 표시·챕터 이동                 |

테스트는 격리된 jsdom/메모리 저장소와 mock fetch를 쓴다. 사용자의 실제 브라우저 데이터를 읽거나 지우지 않으며 실제 서버 인증·DB 결과의 증거는 아니다.

## Notion T01~T24 대응

| 시나리오                | 이번에 확인한 것                                                        | 실제 서버/DB 기준                            |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| T01 가입                | 폼→로컬 가입→온보딩, 원문 비밀번호 미보관                               | 가입 201·정규화·BCrypt 저장/검증·별도 로그인 확인 |
| T02 중복 가입           | 로컬 이메일 정규화·중복 409                                             | 동시 가입 201 한 건/409 한 건·DB 사용자 한 건 확인 |
| T03 미인증 변경         | 로컬 보호 작업 401·보호 경로 로그인                                     | 유효 CSRF를 동반한 미인증 변경 요청 401 확인; 업무 변경 미구현 |
| T04 타인 취향 변경      | 클라이언트는 `/me`만 제공, 삭제 시 다른 계정 취향 유지                  | 세션 본인만 변경·타인 ID query 변조 시 타인 보존; 타인 취향 수정 경로 미제공 |
| T05 미완료 취향         | 매칭 422·온보딩 안내                                                    | 부분 저장 INCOMPLETE·승인 기준 COMPLETE 확인; 매칭 API 미구현 |
| T06 취향 CRUD           | 단계 저장·재생성/조회·공개 변경·삭제·재진입                             | PUT/GET/PATCH/DELETE 실제 영속성·실패 롤백 확인 |
| T07 중복 곡             | 로컬 ID 중복 제거                                                       | user_tracks 복합 PK 확인; 취향 PUT 중복 UUID 검증 구현 |
| T08 사용자 한 명        | 후보 0명·혼자 탐색·초대 대안 DOM 확인                                   | 실제 후보 조회 미검증                        |
| T09 친구 비교           | 가입·온보딩 후 초대 복귀, 동의 후 실제 로컬 두 계정 비교                | 다른 기기·API 미검증                         |
| T10 초대 만료/동의 없음 | 미동의·대기·만료·타 참여자 거절                                         | 서버 토큰·인가 미검증                        |
| T11 자기 요청           | 로컬 400, 요청 없음                                                     | 실제 API 미검증                              |
| T12 중복 요청           | 같은/역방향 쌍 409                                                      | 여러 연결의 동시 요청·DB 제약 미검증         |
| T13 수락                | 로컬 ACCEPTED + 연결 한 건, 받은 목록→연결 DOM 확인                     | 실제 트랜잭션 미검증                         |
| T14 거절                | 로컬 REJECTED·연결 없음                                                 | 실제 API 미검증                              |
| T15 취소                | 로컬 CANCELLED·연결 없음                                                | 실제 API 미검증                              |
| T16 행동 주체 위반      | 로컬 sender/receiver/third-party 403, PENDING 유지                      | 서버 보안 주체 검증 미검증                   |
| T17 종료 상태           | 로컬 추가 행동 409, 중복 연결 없음; 충돌 DOM 새로 조회                  | 서버 잠금·DB 불변 미검증                     |
| T18 중간 저장 실패      | 로컬 저장 전 실패 주입→PENDING·연결 없음                                | 기본 DB 롤백 확인; 관심 수락 트랜잭션 롤백 미검증 |
| T19 수락/취소 경합      | 같은 JS 프로세스의 연속 경합에서 한 번 성공                             | @Version stale write 거절 확인; 수락/취소 업무 경합 미검증 |
| T20 AI 장애/비활성      | 기본 규칙 프로필·점수, 분석 화면 오프라인 대체 DOM                      | AI API를 호출하지 않음; 실제 타임아웃 미검증 |
| T21 비공개              | 로컬 후보 제외·상대 상세 403, DOM 비노출                                | 공개·비교 동의 각각 저장 확인; 후보 제외·비교 인가·추천 캐시 미구현 |
| T22 외부 접속           | 해당 없음                                                               | **실제 프론트 연동·JCloud 외부 접속 미검증** |
| T23 로그아웃            | 로컬 세션 무효·데이터 유지·로그인 복귀, 보호 요청 401 처리              | MockMvc의 Spring 세션 무효화·204·미인증 401 확인; 실제 브라우저 미검증 |
| T24 CSRF                | mock fetch로 토큰 선발급·헤더·없으면 미전송·403 재발급·자동 재시도 없음 | Spring 필터의 누락/옛/타 세션 토큰 403·취향 쓰기 전후 DB 불변 확인; 실제 브라우저 미검증 |

## 검증 한계와 다음 단계

- 실제 브라우저 스크린샷·터치·모바일 viewport·모션 프레임·외부 글꼴 다운로드는 미검증이다. 실행 중인 5173 포트가 다른 프로젝트의 서버임을 확인해 이 프로젝트의 화면 검사에 사용하지 않았다.
- Spring BCrypt·세션·CSRF, 본인 취향 소유권·CRUD·동시 전체 교체, PostgreSQL 제약·롤백·낙관적 잠금은 위 검사로 확인했다. 추천/초대/관심 업무의 인가·수락/취소 경합·실제 프론트 연동은 미구현/미검증이다.
- JCloud에서 다른 컴퓨터로 수행하는 가입→취향 저장→초대→관심 수락은 미검증이다.
- 개발·프리뷰·백엔드 서버를 새로 실행하거나 브라우저 설정을 바꾸지 않았다.

업무 API와 프론트 연결 후 T01~T24를 실제 HTTP·PostgreSQL로 다시 수행하고 화면/API/DB 결과를 함께 기록한다. 로컬 Promise 경합·JSON 저장 실패·mock CSRF 확인을 실제 동시 트랜잭션·롤백·서버 인가 테스트로 대체하지 않는다.

초기 구현 중 해결한 문제와 도구 변경의 이력은 [문서 정리 기록의 이관 메모](work-log/2026-11-10-documentation-cleanup.md#초기-구현-메모-이관)에 보존했다.
