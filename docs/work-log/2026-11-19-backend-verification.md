# 백엔드 기반 재검증

작업일: 2026-11-19(KST)

## 요청과 범위

구현된 백엔드 기반이 제대로 동작하는지 코드·명세·실제 테스트 결과로 재검증한다. [기반 구축 기록](2026-11-19-backend-foundation.md)의 결과를 그대로 신뢰하지 않고 기존 검사를 다시 실행하고 실패 경로를 추가했다.

현재 `frontend` 브랜치의 미커밋 작업을 보존했다. 프론트·Notion·V1 SQL·제품의 미확정 정책을 수정하지 않았다. 커밋·푸시·브랜치 변경은 수행하지 않았다. 개발·프리뷰·Spring HTTP 서버를 시작하지 않았고, 사용자가 승인한 테스트 전용 임시 PostgreSQL만 실행 후 종료·삭제했다.

## 발견한 문제와 수정

| 문제 | 수정 전 확인 | 수정 및 검증 |
| --- | --- | --- |
| 실패한 로그인 응답 뒤 신규 인증 세션 잔존 | 올바른 자격 증명으로 인증한 뒤 취향 프로필 조회에 DB 예외를 주입하면 503을 반환하지만 `SPRING_SECURITY_CONTEXT`가 세션에 남음 | 로그인 응답에 필요한 DB 조회를 세션 저장 전에 완료하도록 변경. 동일 예외에서 503·인증 컨텍스트 없음·후속 `/auth/me` 401 확인 |
| JSON 숫자 비밀번호의 문자열 자동 변환 | 문자열 비밀번호와 같은 숫자를 JSON number로 보내도 200 로그인 성공 | JSON 문자열 대상의 정수·실수·불리언 자동 변환 차단. 각각 400 `INVALID_INPUT` 확인, 숫자 비밀번호 요청 뒤 신규 인증 컨텍스트 없음 확인 |
| 전용 테스트 DB 재사용 시 UUID fixture 충돌 가능 | 정렬 테스트가 항상 같은 두 UUID를 INSERT하고 커밋하므로 같은 DB의 재실행에서 PK 충돌 가능 | signed/unsigned 정렬 차이가 발생하는 상위 비트는 유지하고 하위 비트를 임의 생성. 같은 임시 DB에서 전체 27개 검사를 두 번 실행해 모두 통과 |

DB 장애 테스트는 `TasteProfileRepository.findById`에 `DataAccessResourceFailureException`을 주입한다. 실제 PostgreSQL 프로세스를 중단한 장애 복구 시험은 아니다. JSON 타입 제한은 기존 OpenAPI의 문자열 계약을 강제하며 비밀번호 길이 등 새로운 제품 정책을 정하지 않는다.

추가로 다른 세션의 CSRF 토큰 재사용 거절과 OpenAPI의 필수 필드·프로퍼티 이름을 실제 DTO record와 대조하는 검사를 추가했다.

## 실제 실행 결과

환경: Java 21, Gradle Wrapper 9.5.1, Spring Boot 4.1.2, PostgreSQL 16.15, MockMvc. 매 검사에서 Gradle `--rerun-tasks`를 사용했다.

| 단계/검사 | 결과 | 근거 |
| --- | --- | --- |
| 기존 검사 재실행 | 22 PASS | 기존 테스트가 놓친 실패 경로가 있음을 별도로 확인 |
| 수정 전 회귀 검사 추가 | **24개 중 2 FAIL** | `failedLoginResponseMustNotLeaveANewAuthenticatedSession`, `numericPasswordsAreRejectedAsInvalidJsonTypes` 실패 |
| 수정 후 검사 | 27/27 PASS | 공통 계약 4, DB 9, 보안·오류 14; 실패·오류·생략 0 |
| 동일 임시 DB 재실행 | **27/27 PASS를 2회** | 양쪽 로그 모두 27개 테스트 PASS 및 `BUILD SUCCESSFUL`; 서로 다른 테스트 54개라는 뜻은 아님 |
| Flyway V1 | PASS | 성공 이력 1건, 업무 테이블 14개, 재적용 no-op, Hibernate validate |
| Entity/Repository | PASS | 14개 Entity 및 14개 Repository의 실제 PostgreSQL 왕복, FK/PK/CHECK/UQ·롤백·낙관적 잠금 |
| Notion SQL 비교 | PASS | 앞서 읽은 필드 정의 문서 15절 SQL과 V1 파일이 앞뒤 공백·줄 끝 공백 정규화 후 일치 |
| bootJar | PASS | 실제 실행 JAR 생성, 메인 클래스·JSON 설정 포함, 테스트용 Controller 미포함 |
| 프론트 보존 | PASS | 검증 시작 시점 SHA-256과 프론트 파일 76개 모두 일치 |
| 정적 검사 | PASS | `bash -n backend/scripts/test-postgres.sh`, `git diff --check` |
| 임시 DB 정리 | PASS | 테스트 스크립트가 종료 코드 0으로 종료, 자신이 만든 클러스터 종료·삭제, 임시 클러스터 디렉터리 잔존 0 |

기본 재실행 명령은 저장소 루트의 다음 명령이다. 도구·전용 DB 주입 방법은 [백엔드 안내](../../backend/README.md)를 따른다.

```sh
backend/scripts/test-postgres.sh
```

동일 DB 재실행 검증에서는 임시 `TUNIT_GRADLE_BIN` 래퍼로 `./gradlew "$@"`를 두 번 호출했다. 기존 테스트 스크립트가 만든 한 클러스터를 공유했고 각 Gradle 호출에서 `test bootJar --rerun-tasks`를 실행했다. 이 래퍼는 저장소에 추가하거나 상시 작업으로 설정하지 않았다.

로컬 증거:

- `backend/build/reports/tests/test/index.html`: 최종 27개 결과.
- `backend/build/test-results/test/TEST-*.xml`: 최종 JUnit 집계.
- `backend/build/reports/postgres-verification.txt`: Flyway V1·업무 테이블 수 조회.
- `backend/build/libs/tunit-backend-0.1.0-SNAPSHOT.jar`: 최종 패키지.
- `/private/tmp/tunit-backend-negative-checks.log`: 수정 전 24개 중 2개 실패.
- `/private/tmp/tunit-backend-repeat-verification.log`: 동일 DB에서 실행한 두 번의 전체 PASS 로그.

빌드 산출물과 임시 경로의 증거는 Git에 추가하지 않는다. 재실행 시 리포트가 갱신되며 임시 파일은 영구 보관되지 않는다.

## 이번 작업에서 생성·수정한 파일

| 파일 | 변경 |
| --- | --- |
| [AuthController.java](../../backend/src/main/java/com/tunit/auth/AuthController.java) | 실패 가능한 DB 조회 후 인증 세션 저장 |
| [JsonConfig.java](../../backend/src/main/java/com/tunit/config/JsonConfig.java) | 신규 설정: 숫자·불리언 → JSON 문자열 자동 변환 차단 |
| [SecurityFoundationTest.java](../../backend/src/test/java/com/tunit/foundation/SecurityFoundationTest.java) | 실패 로그인 세션·숫자/불리언/실수 타입·타 세션 CSRF 회귀 검사 |
| [CommonContractTest.java](../../backend/src/test/java/com/tunit/foundation/CommonContractTest.java) | OpenAPI와 DTO 필수 필드·프로퍼티 대조 |
| [DatabaseFoundationTest.java](../../backend/src/test/java/com/tunit/foundation/DatabaseFoundationTest.java) | 정렬 테스트 UUID의 재실행 충돌 방지 |
| [backend/README.md](../../backend/README.md) | 입력/로그인 동작과 27개 검사 결과 반영 |
| [docs/README.md](../README.md) | 현재 백엔드 검사 수 갱신 |
| [docs/test-results.md](../test-results.md) | 최신 근거와 업무 API 미검증 경계 구분 |
| [작업 기록 목록](README.md) | 이번 기록 링크 추가 |
| 이 파일 | 요청·수정·검증·남은 범위 기록 |

기존 기반 작업에서 만들어진 다른 백엔드·문서 파일의 전체 목록은 [이전 기록](2026-11-19-backend-foundation.md)에 있다.

## 미검증·미구현 범위와 다음 순서

- MockMvc는 실제 Spring 필터·Controller와 PostgreSQL을 쓰지만 외부 HTTP·브라우저 쿠키·CORS·배포 환경을 검증하지 않는다. 프론트의 테스트/빌드는 이번 백엔드 검증에서 재실행하지 않았다.
- 추천·Music Twin·초대·관심 요청의 전체 업무 API와 실제 프론트 연결은 여전히 미구현이다. 현재 테스트의 관심/연결 행은 매핑 확인용 fixture다.
- 역방향 PENDING 중복 정책, GENRE 유형의 DB 강제, ACCEPTED 요청과 연결 당사자 정합성 등 [설계 비교 문서](../backend-design-review.md)의 보류 사항을 임의로 확정하지 않았다.
- 다음에는 회원가입·취향 완료 기준 등 미확정 정책을 확인하고 기본 사용자/취향 API부터 구현한 뒤, 실제 HTTP·프론트 연결과 업무 트랜잭션 동시성 검사를 진행한다.

구현 방식의 기술 근거: [Spring Boot JSON 설정](https://docs.spring.io/spring-boot/reference/features/json.html), [Jackson 문자열 coercion 설정](https://github.com/FasterXML/jackson-databind/issues/3013). 현재 사용 중인 라이브러리의 customizer·coercion API도 로컬 JAR에서 확인했다.

## 한국어 커밋 메시지

```text
fix: 로그인 실패 시 세션 잔존과 JSON 타입 자동 변환 방지
```

실제 커밋·푸시는 수행하지 않았다.
