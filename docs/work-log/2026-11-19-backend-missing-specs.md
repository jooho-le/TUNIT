# 누락 명세 대조와 회원가입·취향 API 추가

작업일: 2026-11-19(KST)

## 요청과 범위

누락했던 Notion의 데이터 목록·기능별 요청/응답·엔드포인트 목록을 읽고 기존 코드와 대조한 뒤 필요한 추가 개발을 진행한다. 세 문서를 모두 확인하고, 후속 DTO/필드 정의와 충돌하는 부분을 [추가 API 검토](../backend-api-gap-review.md)에 먼저 기록했다.

현재 `backend` 브랜치의 기존 프론트 변경을 보존했다. Notion은 읽기만 했으며 상태·문서를 수정하지 않았다. 개발·프리뷰·Spring HTTP 서버를 실행하지 않았다. 사용자가 승인한 임시 PostgreSQL에서 테스트 후 종료·삭제했다. 새 브랜치·서브에이전트·상시 작업·자동 동기화를 만들지 않았고 커밋·푸시는 하지 않았다.

## 원문과 대조 결과

- [데이터 목록 만들기](https://app.notion.com/p/428d062130a9834e8ac7814b95f7cdbe): 기존 14개 테이블·Entity·Repository와 일치한다. 추가 테이블·Flyway V2가 필요하지 않다.
- [기능 요청/응답 쪼개기](https://app.notion.com/p/08bd062130a983e88a2701f841818397): 본인 소유권·전체 교체·오류/빈 목록·단일 트랜잭션 요구를 추가 구현에 연결했다.
- [엔드포인트 목록 설계](https://app.notion.com/p/368d062130a98360983881a6a9f6594f): GET/PATCH `/me/profile/settings` 등 누락 경로를 확인하고 실제 구현/보류를 구분했다.
- [후속 DTO 문서](https://app.notion.com/p/c13d062130a983d69dd501963e87f5a1): 태그는 직접 배열, SignupResponse는 createdAt 포함, 취향 PUT은 필수 3배열·빈 배열 허용을 적용했다.

기존 프론트는 문자열 ID·이전 응답·단계별 mock 저장을 사용하므로 자동 연결하지 않았다. 추천/초대/관심의 전체 업무 구현 제외와 미확정 정책 보존 조건을 유지했다.

## 사용자가 확정한 정책

두 질문에 사용자가 각각 ‘제안한 기준으로 진행’, ‘현재 프론트 기준으로 진행’이라고 답한 후 종속 구현을 진행했다.

- 가입 비밀번호: Unicode 코드 포인트 8자 이상, UTF-8 72바이트 이하. 비밀번호 공백을 임의로 제거하지 않는다.
- 닉네임: 앞뒤 공백 제거 후 Unicode 코드 포인트 1~50자.
- 가입 후 별도 로그인. 가입 응답으로 새 인증 컨텍스트를 저장하지 않는다.
- 아티스트 최대 5명·곡 최대 10곡·장르 최대 3개·무드 최대 3개.
- COMPLETE는 아티스트 5명·곡 10곡·장르/무드 각각 1~3개. 유효한 부분 선택·빈 선택은 INCOMPLETE로 저장한다.

## 구현한 기능

| Method | /api/v1 경로 | 동작 |
| --- | --- | --- |
| POST | /auth/signup | 이메일 정규화·Bean Validation·BCrypt·201·중복 409, 별도 로그인 |
| GET | /catalog/tags | 인증된 활성 사용자, GENRE/MOOD 활성 태그만 직접 배열 반환 |
| GET | /me/taste | 세션 본인 선택 ID·상태·시각, DB 저장 부작용 없음 |
| PUT | /me/taste | 전체 교체·중복/존재/활성/상한 검증·완료 재판정·단일 트랜잭션 |
| DELETE | /me/taste | 선택·요약 제거·INCOMPLETE·204, 타인·공용 데이터·동의 설정 보존 |
| GET | /me/profile/settings | 본인 공개·비교 동의, 프로필 없으면 false/false |
| PATCH | /me/profile/settings | 제공한 불리언만 변경, 빈 객체·null·다른 필드·숫자/문자열 변환 거절 |

- 기존 인증 4개와 합쳐 **8개 경로, 11개 HTTP 작업**이다.
- 쓰기 API는 사용자 행의 PESSIMISTIC_WRITE 잠금으로 같은 사용자의 교체/초기화/설정 변경을 직렬화한다. 읽기는 일관된 DB 스냅샷에서 수행한다.
- 전체 교체는 제거할 관계만 삭제하고 기존 선택의 가중치·생성 시각을 보존한다. 신규 항목은 V1 기본 가중치 1을 사용한다.
- 프로필 없는 조회는 INCOMPLETE·사용자 updatedAt을 반환하며 행을 만들지 않는다. 새 공유 PK 프로필은 명시적으로 persist한다.
- 취향 쓰기 뒤 이전 요약을 제거한다. 추천 캐시·분석 서비스는 없으므로 캐시/AI 재생성을 구현했다고 표시하지 않는다.
- DB 이메일 유일 제약은 탈퇴 행에도 적용된다. 동시 중복은 실패 트랜잭션 밖에서 알려진 이메일 UNIQUE 제약만 409로 변환한다. 다른 무결성 오류를 일괄 중복으로 처리하지 않는다.
- 새 보호 경로는 세션 사용자가 현재도 활성 계정인지 확인한다. 회원가입도 CSRF 보호를 유지한다.
- OpenAPI에는 실제 구현만 반영했다. Controller 전체 경로와 Security 로그아웃을 OpenAPI와 대조하는 테스트를 추가했다.

## 실제 검증

실행 명령은 `backend/scripts/test-postgres.sh`다. Java 21·Gradle Wrapper 9.5.1·Spring Boot 4.1.2·PostgreSQL 16.15·MockMvc를 사용했다. `--rerun-tasks`로 실행했다.

| 검사 | 최종 결과 | 확인 범위 |
| --- | --- | --- |
| CommonContractTest | 4 PASS | 실제 12개 DTO record와 OpenAPI 필수 필드/프로퍼티 대조·기존 공통 계약 |
| DatabaseFoundationTest | 9 PASS | V1·14개 테이블/Entity/Repository·제약·낙관적 잠금·롤백 |
| SecurityFoundationTest | 14 PASS | 기존 세션·CSRF·로그인 실패 경로·공통 오류 회귀 |
| OwnTasteApiTest | 15 PASS | 신규 API·가입/취향 동시성·입력 경계·소유권·실패 롤백 |
| ApiRouteContractTest | 1 PASS | 실제 HTTP 작업 11개와 OpenAPI 일치 |
| 합계 | **43 PASS / FAIL 0 / ERROR 0 / SKIP 0** | 실제 임시 PostgreSQL, H2 미사용 |
| bootJar | PASS | 실행 JAR 생성, 테스트 전용 Controller/테스트 클래스 미포함 |
| Flyway | PASS | V1 성공 1건·14개 업무 테이블, 재적용 no-op |
| 전체 경로 대조 | PASS | 원문 27개 작업 중 구현 10개·보류 17개, 기술적 CSRF 획득 1개 추가; 분류 누락 0 |
| 보존/정적 확인 | PASS | 프론트 75개 파일의 작업 전 해시 일치·V1/환경/지침 보존·문서 상대 링크·공백 오류 없음 |
| 임시 DB 종료 | PASS | 최종 스크립트 종료 코드 0, 임시 클러스터 디렉터리 잔존 0 |

첫 실행은 42개 중 9개가 실패했다. 새 공유 PK 프로필이 ID만으로 기존 행처럼 merge되는 경로에서 Hibernate AssertionFailure가 발생했다. 새 행을 명시적으로 persist한 후 43개가 모두 통과했고, Unicode 닉네임·비밀번호 경계 및 서비스 계층을 보완한 최종 실행에서도 43개 전체가 통과했다.

동시 회원가입은 두 요청의 사전 중복 확인을 통과시켜 실제 PostgreSQL UNIQUE 제약 경합을 유도했다. 결과는 201/409 및 사용자 1건이다. 동시 취향 교체는 최종 아티스트·곡·태그가 한 요청의 전체 선택 집합으로 일치하며 섞이지 않음을 확인했다.

취향 교체 롤백은 저장 중 실제 FK 오류를 주입해 확인했다. 초기화 롤백은 앞의 두 관계를 삭제한 후 태그 Repository에서 장애 예외를 주입해 확인했다. 실제 PostgreSQL 프로세스를 중단한 장애 복구 시험은 아니다. CSRF 없는 쓰기 거절 전후의 저장 데이터 보존과 탈퇴 계정의 기존 세션 사용 거절도 확인했다.

증거는 `backend/build/reports/tests/test/index.html`, `backend/build/test-results/test/TEST-*.xml`, `backend/build/reports/postgres-verification.txt`, `backend/build/libs/tunit-backend-0.1.0-SNAPSHOT.jar`다. 최초 실패와 최종 실행 로그는 각각 `/private/tmp/tunit-gap-first-test.log`, `/private/tmp/tunit-gap-final-test.log`에 있으며 영구 보관·Git 추가 대상이 아니다.

## 보존·미검증·후속 작업

- 기존 프론트 파일·DESIGN.md·화면 지도·기존 OpenAPI 초안은 유지했다. 프론트 테스트·빌드는 이번 백엔드 작업에서 재실행하지 않았다.
- 기존 설정 변경 전 사본과 작업 전 파일 해시/상태는 `/private/tmp/tunit-gap-implementation-w_oc88oq/`에 보관했다. 임시 DB의 SCRAM 비밀번호만 임의 생성해 환경변수로 주입했고 출력·커밋하지 않았다. 기존 개발/운영 DB 연결 정보는 사용하지 않았다.
- MockMvc 성공은 실제 브라우저 쿠키·CORS·외부 HTTP·JCloud 배포 검증이 아니다. 임시 DB는 검사 후 삭제하므로 상시 개발 DB가 만들어진 상태도 아니다.
- 카탈로그 음악 검색/사용권·페이지 정렬/상한, 개인 프로필 장르 분포·추천, 초대·관심 전체 업무 및 프론트 연결은 후속 작업이다. [17개 보류 작업](../backend-api-gap-review.md#전체-엔드포인트-대조)을 구분해 기록했다.
- 다음 순서는 실제 음악 카탈로그 공급·사용권 및 검색 정책 확정 → 카탈로그 조회 → 개인 프로필 계산 규칙 → 프론트 계약 연결이다. 초대·관심은 별도 미확정 정책을 확정한 후 진행한다.

기술 근거: [Spring Security 비밀번호 저장](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html), [BCrypt UTF-8 경계 테스트](https://github.com/spring-projects/spring-security/blob/main/crypto/src/test/java/org/springframework/security/crypto/bcrypt/BCryptPasswordEncoderTests.java), [Spring Data JPA 잠금](https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html). 구현 버전의 관련 API도 로컬 의존성에서 확인했다.

## 관련 파일

이번 작업에서 실제 생성·수정한 39개 파일이다. 기존 프론트 미커밋 변경은 포함하지 않는다.

| 구분 | 파일 |
| --- | --- |
| 수정 | [README.md](../../README.md) |
| 수정 | [backend/README.md](../../backend/README.md) |
| 신규 | [backend/src/main/java/com/tunit/auth/CurrentUser.java](../../backend/src/main/java/com/tunit/auth/CurrentUser.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupController.java](../../backend/src/main/java/com/tunit/auth/SignupController.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupPassword.java](../../backend/src/main/java/com/tunit/auth/SignupPassword.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupPasswordValidator.java](../../backend/src/main/java/com/tunit/auth/SignupPasswordValidator.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupRequest.java](../../backend/src/main/java/com/tunit/auth/SignupRequest.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupResponse.java](../../backend/src/main/java/com/tunit/auth/SignupResponse.java) |
| 신규 | [backend/src/main/java/com/tunit/auth/SignupService.java](../../backend/src/main/java/com/tunit/auth/SignupService.java) |
| 수정 | [backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java](../../backend/src/main/java/com/tunit/common/error/ApiExceptionHandler.java) |
| 수정 | [backend/src/main/java/com/tunit/config/SecurityConfig.java](../../backend/src/main/java/com/tunit/config/SecurityConfig.java) |
| 신규 | [backend/src/main/java/com/tunit/music/CatalogController.java](../../backend/src/main/java/com/tunit/music/CatalogController.java) |
| 신규 | [backend/src/main/java/com/tunit/music/CatalogService.java](../../backend/src/main/java/com/tunit/music/CatalogService.java) |
| 신규 | [backend/src/main/java/com/tunit/music/TagSummary.java](../../backend/src/main/java/com/tunit/music/TagSummary.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/ProfileSettings.java](../../backend/src/main/java/com/tunit/taste/ProfileSettings.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/ProfileSettingsPatch.java](../../backend/src/main/java/com/tunit/taste/ProfileSettingsPatch.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/TasteController.java](../../backend/src/main/java/com/tunit/taste/TasteController.java) |
| 수정 | [backend/src/main/java/com/tunit/taste/TasteProfile.java](../../backend/src/main/java/com/tunit/taste/TasteProfile.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/TasteReplaceRequest.java](../../backend/src/main/java/com/tunit/taste/TasteReplaceRequest.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/TasteResponse.java](../../backend/src/main/java/com/tunit/taste/TasteResponse.java) |
| 신규 | [backend/src/main/java/com/tunit/taste/TasteService.java](../../backend/src/main/java/com/tunit/taste/TasteService.java) |
| 수정 | [backend/src/main/java/com/tunit/taste/UserArtistRepository.java](../../backend/src/main/java/com/tunit/taste/UserArtistRepository.java) |
| 수정 | [backend/src/main/java/com/tunit/taste/UserTasteTagRepository.java](../../backend/src/main/java/com/tunit/taste/UserTasteTagRepository.java) |
| 수정 | [backend/src/main/java/com/tunit/taste/UserTrackRepository.java](../../backend/src/main/java/com/tunit/taste/UserTrackRepository.java) |
| 수정 | [backend/src/main/java/com/tunit/user/TunitUserRepository.java](../../backend/src/main/java/com/tunit/user/TunitUserRepository.java) |
| 신규 | [backend/src/test/java/com/tunit/foundation/ApiRouteContractTest.java](../../backend/src/test/java/com/tunit/foundation/ApiRouteContractTest.java) |
| 수정 | [backend/src/test/java/com/tunit/foundation/CommonContractTest.java](../../backend/src/test/java/com/tunit/foundation/CommonContractTest.java) |
| 신규 | [backend/src/test/java/com/tunit/foundation/OwnTasteApiTest.java](../../backend/src/test/java/com/tunit/foundation/OwnTasteApiTest.java) |
| 수정 | [contracts/backend-foundation.openapi.json](../../contracts/backend-foundation.openapi.json) |
| 수정 | [docs/README.md](../README.md) |
| 수정 | [docs/api-spec.md](../api-spec.md) |
| 수정 | [docs/architecture.md](../architecture.md) |
| 신규 | [docs/backend-api-gap-review.md](../backend-api-gap-review.md) |
| 수정 | [docs/backend-design-review.md](../backend-design-review.md) |
| 수정 | [docs/erd.md](../erd.md) |
| 수정 | [docs/requirements.md](../requirements.md) |
| 수정 | [docs/test-results.md](../test-results.md) |
| 신규 | [docs/work-log/2026-11-19-backend-missing-specs.md](2026-11-19-backend-missing-specs.md) |
| 수정 | [docs/work-log/README.md](README.md) |

## 한국어 커밋 메시지

사용자의 접두사 제외 요청을 따른다.

```text
누락 설계 반영 및 회원가입·취향 관리 API 구현
```

이번 작업의 커밋·푸시는 수행하지 않았다.
