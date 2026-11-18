# Notion 기반 백엔드 기반 구축

## 요청과 진행

Notion 요청·응답/에러 규칙/데이터 필드 정의 3개를 모두 읽고 기존 저장소와 비교했다. [설계 비교](../backend-design-review.md)를 먼저 작성한 후 기반 코드를 구현했다. 사용자가 선택한 임시 PostgreSQL에서 적용·검증했다. Notion 쓰기와 Git 커밋·푸시·브랜치 변경은 하지 않았다.

## 구현한 것

- Java 21·Spring Boot 4.1.2·Gradle Wrapper 9.5.1, 공식 배포 SHA-256 고정.
- Notion 15절 V1 전체 SQL: 업무 테이블 14개, PK/FK/CHECK/UNIQUE/인덱스. Hibernate ddl-auto=validate, Flyway clean 비활성.
- Entity·Repository 각 14개, 복합 ID 6종과 @MapsId, 프로필 공유 PK, @Version, TIMESTAMPTZ/Instant.
- 연결 UUID의 unsigned 정규화와 GENRE 조인 생성 시 타입 검사. DB에서 미확정 제약을 임의 추가하지 않음.
- 공통 PageResponse·ApiErrorResponse/FieldErrorDetail·ErrorCode·Advice와 Security JSON 오류 처리.
- GET /auth/csrf, POST /auth/login, GET /auth/me, POST /auth/logout. 실제 DB BCrypt 확인·세션 저장·세션 ID 변경·CSRF 교체·204 로그아웃.
- 해시를 세션 Principal에서 제거하고 자격 증명 DTO toString을 마스킹. 오류 경로에서 쿼리·초대 원문 토큰 제거.
- 세션 쿠키 HttpOnly·SameSite=Lax·기본 Secure·cookie-only. 기존 local/prod 예외 유지.
- 실제 구현 범위만 별도 OpenAPI로 문서화. 기존 프론트 계약 파일과 프론트 코드는 보존.

## 실행한 검증

실행: `backend/scripts/test-postgres.sh` (마지막 실행은 생성한 ./gradlew 사용).

| 항목 | 결과 |
| --- | --- |
| 공통 계약 | 3 PASS |
| PostgreSQL/Flyway/JPA | 9 PASS |
| 세션/CSRF/오류 | 10 PASS |
| 합계 | **22 PASS / FAIL 0 / SKIP 0** |
| Flyway 실제 조회 | version 1 성공 1건, 업무 테이블 14개 |
| 재적용 | migrationsExecuted=0, validate 성공 |
| bootJar | PASS, 실행 클래스 포함·테스트 Controller 제외 |
| Wrapper | Java 21에서 실제 실행·배포 SHA-256 검증 |

첫 통합 실행은 20개 중 세션 ID 회전 검사 1개가 실패했다. MockMvc.session()만으로는 유효한 기존 세션 쿠키가 재현되지 않는 점을 확인하고 요청의 기존 세션 ID·유효성·쿠키 출처를 설정했다. 보안 설정을 완화하지 않았으며, ID 변경·옛 CSRF 거절·로그아웃 무효화까지 최종 검사에서 통과했다. 인증 DB 의존 장애의 503 분기와 405/415 구분도 검증했다.

증거(빌드 산출물, Git 제외): backend/build/reports/tests/test/index.html, backend/build/test-results/test/, backend/build/reports/postgres-verification.txt, backend/build/libs/tunit-backend-0.1.0-SNAPSHOT.jar.

기존 backend/build.gradle 및 application.yml의 원래 내용은 Git HEAD에서 /private/tmp/tunit-backend-original-config/에 보관했다. DB 비밀번호는 임시 생성해 출력하지 않았고 임시 클러스터는 검사 후 종료·삭제했다. 상시 웹/프론트 서버는 시작하지 않았다.

## 충돌·보류·미구현

- 프론트 로컬 문자열 ID·단순 배열·부분 저장·공개 단일 값·초대 accept/상태·관심 note는 최신 Notion의 UUID·페이지·전체 교체·공개/비교 동의 분리·complete 상태와 다르다. 이번에 프론트를 수정하거나 자동 연동하지 않았다.
- Notion 초대 JSON의 Markdown 링크 손상과 앞 예시/필드표 차이를 기록했다. 12절 필드표를 공통 계약 근거로 사용한다.
- 취향 COMPLETE 수·가입/비밀번호 정책·검색 범위·추천 가중치·초대 기간/재사용·역방향 PENDING·재신청·탈퇴 보존은 확정하지 않았다.
- PENDING 부분 UNIQUE 인덱스는 원문의 명시적 보류를 따른다. GENRE 일반 FK는 MOOD를 막지 못하며 실제 SQL에서 그 한계를 확인했다.
- connections FK만으로 ACCEPTED와 참여자 쌍 일치를 강제하지 못한다. 전체 수락/취소 업무 트랜잭션은 미구현이다.
- 회원가입·카탈로그·취향 CRUD·Music Twin·초대·관심·연결 업무 API, AI, 실제 프론트 연동, 영구 개발/운영 DB 적용, JCloud, CI는 미구현이다.
- 검사는 MockMvc+실제 PostgreSQL이며 외부 HTTP·실제 브라우저 쿠키·배포 성공을 의미하지 않는다.

## 다음 순서

1. 가입 비밀번호/자동 로그인·카탈로그 관리·취향 완료/전체 교체 정책을 확인한다.
2. 회원가입과 카탈로그 조회를 구현하고 인증·입력 계약 검사를 추가한다.
3. 취향 CRUD/공개·비교 동의 분리와 트랜잭션 검사를 구현한다.
4. 승인된 계약으로 프론트 HTTP 어댑터를 연결한다. 디자인은 별도 요청 전 유지한다.
5. 추천·초대·관심을 각각 정책 확인 후 구현하고, 중복·경합·수락 롤백·비공개 정보 보호를 검사한다.

## 실제 생성·수정한 파일

기존 미커밋 프론트 변경은 이 작업의 파일 목록에 포함하지 않는다. 다음은 이번 백엔드 작업의 전체 소스·문서 목록이다.

- [backend/README.md](../../backend/README.md)
- [backend/build.gradle](../../backend/build.gradle)
- [backend/gradle/wrapper/gradle-wrapper.jar](../../backend/gradle/wrapper/gradle-wrapper.jar)
- [backend/gradle/wrapper/gradle-wrapper.properties](../../backend/gradle/wrapper/gradle-wrapper.properties)
- [backend/gradlew](../../backend/gradlew)
- [backend/gradlew.bat](../../backend/gradlew.bat)
- [backend/scripts/test-postgres.sh](../../backend/scripts/test-postgres.sh)
- [backend/src/main/java/com/tunit/TunitApplication.java](../../backend/src/main/java/com/tunit/TunitApplication.java)
- [backend/src/main/java/com/tunit/auth/AuthController.java](../../backend/src/main/java/com/tunit/auth/AuthController.java)
- [backend/src/main/java/com/tunit/auth/AuthUserResponse.java](../../backend/src/main/java/com/tunit/auth/AuthUserResponse.java)
- [backend/src/main/java/com/tunit/auth/CsrfResponse.java](../../backend/src/main/java/com/tunit/auth/CsrfResponse.java)
- [backend/src/main/java/com/tunit/auth/DatabaseUserDetailsService.java](../../backend/src/main/java/com/tunit/auth/DatabaseUserDetailsService.java)
- [backend/src/main/java/com/tunit/auth/LoginRequest.java](../../backend/src/main/java/com/tunit/auth/LoginRequest.java)
- [backend/src/main/java/com/tunit/auth/TunitPrincipal.java](../../backend/src/main/java/com/tunit/auth/TunitPrincipal.java)
- [backend/src/main/java/com/tunit/common/api/PageResponse.java](../../backend/src/main/java/com/tunit/common/api/PageResponse.java)
- [backend/src/main/java/com/tunit/common/error/ApiErrorResponse.java](../../backend/src/main/java/com/tunit/common/error/ApiErrorResponse.java)
- [backend/src/main/java/com/tunit/common/error/ApiErrorWriter.java](../../backend/src/main/java/com/tunit/common/error/ApiErrorWriter.java)
- [backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java](../../backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java)
- [backend/src/main/java/com/tunit/common/error/BusinessException.java](../../backend/src/main/java/com/tunit/common/error/BusinessException.java)
- [backend/src/main/java/com/tunit/common/error/ErrorCode.java](../../backend/src/main/java/com/tunit/common/error/ErrorCode.java)
- [backend/src/main/java/com/tunit/common/error/FieldErrorDetail.java](../../backend/src/main/java/com/tunit/common/error/FieldErrorDetail.java)
- [backend/src/main/java/com/tunit/common/persistence/UuidEntity.java](../../backend/src/main/java/com/tunit/common/persistence/UuidEntity.java)
- [backend/src/main/java/com/tunit/common/persistence/UuidOrder.java](../../backend/src/main/java/com/tunit/common/persistence/UuidOrder.java)
- [backend/src/main/java/com/tunit/config/SecurityConfig.java](../../backend/src/main/java/com/tunit/config/SecurityConfig.java)
- [backend/src/main/java/com/tunit/connection/Connection.java](../../backend/src/main/java/com/tunit/connection/Connection.java)
- [backend/src/main/java/com/tunit/connection/ConnectionRepository.java](../../backend/src/main/java/com/tunit/connection/ConnectionRepository.java)
- [backend/src/main/java/com/tunit/interest/InterestRequest.java](../../backend/src/main/java/com/tunit/interest/InterestRequest.java)
- [backend/src/main/java/com/tunit/interest/InterestRequestRepository.java](../../backend/src/main/java/com/tunit/interest/InterestRequestRepository.java)
- [backend/src/main/java/com/tunit/interest/InterestStatus.java](../../backend/src/main/java/com/tunit/interest/InterestStatus.java)
- [backend/src/main/java/com/tunit/invitation/Invitation.java](../../backend/src/main/java/com/tunit/invitation/Invitation.java)
- [backend/src/main/java/com/tunit/invitation/InvitationRepository.java](../../backend/src/main/java/com/tunit/invitation/InvitationRepository.java)
- [backend/src/main/java/com/tunit/invitation/InvitationStatus.java](../../backend/src/main/java/com/tunit/invitation/InvitationStatus.java)
- [backend/src/main/java/com/tunit/music/Artist.java](../../backend/src/main/java/com/tunit/music/Artist.java)
- [backend/src/main/java/com/tunit/music/ArtistGenre.java](../../backend/src/main/java/com/tunit/music/ArtistGenre.java)
- [backend/src/main/java/com/tunit/music/ArtistGenreId.java](../../backend/src/main/java/com/tunit/music/ArtistGenreId.java)
- [backend/src/main/java/com/tunit/music/ArtistGenreRepository.java](../../backend/src/main/java/com/tunit/music/ArtistGenreRepository.java)
- [backend/src/main/java/com/tunit/music/ArtistRepository.java](../../backend/src/main/java/com/tunit/music/ArtistRepository.java)
- [backend/src/main/java/com/tunit/music/ArtistRole.java](../../backend/src/main/java/com/tunit/music/ArtistRole.java)
- [backend/src/main/java/com/tunit/music/Track.java](../../backend/src/main/java/com/tunit/music/Track.java)
- [backend/src/main/java/com/tunit/music/TrackArtist.java](../../backend/src/main/java/com/tunit/music/TrackArtist.java)
- [backend/src/main/java/com/tunit/music/TrackArtistId.java](../../backend/src/main/java/com/tunit/music/TrackArtistId.java)
- [backend/src/main/java/com/tunit/music/TrackArtistRepository.java](../../backend/src/main/java/com/tunit/music/TrackArtistRepository.java)
- [backend/src/main/java/com/tunit/music/TrackGenre.java](../../backend/src/main/java/com/tunit/music/TrackGenre.java)
- [backend/src/main/java/com/tunit/music/TrackGenreId.java](../../backend/src/main/java/com/tunit/music/TrackGenreId.java)
- [backend/src/main/java/com/tunit/music/TrackGenreRepository.java](../../backend/src/main/java/com/tunit/music/TrackGenreRepository.java)
- [backend/src/main/java/com/tunit/music/TrackRepository.java](../../backend/src/main/java/com/tunit/music/TrackRepository.java)
- [backend/src/main/java/com/tunit/taste/TagType.java](../../backend/src/main/java/com/tunit/taste/TagType.java)
- [backend/src/main/java/com/tunit/taste/TasteProfile.java](../../backend/src/main/java/com/tunit/taste/TasteProfile.java)
- [backend/src/main/java/com/tunit/taste/TasteProfileRepository.java](../../backend/src/main/java/com/tunit/taste/TasteProfileRepository.java)
- [backend/src/main/java/com/tunit/taste/TasteStatus.java](../../backend/src/main/java/com/tunit/taste/TasteStatus.java)
- [backend/src/main/java/com/tunit/taste/TasteTag.java](../../backend/src/main/java/com/tunit/taste/TasteTag.java)
- [backend/src/main/java/com/tunit/taste/TasteTagRepository.java](../../backend/src/main/java/com/tunit/taste/TasteTagRepository.java)
- [backend/src/main/java/com/tunit/taste/UserArtist.java](../../backend/src/main/java/com/tunit/taste/UserArtist.java)
- [backend/src/main/java/com/tunit/taste/UserArtistId.java](../../backend/src/main/java/com/tunit/taste/UserArtistId.java)
- [backend/src/main/java/com/tunit/taste/UserArtistRepository.java](../../backend/src/main/java/com/tunit/taste/UserArtistRepository.java)
- [backend/src/main/java/com/tunit/taste/UserTasteTag.java](../../backend/src/main/java/com/tunit/taste/UserTasteTag.java)
- [backend/src/main/java/com/tunit/taste/UserTasteTagId.java](../../backend/src/main/java/com/tunit/taste/UserTasteTagId.java)
- [backend/src/main/java/com/tunit/taste/UserTasteTagRepository.java](../../backend/src/main/java/com/tunit/taste/UserTasteTagRepository.java)
- [backend/src/main/java/com/tunit/taste/UserTrack.java](../../backend/src/main/java/com/tunit/taste/UserTrack.java)
- [backend/src/main/java/com/tunit/taste/UserTrackId.java](../../backend/src/main/java/com/tunit/taste/UserTrackId.java)
- [backend/src/main/java/com/tunit/taste/UserTrackRepository.java](../../backend/src/main/java/com/tunit/taste/UserTrackRepository.java)
- [backend/src/main/java/com/tunit/user/TunitUser.java](../../backend/src/main/java/com/tunit/user/TunitUser.java)
- [backend/src/main/java/com/tunit/user/TunitUserRepository.java](../../backend/src/main/java/com/tunit/user/TunitUserRepository.java)
- [backend/src/main/resources/application.yml](../../backend/src/main/resources/application.yml)
- [backend/src/main/resources/db/migration/V1__initial_schema.sql](../../backend/src/main/resources/db/migration/V1__initial_schema.sql)
- [backend/src/test/java/com/tunit/foundation/CommonContractTest.java](../../backend/src/test/java/com/tunit/foundation/CommonContractTest.java)
- [backend/src/test/java/com/tunit/foundation/DatabaseFoundationTest.java](../../backend/src/test/java/com/tunit/foundation/DatabaseFoundationTest.java)
- [backend/src/test/java/com/tunit/foundation/FoundationIntegrationTest.java](../../backend/src/test/java/com/tunit/foundation/FoundationIntegrationTest.java)
- [backend/src/test/java/com/tunit/foundation/SecurityFoundationTest.java](../../backend/src/test/java/com/tunit/foundation/SecurityFoundationTest.java)
- [backend/src/test/resources/application-test.yml](../../backend/src/test/resources/application-test.yml)
- [README.md](../../README.md)
- [contracts/backend-foundation.openapi.json](../../contracts/backend-foundation.openapi.json)
- [docs/README.md](../../docs/README.md)
- [docs/architecture.md](../../docs/architecture.md)
- [docs/api-spec.md](../../docs/api-spec.md)
- [docs/erd.md](../../docs/erd.md)
- [docs/test-results.md](../../docs/test-results.md)
- [docs/backend-design-review.md](../../docs/backend-design-review.md)
- [docs/work-log/README.md](../../docs/work-log/README.md)
- [docs/work-log/2026-11-19-backend-foundation.md](../../docs/work-log/2026-11-19-backend-foundation.md)

## 한국어 커밋 메시지

```text
feat: Notion 설계 기반 14개 테이블과 Spring 세션 인증 기반 구축
```
