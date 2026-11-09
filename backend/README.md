# 백엔드 준비 범위

[문서 안내](../docs/README.md) · [API 계약](../docs/api-spec.md) · [DB 초안](../docs/erd.md)

Notion 설계의 Java Spring Boot 백엔드를 위한 **폴더·설정 초안**이다. 현재 실행 가능한 Spring 앱은 아니다.

## 준비한 것

- `config`, `common`, `auth`, `user`, `music`, `taste`, `match`, `invitation`, `interest`, `connection`, `discovery` 패키지 위치.
- 테스트와 `db/migration` 위치.
- Java 21 시작 기준의 Gradle Java 설정. Spring/JDK 최종 호환 버전은 미확정.
- PostgreSQL 환경변수·JPA validate·Flyway·세션 쿠키·local/prod 설정 예시.
- [.env.example](.env.example)의 변수 이름. 실제 비밀값은 없음.

## 아직 없는 것

Spring 플러그인·의존성, `TunitApplication.java`, Gradle wrapper, Controller·Service·DTO·Entity·Repository, SQL·마이그레이션, 실제 인증·인가·CSRF·트랜잭션.

Spring은 `.env`를 자동으로 읽지 않는다. 실제 착수 시 환경 주입 방식과 `app.*` Java 바인딩을 구현해야 한다. 쿠키 설정 예시는 운영 HttpOnly·Secure·SameSite=Lax와 로컬 HTTP 예외를 구분하지만, 설정 파일만으로 인증이 구현되는 것은 아니다.

전체 연동 경계와 이후 검증은 [아키텍처](../docs/architecture.md)·[검증 기록](../docs/test-results.md)을 따른다.
