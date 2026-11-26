# TUNIT Spring P0 백엔드

[Notion 26문서 대조](../docs/notion-p0-implementation-review.md) · [API 계약](../docs/api-spec.md) · [검증 기록](../docs/test-results.md)

Java 21·Spring Boot 4.1.2·Spring Security 서버 세션·Spring Data JPA·Flyway·PostgreSQL이다. V1의 14개 테이블을 유지하고 V2에 같은/역방향 PENDING 중복 방지 인덱스를 추가했다. 인증·가입·취향·공개/동의 설정에 검색·프로필·추천·초대·관심·연결 해제를 더해 **30개 HTTP 작업**을 제공한다.

## 주요 구현

- Controller→Service→Repository, Entity와 공개 DTO 분리, 직접 DTO/페이지/공통 오류 응답.
- 취향 COMPLETE: 아티스트 5명·곡 10곡·GENRE/MOOD 각각 1~3개. 회원가입은 Unicode 8자 이상/UTF-8 72바이트 이하 비밀번호, 닉네임 공백 정리 후 Unicode 1~50자, 별도 로그인.
- 카탈로그는 등록 DB만 검색하며 이름/제목→UUID 순서, 기본20/최대50. 활성 GENRE·실제 참여 아티스트·곡/아티스트 장르 교집합을 반환한다. 기본 계정·음악·태그 자동 생성이나 외부 공급자 호출은 없다.
- 개인 분석은 직접 선택·아티스트·곡 출처별 장르 분포를 정규화해 결합한다. 추천은 아티스트 Jaccard 30%·곡 Jaccard 30%·장르 cosine 40% 초기 가설이며 누락 특징은 null/가중치 재정규화한다. AI/임베딩·점수 영속 캐시가 없다.
- 초대는 24시간·난수 토큰 SHA-256 저장·한 상대·완료 중복 금지. 익명 GET은 개인정보 없이 상태만 제공하고 매 비교마다 양측 공개/완료/동의/기한을 검사한다.
- 관심 요청은 역할·PENDING 상태를 검사하고 수락과 연결 생성을 하나의 트랜잭션으로 처리한다. 사용자 쌍 잠금·부분 UNIQUE·@Version을 사용한다. 연결 해제는 현재 관계만 삭제하고 ACCEPTED 이력을 보존한다.
- 서버 생성 요청 ID·안전한 메타데이터 로그·no-store. SQL/원문 토큰/본문/쿠키/비밀번호는 애플리케이션 요청 로그와 오류 응답에서 제외한다.

전체 경로/본문/응답은 [API 문서](../docs/api-spec.md)와 [OpenAPI](../contracts/backend-foundation.openapi.json), 상태/경합 규칙은 [상태 규칙](../docs/state-transitions.md)을 참고한다.

## 보안과 환경

기존 HttpOnly·SameSite=Lax·기본 Secure=true·cookie-only 세션을 유지한다. local 프로필만 HTTP의 Secure=false를 사용한다. 로그인 시 세션 ID·CSRF 교체, 로그아웃은 CSRF 확인 후 세션 무효화/204다. 카탈로그는 로그인 필수이며 CORS 와일드카드를 추가하지 않았다. 프록시와 같은 출처 `/api`를 사용한다.

[.env.example](.env.example)은 이름 예시이며 Spring이 자동 로드하지 않는다. DB_URL/DB_USERNAME/DB_PASSWORD는 프로세스 환경에 주입한다. APP_PUBLIC_URL은 HTTPS(로컬만 HTTP)를 요구한다. CATALOG_EXTERNAL_HOSTS/CATALOG_ARTWORK_HOSTS는 권한을 검토한 HTTPS 정확한 호스트만 쉼표로 설정한다. 기본 빈 목록에서는 URL을 null로 반환하며 원격 파일을 수집하지 않는다. 실제 비밀값을 소스/채팅에 넣지 않는다.

## 검증

저장소 루트에서 JDK21·PostgreSQL16 개발 도구·Bash·Python3·OpenSSL이 준비된 경우 실행한다.

```sh
backend/scripts/test-postgres.sh
```

자체 SCRAM 임시 PostgreSQL을 127.0.0.1 임의 포트에 생성한다. 기존 DB_URL·개발 DB·5432 서비스를 사용하지 않으며 검사 후 자신이 만든 DB만 종료/삭제한다. H2·Docker·상시 Spring 서버를 사용하지 않는다. Gradle test와 bootJar를 실행한다. 도구 경로는 TUNIT_JAVA_HOME/TUNIT_PG_BIN으로 지정할 수 있다.

결과는 [최신 검증 기록](../docs/test-results.md)에 있다. 로컬 JUnit HTML은 `build/reports/tests/test/index.html`, XML은 `build/test-results/test/`, Flyway/테이블 조회는 `build/reports/postgres-verification.txt`, JAR는 `build/libs/tunit-backend-0.1.0-SNAPSHOT.jar`에 생성한다. MockMvc+실제 PostgreSQL 결과이며 외부 브라우저/HTTP/JCloud 검증은 아니다.

전용 테스트 DB를 따로 쓸 때만 TUNIT_TEST_DB_URL/TUNIT_TEST_DB_USERNAME/TUNIT_TEST_DB_PASSWORD로 `./gradlew test`를 실행한다. 테스트는 격리 DB의 데이터를 초기화하므로 기존 개발/운영 DB를 지정하지 않는다.

## 수동 실행과 남은 범위

이번 작업에서는 상시 서버를 시작하지 않았다. 별도 개발 DB·검토한 음악/태그 데이터와 환경변수를 준비한 사용자가 직접 실행한다.

```sh
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

GENRE 복합 FK/DB 직접 쓰기 강화는 별도 설계 결정이다. 생성자는 MOOD를 거절하고 조회는 활성 GENRE만 사용하지만 SQL 직접 입력까지 차단하지 못한다. ACCEPTED와 connection의 쌍 일치는 서비스 트랜잭션에서 보장하며 임의 외부 SQL에는 강제하지 않는다. 기존 데이터에 중복 PENDING이 있으면 V2는 실패하고 자동 삭제하지 않는다.

추천/발견은 현재 등록 데이터를 메모리에서 계산하는 MVP이며 대규모 데이터의 쿼리 최적화·부하 검사는 후속이다. 외부 공급자·일반 사용자 음악 등록·회원탈퇴/보존·초대 철회(P1)·AI·JCloud/HTTPS/프록시 운영 로그 보관·CI 백엔드 실행은 미구현/미검증이다.
