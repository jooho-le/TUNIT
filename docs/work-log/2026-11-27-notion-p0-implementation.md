# Notion 26문서 기반 Spring P0 구현 — 2026-11-27

## 요청과 범위

TUNIT 작업 트래커에서 `작업 구분`이 `Codex 개발` 또는 `설계 완료`인 문서를 모두 읽고 구현한다. 상태는 추가 제한하지 않았다. 전체 **26개(Codex 개발10·설계 완료16), has_more=false**를 조회하고 본문을 대조했다. [문서별 제목/원문/구현 연결](../notion-p0-implementation-review.md)에 전부 기록했다. Notion은 읽기만 했고 상태나 문서를 바꾸지 않았다.

기존 `frontend` 브랜치는 깨끗한 `60bffc3`였지만 최신 백엔드는 GitHub dev `c69f959bb6e1c5d7ed045ff603028d93dcd1f30d`에 있었다. 원격 조회로 dev를 확인한 뒤 로컬 origin/dev에서 `feature/notion-p0-20261127` 작업 브랜치를 만들었다. 기존 frontend의 스플래시/디자인 커밋은 해당 브랜치에 보존했으며 병합·커밋·푸시·배포는 하지 않았다. 새 작업 브랜치의 프론트 디자인은 dev 기준이다.

## 사용자 승인과 충돌 해결

- 추천 가중치는 사용자 답변 **“문서 제안식을 초기 기준으로 구현”**에 따라 아티스트30%·곡30%·장르40%다. 관계 성사 확률이나 검증된 모델 성능을 뜻하지 않는다.
- 초대는 24시간·고엔트로피 토큰 해시 저장·상대1명·완료 재사용 금지·매 비교 시 양측 COMPLETE/공개/동의 확인 기준을 승인받았다.
- 관심은 양방향 PENDING409·수신자 수락/거절·발신자 취소·거절/취소/연결 해제 뒤 새 요청 허용, 당사자 연결 해제/제3자403/ACCEPTED 이력 보존을 승인받았다.
- 검색은 DB 등록 음악만, 기본20/최대50·이름/제목→UUID·q최대255자다. 공급자·이미지 권한이 확정되지 않아 자동 수집/시드/가짜 추천을 넣지 않았다.
- 예전 `/music/catalog`, 초대 `/accept`, 프론트 전체 Taste·배열 응답 가정을 현재 상세 DTO·페이지·`/complete`에 맞췄다. 선택 캐시 `match_snapshots`를 새 테이블로 만들지 않았다.
- 닉네임 편집을 위한 `PATCH /me/profile`, 초대 대기 화면용 개인정보 없는 `viewerRole/expiresAt`, T29 공통 장르 표시용 `commonArtistGenres`는 기존 UI/Notion 요구를 연결하는 명시적인 계약 보완이다. OpenAPI·Java·TypeScript를 함께 갱신했다.
- 만료/없는 초대는 기존 404, 없는/해제된 연결은404. 회원탈퇴·P1 초대 철회·GENRE DB 직접 쓰기 강화·운영 보존 정책은 임의로 확정하지 않았다.

## 변경 내용

- 기존11개에 검색/분석/추천/발견·초대·관심·연결·닉네임을 더해 **30개 HTTP 작업**을 제공한다. Entity 직접 반환 대신 전용 DTO를 쓰고 OpenAPI에서 TS 타입을 생성한다.
- 직접/아티스트/곡 출처별 GENRE 분포를 정규화하고 Jaccard/cosine을 계산한다. 없는 특징은 null로 표현하고 가용 가중치를 재정규화한다. 실제 공개/COMPLETE 후보만 반환하며 후보0명은200/빈 목록이다.
- 초대 토큰은 생성 URL에서 한 번 반환하고 DB에는SHA-256을 저장한다. 익명 GET은 개인정보와 저장 부작용이 없다. 완료/비교는 당사자·기한·공개·동의·완료 상태를 검사한다.
- 사용자 쌍을 PostgreSQL UUID 순서로 잠그며 수락 상태/연결 INSERT는 같은 트랜잭션이다. V2는 양방향 PENDING 부분 UNIQUE만 추가하고 V1/14개 테이블을 유지한다. 연결 해제는 현재 관계만 삭제한다.
- 서버 생성 요청 ID·no-store·민감정보 없는 애플리케이션 요청 메타데이터 로그를 더했다. Nginx access log 예시도 원문 URI/쿼리/토큰을 빼도록 바꿨고 운영에는 적용하지 않았다.
- HTTP 어댑터는 UUID/페이지/서버 DTO를 뷰 모델로 변환한다. 태그와 공개 설정을 분리하고 가입 후 별도 로그인, CSRF 캐시 초기화, null 외부 링크, 필드 오류·초점·입력 보존을 처리한다. 응답이 불확실한 관심 생성/연결 해제는 GET으로 현재 상태를 확인하며 쓰기를 자동 재전송하지 않는다.
- 서버에 없는 음악 직접 등록·관심 한마디는 HTTP UI에서 숨겼다. 연결 해제 확인·제3자/만료 초대 안내를 보완했다. CSS/3색/랜딩 자산은 유지했다.
- 디자인 단일 HTML은 **46상태**로 재생성했다. 디자인 fixture이며 서버 데이터/실제 계정은 읽지 않는다. 현재 API·상태·DB·개발/배포 안내와 과거 기록의 기준일을 정리했다.

## 실제 검증 결과

| 명령/검사 | 결과 |
| --- | --- |
| `backend/scripts/test-postgres.sh` | **72 PASS, FAIL0, SKIP0**, bootJar PASS |
| PostgreSQL16.15 조회 | Flyway V1/V2 성공·업무 테이블14개·JPA validate·재적용no-op |
| `npm test` | **66 PASS**, 10파일 |
| `npm run build` | PASS, TypeScript strict·Vite |
| `node frontend/design/generate.mjs` | **3 PASS**, S01~S27/46상태 |
| 디자인 소스 TypeScript 검사 | PASS; 기존 tsconfig 확장·별도 임시 설정으로 src/design 검사 |
| `node contracts/generate-types.mjs --check` | PASS |
| `git diff --check`·수정 Markdown 상대 링크 | PASS; 변경 Markdown 상대 링크277개/누락0 |

백엔드 기존43개에 P0Workflow24·P0ValueContract4·RequestLogging1을 추가했다. 두 스레드로 실제 DB 경합을 만들었고, 수락을 flush한 뒤 PostgreSQL trigger로 연결 INSERT를 실패시켜 PENDING/버전/연결의 전체 롤백을 확인했다. T25/29/30의 복수 장르·교집합·두 조인 테이블 동시 PK 중복, 연결 해제/재신청 경합도 확인했다. 프론트는 기존51개에 HTTP계약7·가입/필드2·연결해제4·관심응답실패2를 더했다.

검사 과정에서 큰 페이지 offset500·알 수 없는 JSON 필드 묵인을 발견해400으로 수정했다. JDBC fixture의 Instant 직접 바인딩 실패는 OffsetDateTime으로 바로잡았다. 실패한 실행을 PASS에 합산하지 않았다. 마지막 JUnit XML은8개 suite/72개, failures/errors/skipped 모두0이다. 자세한 T01~T44 대응은 [검증 기록](../test-results.md)을 따른다.

임시 SCRAM PostgreSQL은 기존 DB_URL/개발 DB를 쓰지 않고 검사 후 종료/삭제했다. 상시 프론트/Spring 서버·백그라운드 동기화·서브에이전트를 시작하지 않았다. 실제 환경 파일·모델·다른 MCP·인증 설정은 변경하지 않았다. V1과 AGENTS/CI/VSCode/스타일/랜딩/정적 자산 등 보호한21개 파일은 기준dev SHA-256과 일치한다. V1 SHA-256은 `914e84ac06a384a1a7b7076dcc659f9a71c5f8232a722e1d5476bd8cf31bf23a`다.

로컬 증거는 [JUnit HTML](../../backend/build/reports/tests/test/index.html), [PostgreSQL 조회 결과](../../backend/build/reports/postgres-verification.txt)에 생성됐다. build 산출물은 gitignore 대상이다. 개발 중 명령 로그와 원문 스냅샷은 저장소 밖 임시 디렉터리에 두며 커밋 대상에 넣지 않는다.

## 미구현·미검증과 다음 순서

1. 별도 개발 PostgreSQL과 검토한 카탈로그/태그 데이터, HTTPS/같은 출처 환경을 준비한 뒤 사용자 승인으로 실제 브라우저→HTTP→Spring→DB 흐름을 확인한다. 현재 기본 모드는 mock이며 실제 환경 파일을 바꾸지 않았다.
2. GENRE 복합 FK/직접 SQL 쓰기 강화와 회원탈퇴/개인정보/세션/FK 보존, P1 초대 철회 정책을 확정하고 별도 구현한다. 생성자는 MOOD를 거절하나 일반 FK는 type까지 강제하지 않는다. ACCEPTED/연결 정합은 서비스 트랜잭션에 의존한다.
3. 기존 DB 중복 PENDING 여부를 검토한 뒤 승인된 개발 DB에 V2를 적용한다. 마이그레이션은 중복을 자동 삭제하지 않는다.
4. 백엔드 PostgreSQL 검사를 CI에 연결하고 실제 HTTPS/Nginx/JCloud·운영 로그 마스킹/보관을 검증한다. 현재 GitHub Actions는 기존 프론트 검사만 유지했다.
5. 실제 데이터가 커지면 메모리 계산/다중 조회를 최적화하고 부하/운영 동시성 검사를 한다. 현재 HTTP 카탈로그 로딩은 최대200페이지/10,000행의 기술적 제한이 있다. P1/P2·AI·공급자·원격 이미지 수집은 구현 범위 밖이다.

이번 성공은 MockMvc+실제 PostgreSQL 및 mock fetch/jsdom 증거다. 실제 브라우저 쿠키·네트워크 단절·Figma 반입·운영 DB·JCloud 성공으로 표시하지 않는다. 로컬 mock의 이전 추천식/재요청/410/422 정책은 체험용이며 승인한 실제 서버 정책과 구분한다.

## 실제 생성·수정 파일

아래는 기준 dev 대비 작업 트리의 전체 변경 목록이다. 자동 생성한 타입/디자인 HTML과 문서도 포함한다. 파일을 stage/commit하지 않았다.

| 구분 | 파일 |
| --- | --- |
| 수정 | [README.md](../../README.md) |
| 수정 | [backend/.env.example](../../backend/.env.example) |
| 수정 | [backend/README.md](../../backend/README.md) |
| 생성 | [backend/src/main/java/com/tunit/common/api/ApiRequestLogFilter.java](../../backend/src/main/java/com/tunit/common/api/ApiRequestLogFilter.java) |
| 생성 | [backend/src/main/java/com/tunit/common/api/QueryBounds.java](../../backend/src/main/java/com/tunit/common/api/QueryBounds.java) |
| 수정 | [backend/src/main/java/com/tunit/common/error/ApiErrorWriter.java](../../backend/src/main/java/com/tunit/common/error/ApiErrorWriter.java) |
| 수정 | [backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java](../../backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java) |
| 수정 | [backend/src/main/java/com/tunit/common/error/ErrorCode.java](../../backend/src/main/java/com/tunit/common/error/ErrorCode.java) |
| 생성 | [backend/src/main/java/com/tunit/common/persistence/UserPairLocks.java](../../backend/src/main/java/com/tunit/common/persistence/UserPairLocks.java) |
| 수정 | [backend/src/main/java/com/tunit/config/JsonConfig.java](../../backend/src/main/java/com/tunit/config/JsonConfig.java) |
| 수정 | [backend/src/main/java/com/tunit/config/SecurityConfig.java](../../backend/src/main/java/com/tunit/config/SecurityConfig.java) |
| 생성 | [backend/src/main/java/com/tunit/config/TimeConfig.java](../../backend/src/main/java/com/tunit/config/TimeConfig.java) |
| 생성 | [backend/src/main/java/com/tunit/connection/ConnectionController.java](../../backend/src/main/java/com/tunit/connection/ConnectionController.java) |
| 수정 | [backend/src/main/java/com/tunit/connection/ConnectionRepository.java](../../backend/src/main/java/com/tunit/connection/ConnectionRepository.java) |
| 생성 | [backend/src/main/java/com/tunit/connection/ConnectionService.java](../../backend/src/main/java/com/tunit/connection/ConnectionService.java) |
| 생성 | [backend/src/main/java/com/tunit/connection/ConnectionSummary.java](../../backend/src/main/java/com/tunit/connection/ConnectionSummary.java) |
| 생성 | [backend/src/main/java/com/tunit/discovery/DiscoveryController.java](../../backend/src/main/java/com/tunit/discovery/DiscoveryController.java) |
| 생성 | [backend/src/main/java/com/tunit/interest/InterestActionResponse.java](../../backend/src/main/java/com/tunit/interest/InterestActionResponse.java) |
| 생성 | [backend/src/main/java/com/tunit/interest/InterestController.java](../../backend/src/main/java/com/tunit/interest/InterestController.java) |
| 생성 | [backend/src/main/java/com/tunit/interest/InterestCreateRequest.java](../../backend/src/main/java/com/tunit/interest/InterestCreateRequest.java) |
| 수정 | [backend/src/main/java/com/tunit/interest/InterestRequest.java](../../backend/src/main/java/com/tunit/interest/InterestRequest.java) |
| 수정 | [backend/src/main/java/com/tunit/interest/InterestRequestRepository.java](../../backend/src/main/java/com/tunit/interest/InterestRequestRepository.java) |
| 생성 | [backend/src/main/java/com/tunit/interest/InterestResponse.java](../../backend/src/main/java/com/tunit/interest/InterestResponse.java) |
| 생성 | [backend/src/main/java/com/tunit/interest/InterestService.java](../../backend/src/main/java/com/tunit/interest/InterestService.java) |
| 수정 | [backend/src/main/java/com/tunit/invitation/Invitation.java](../../backend/src/main/java/com/tunit/invitation/Invitation.java) |
| 생성 | [backend/src/main/java/com/tunit/invitation/InvitationController.java](../../backend/src/main/java/com/tunit/invitation/InvitationController.java) |
| 생성 | [backend/src/main/java/com/tunit/invitation/InvitationCreateResponse.java](../../backend/src/main/java/com/tunit/invitation/InvitationCreateResponse.java) |
| 수정 | [backend/src/main/java/com/tunit/invitation/InvitationRepository.java](../../backend/src/main/java/com/tunit/invitation/InvitationRepository.java) |
| 생성 | [backend/src/main/java/com/tunit/invitation/InvitationService.java](../../backend/src/main/java/com/tunit/invitation/InvitationService.java) |
| 생성 | [backend/src/main/java/com/tunit/invitation/InvitationStatusResponse.java](../../backend/src/main/java/com/tunit/invitation/InvitationStatusResponse.java) |
| 생성 | [backend/src/main/java/com/tunit/invitation/InvitationTokens.java](../../backend/src/main/java/com/tunit/invitation/InvitationTokens.java) |
| 생성 | [backend/src/main/java/com/tunit/match/MatchCard.java](../../backend/src/main/java/com/tunit/match/MatchCard.java) |
| 생성 | [backend/src/main/java/com/tunit/match/MatchDetailResponse.java](../../backend/src/main/java/com/tunit/match/MatchDetailResponse.java) |
| 생성 | [backend/src/main/java/com/tunit/match/MatchingController.java](../../backend/src/main/java/com/tunit/match/MatchingController.java) |
| 생성 | [backend/src/main/java/com/tunit/match/MatchingService.java](../../backend/src/main/java/com/tunit/match/MatchingService.java) |
| 생성 | [backend/src/main/java/com/tunit/match/SimilarityBreakdown.java](../../backend/src/main/java/com/tunit/match/SimilarityBreakdown.java) |
| 생성 | [backend/src/main/java/com/tunit/match/SimilarityCalculator.java](../../backend/src/main/java/com/tunit/match/SimilarityCalculator.java) |
| 생성 | [backend/src/main/java/com/tunit/music/ArtistSummary.java](../../backend/src/main/java/com/tunit/music/ArtistSummary.java) |
| 수정 | [backend/src/main/java/com/tunit/music/CatalogController.java](../../backend/src/main/java/com/tunit/music/CatalogController.java) |
| 생성 | [backend/src/main/java/com/tunit/music/CatalogMapper.java](../../backend/src/main/java/com/tunit/music/CatalogMapper.java) |
| 수정 | [backend/src/main/java/com/tunit/music/CatalogService.java](../../backend/src/main/java/com/tunit/music/CatalogService.java) |
| 생성 | [backend/src/main/java/com/tunit/music/SafeCatalogLinks.java](../../backend/src/main/java/com/tunit/music/SafeCatalogLinks.java) |
| 수정 | [backend/src/main/java/com/tunit/music/TrackRepository.java](../../backend/src/main/java/com/tunit/music/TrackRepository.java) |
| 생성 | [backend/src/main/java/com/tunit/music/TrackSummary.java](../../backend/src/main/java/com/tunit/music/TrackSummary.java) |
| 생성 | [backend/src/main/java/com/tunit/taste/GenreWeight.java](../../backend/src/main/java/com/tunit/taste/GenreWeight.java) |
| 생성 | [backend/src/main/java/com/tunit/taste/ProfileController.java](../../backend/src/main/java/com/tunit/taste/ProfileController.java) |
| 생성 | [backend/src/main/java/com/tunit/taste/TasteFeatureLoader.java](../../backend/src/main/java/com/tunit/taste/TasteFeatureLoader.java) |
| 생성 | [backend/src/main/java/com/tunit/taste/TasteFeatures.java](../../backend/src/main/java/com/tunit/taste/TasteFeatures.java) |
| 수정 | [backend/src/main/java/com/tunit/taste/TasteProfileRepository.java](../../backend/src/main/java/com/tunit/taste/TasteProfileRepository.java) |
| 생성 | [backend/src/main/java/com/tunit/taste/TasteProfileResponse.java](../../backend/src/main/java/com/tunit/taste/TasteProfileResponse.java) |
| 생성 | [backend/src/main/java/com/tunit/user/NicknamePatch.java](../../backend/src/main/java/com/tunit/user/NicknamePatch.java) |
| 수정 | [backend/src/main/java/com/tunit/user/TunitUser.java](../../backend/src/main/java/com/tunit/user/TunitUser.java) |
| 생성 | [backend/src/main/java/com/tunit/user/UserProfileController.java](../../backend/src/main/java/com/tunit/user/UserProfileController.java) |
| 수정 | [backend/src/main/resources/application.yml](../../backend/src/main/resources/application.yml) |
| 생성 | [backend/src/main/resources/db/migration/V2__pending_interest_pair.sql](../../backend/src/main/resources/db/migration/V2__pending_interest_pair.sql) |
| 수정 | [backend/src/test/java/com/tunit/foundation/DatabaseFoundationTest.java](../../backend/src/test/java/com/tunit/foundation/DatabaseFoundationTest.java) |
| 생성 | [backend/src/test/java/com/tunit/foundation/P0ValueContractTest.java](../../backend/src/test/java/com/tunit/foundation/P0ValueContractTest.java) |
| 생성 | [backend/src/test/java/com/tunit/foundation/P0WorkflowTest.java](../../backend/src/test/java/com/tunit/foundation/P0WorkflowTest.java) |
| 생성 | [backend/src/test/java/com/tunit/foundation/RequestLoggingTest.java](../../backend/src/test/java/com/tunit/foundation/RequestLoggingTest.java) |
| 생성 | [contracts/README.md](../../contracts/README.md) |
| 수정 | [contracts/backend-foundation.openapi.json](../../contracts/backend-foundation.openapi.json) |
| 생성 | [contracts/generate-types.mjs](../../contracts/generate-types.mjs) |
| 수정 | [contracts/openapi.yaml](../../contracts/openapi.yaml) |
| 수정 | [deploy/README.md](../../deploy/README.md) |
| 수정 | [deploy/nginx/tunit.conf.example](../../deploy/nginx/tunit.conf.example) |
| 수정 | [docs/README.md](../../docs/README.md) |
| 수정 | [docs/api-spec.md](../../docs/api-spec.md) |
| 수정 | [docs/architecture.md](../../docs/architecture.md) |
| 수정 | [docs/backend-api-gap-review.md](../../docs/backend-api-gap-review.md) |
| 수정 | [docs/backend-design-review.md](../../docs/backend-design-review.md) |
| 수정 | [docs/development.md](../../docs/development.md) |
| 수정 | [docs/erd.md](../../docs/erd.md) |
| 생성 | [docs/notion-p0-implementation-review.md](../../docs/notion-p0-implementation-review.md) |
| 수정 | [docs/requirements.md](../../docs/requirements.md) |
| 수정 | [docs/screens.md](../../docs/screens.md) |
| 수정 | [docs/state-transitions.md](../../docs/state-transitions.md) |
| 수정 | [docs/test-results.md](../../docs/test-results.md) |
| 생성 | [docs/work-log/2026-11-27-notion-p0-implementation.md](../../docs/work-log/2026-11-27-notion-p0-implementation.md) |
| 수정 | [docs/work-log/README.md](../../docs/work-log/README.md) |
| 수정 | [frontend/.env.example](../../frontend/.env.example) |
| 수정 | [frontend/design/README.md](../../frontend/design/README.md) |
| 수정 | [frontend/design/export.test.tsx](../../frontend/design/export.test.tsx) |
| 수정 | [frontend/design/screens.json](../../frontend/design/screens.json) |
| 수정 | [frontend/design/showcase.html](../../frontend/design/showcase.html) |
| 수정 | [frontend/src/api/client.ts](../../frontend/src/api/client.ts) |
| 생성 | [frontend/src/api/generated.ts](../../frontend/src/api/generated.ts) |
| 생성 | [frontend/src/api/http.test.ts](../../frontend/src/api/http.test.ts) |
| 수정 | [frontend/src/api/http.ts](../../frontend/src/api/http.ts) |
| 수정 | [frontend/src/api/mock.ts](../../frontend/src/api/mock.ts) |
| 수정 | [frontend/src/api/types.ts](../../frontend/src/api/types.ts) |
| 수정 | [frontend/src/app/Session.tsx](../../frontend/src/app/Session.tsx) |
| 수정 | [frontend/src/components/Feedback.tsx](../../frontend/src/components/Feedback.tsx) |
| 수정 | [frontend/src/components/SongRow.tsx](../../frontend/src/components/SongRow.tsx) |
| 수정 | [frontend/src/features/auth/Auth.tsx](../../frontend/src/features/auth/Auth.tsx) |
| 생성 | [frontend/src/features/auth/AuthHttp.test.tsx](../../frontend/src/features/auth/AuthHttp.test.tsx) |
| 수정 | [frontend/src/features/discovery/Music.tsx](../../frontend/src/features/discovery/Music.tsx) |
| 생성 | [frontend/src/features/interests/Connections.test.tsx](../../frontend/src/features/interests/Connections.test.tsx) |
| 생성 | [frontend/src/features/interests/InterestCompose.test.tsx](../../frontend/src/features/interests/InterestCompose.test.tsx) |
| 수정 | [frontend/src/features/interests/Interests.tsx](../../frontend/src/features/interests/Interests.tsx) |
| 수정 | [frontend/src/features/invitations/Invitations.tsx](../../frontend/src/features/invitations/Invitations.tsx) |
| 수정 | [frontend/src/features/matching/Discover.tsx](../../frontend/src/features/matching/Discover.tsx) |
| 수정 | [frontend/src/features/matching/Person.tsx](../../frontend/src/features/matching/Person.tsx) |
| 수정 | [frontend/src/features/social/Social.tsx](../../frontend/src/features/social/Social.tsx) |
| 수정 | [frontend/src/features/taste/Onboarding.tsx](../../frontend/src/features/taste/Onboarding.tsx) |
| 수정 | [frontend/src/features/taste/Taste.tsx](../../frontend/src/features/taste/Taste.tsx) |
| 수정 | [frontend/src/types/index.ts](../../frontend/src/types/index.ts) |

## 한국어 커밋 메시지

```text
feat: 노션 설계 기반 P0 API와 프론트 연동 및 동시성 검증 구현
```

최종 정적 검사: 변경58개·신규48개(총106개), 상대 링크277개/누락0, 민감 환경/인증 파일 변경0, 생성 타입 일치·git diff --check PASS. React 변경은 기존 CSS/의존성·이벤트 기반 저장·요청 중 잠금·필드 초점·Escape·effect 정리 기준으로 검토했다. 임시 PostgreSQL 디렉터리 잔여0개도 확인했다.

실제 커밋·푸시·dev/main 병합은 수행하지 않았다.
