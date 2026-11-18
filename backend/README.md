# TUNIT 백엔드 기반

[설계 비교](../docs/backend-design-review.md) · [검증 기록](../docs/test-results.md) · [실제 API 계약](../contracts/backend-foundation.openapi.json)

Java 21·Spring Boot 4.1.2·Spring Security 세션·Spring Data JPA·Flyway·PostgreSQL 기반이다. Notion V1의 14개 테이블과 Entity/Repository를 구현했다. 프론트는 기존 mock을 유지하며 추천·초대·관심 업무 서비스는 구현하지 않았다.

## 구현한 API

기본 경로는 /api/v1이다. 성공 DTO를 직접 반환하고 data 래퍼를 쓰지 않는다.

| Method | 경로 | 동작 |
| --- | --- | --- |
| GET | /auth/csrf | 익명도 가능. 세션 기반 {token,headerName}, Cache-Control: no-store |
| POST | /auth/login | JSON email/password·CSRF·DB BCrypt 검증, 세션 ID 변경·인증 저장·CSRF 교체 |
| GET | /auth/me | 본인 {id,nickname,tasteStatus}, 프로필 없으면 INCOMPLETE |
| POST | /auth/logout | 세션·현재 CSRF 필요, 세션 무효화, 204 빈 응답 |

공통 오류는 {code,message,fieldErrors,timestamp,path}다. 필터의 401/403도 JSON이며 리다이렉트하지 않는다. SQL·비밀번호·해시·쿼리·초대 토큰을 오류에 넣지 않는다. 로그인 의존 서비스 장애 503과 자격 증명 불일치 401을 구분한다. 로그인 응답에 필요한 DB 조회가 끝난 후 인증 세션을 저장한다. JSON 문자열 필드에 숫자·불리언을 보내면 자동 변환하지 않고 400 INVALID_INPUT으로 거절한다.

쿠키는 HttpOnly·SameSite=Lax·기본 Secure=true·cookie-only다. 기존 local 프로필의 HTTP 전용 Secure=false와 prod의 Secure=true를 유지한다. 로그인 후 기존 CSRF는 무효이므로 다시 조회한다. CSRF 없는 변경 요청은 인증 검사보다 먼저 403이 될 수 있다. 가입·기본 계정 자동 생성은 구현하지 않았다. 카탈로그 등 미구현 경로를 공개하지 않으며, 이는 향후 공개 정책을 확정한 것이 아니다.

## DB 구현과 보류

- V1은 [Notion 필드 정의](https://app.notion.com/p/bc6d062130a98224984081f41d45a5a4) 15절의 전체 SQL이다.
- 테이블마다 Entity/Repository를 제공한다. 6개 조인은 @EmbeddedId/@MapsId, 프로필은 사용자 공유 PK, 관심 요청은 @Version이다.
- UUID와 시각은 호출자가 제공한다. UUID 발급 버전·취향 완료·실제 선호도 입력 정책을 확정하지 않는다.
- TIMESTAMPTZ는 Instant로 매핑한다. Hibernate는 validate, Flyway는 clean-disabled=true다.
- 역방향 PENDING 중복 인덱스, GENRE 복합 FK, 요청 ACCEPTED·연결 쌍 정합성은 보류했다. GENRE 조인 생성자는 MOOD를 거부하지만 DB 직접 쓰기까지 보장하지 않는다.
- 연결 UUID 순서는 PostgreSQL과 동일한 unsigned 비교를 사용한다.

## 실제 PostgreSQL 검사

필요 도구: JDK 21, PostgreSQL 개발 도구(pg_config/initdb/pg_ctl/createdb/psql), Bash·Python 3·OpenSSL. Docker/H2를 사용하지 않는다. 저장소 루트에서 실행한다.

```sh
backend/scripts/test-postgres.sh
```

이 명령은 SCRAM 비밀번호를 임의 생성해 임시 PostgreSQL 클러스터를 127.0.0.1 임의 포트에 만들고, Flyway·JPA·Security 검사와 bootJar를 실행한다. 기존 DB_URL·개발 DB·5432 서비스를 사용하지 않는다. 성공·실패 후 자신이 만든 DB를 종료·삭제하며 비밀값은 출력하지 않는다. Homebrew JDK 21 선택은 해당 실행에만 적용한다. 도구 경로는 TUNIT_JAVA_HOME/TUNIT_PG_BIN으로 지정할 수 있다.

- **27개 PASS / 실패 0 / 생략 0**: 공통 계약 4, DB 기반 9, 보안·오류 14. 같은 임시 DB에서 전체 검사를 두 번 실행해 모두 통과했다.
- V1 성공 기록 1건, 업무 테이블 14개, 전체 Repository 왕복과 재적용 no-op 확인.
- JAR: build/libs/tunit-backend-0.1.0-SNAPSHOT.jar
- JUnit: build/reports/tests/test/index.html 및 build/test-results/test/
- PostgreSQL 조회 증거: build/reports/postgres-verification.txt

MockMvc는 실제 Spring 필터·Controller·DB를 검증한다. 외부 HTTP·브라우저 쿠키·운영 배포 검증은 아니다. 테스트의 수락 상태 행은 매핑용 fixture이며 관심 업무 구현이 아니다.

[재검증 기록](../docs/work-log/2026-11-19-backend-verification.md)에 기존 22개 검사 통과 후 발견한 로그인 세션·JSON 타입 오류와 수정 전 실패·수정 후 통과 근거를 정리했다. DB 조회 장애 시나리오는 Repository에 예외를 주입했으며 실제 PostgreSQL을 중단해 재현한 장애는 아니다.

전용 테스트 DB가 이미 있으면 TUNIT_TEST_DB_URL/TUNIT_TEST_DB_USERNAME/TUNIT_TEST_DB_PASSWORD를 환경으로 주입하고 ./gradlew test를 사용할 수 있다. 테스트 계정·행이 생성되므로 반드시 전용 테스트 DB여야 한다.

## 수동 실행

.env.example은 변수 이름 예시이며 Spring은 자동으로 읽지 않는다. 실제 DB_URL·DB_USERNAME·DB_PASSWORD를 프로세스 환경에 주입한 뒤 실행한다. 비밀값을 채팅·소스·커밋에 넣지 않는다.

```sh
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

이번 작업에서는 상시 Spring/프론트 서버를 시작하지 않았다. 임시 DB는 이미 삭제했으므로 수동 실행에는 별도 개발 DB가 필요하다.

회원가입 정책, 취향 COMPLETE 조건, 카탈로그 공급자·권한·검색 상한, 추천 가중치·미산정 점수, 초대 기간·재사용, 관심 역방향·재신청, 탈퇴·보존 정책은 미확정이다. 업무 API·실제 프론트 연동·JCloud·CI 연결은 미구현이다.

기술 근거: [Spring Boot 요구사항](https://docs.spring.io/spring-boot/system-requirements.html), [세션 저장](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html), [CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html). Gradle Wrapper 9.5.1 배포 SHA-256을 고정하고 실제 실행했다.
