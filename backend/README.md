# Backend scaffold

이 디렉터리는 Notion 명세에 따른 Spring Boot 프로젝트의 폴더·설정 뼈대입니다. Controller, Service, Entity, Repository, 인증, API, DB 스키마·마이그레이션을 구현하지 않았습니다. `TunitApplication.java`, Spring 의존성, Gradle wrapper도 아직 없습니다.

Java 21을 시작 기준으로 선언했으며 Spring Boot 버전과 JDK 호환성은 실제 백엔드 착수 시 확정합니다. `build.gradle`은 Java 프로젝트 틀만 제공합니다. 현재 실행 가능한 Spring 서버가 아닙니다.

`application*.yml`은 설정 예시이며, `.env.example`은 변수 목록입니다. Spring은 `.env` 파일을 자동으로 읽지 않으므로 실제 실행 단계에서 운영체제 환경 또는 별도 비밀 설정 주입 방식을 선택해야 합니다. `app.*` 설정의 Java 바인딩도 미구현입니다.

운영 쿠키는 HttpOnly·Secure·SameSite=Lax를 기본으로 지정했습니다. 로컬 HTTP 예외는 `local` 프로필에만 둡니다. Spring Security의 CSRF를 끄는 설정은 없습니다. 실제 Spring Security, BCrypt, CSRF 엔드포인트 및 권한 검사는 추후 구현하고 검증해야 합니다.

기능 경로: `config`, `common`, `auth`, `user`, `music`, `taste`, `match`, `invitation`, `interest`, `connection`, `discovery`. `db/migration`과 테스트 폴더는 위치만 예약했습니다.
