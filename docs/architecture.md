# 아키텍처와 구현 범위

[문서 안내](README.md) · [개발 가이드](development.md) · [API 계약](api-spec.md)

## 전체 구성

React 프론트는 브라우저 로컬 어댑터로 동작한다. Spring Boot·PostgreSQL에는 14개 테이블·JPA·공통 오류·세션 인증 기반을 구현하고 임시 DB에서 검증했다. 프론트 연결과 추천·초대·관심 업무 서비스·JCloud 배포는 아직 구현하지 않았다.

| 경로                                 | 책임                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| `frontend/src/app/`                  | 앱 시작·HashRouter·세션 표시·보호 경로                             |
| `frontend/src/pages/`                | 로그인 후 Home                                                     |
| `frontend/src/features/`             | landing·auth·taste·matching·discovery·invitations·interests·social |
| `frontend/src/api/`                  | 공통 타입·mock·HTTP 어댑터·오류 처리                               |
| `frontend/src/components/`, `hooks/` | 공통 UI·데이터 로딩·스크롤 모션                                    |
| `frontend/src/styles/`               | 공통 토큰·기능 화면·랜딩 스타일                                    |
| `backend/`                           | Spring Boot·Entity/Repository·V1·공통 오류·세션 인증·PostgreSQL 검사 |
| `contracts/`                         | OpenAPI 초안                                                       |
| `deploy/`                            | JCloud 프록시 예시                                                 |

## 데이터와 요청

[공통 인터페이스](../frontend/src/api/types.ts)를 [mock](../frontend/src/api/mock.ts)과 [HTTP](../frontend/src/api/http.ts)가 구현한다. 기능 화면은 이 인터페이스로 데이터를 다룬다. P1 팔로우는 계정별 로컬 저장을 직접 처리하며 HTTP 모드에서는 미연동 상태다.

기본 모드에는 예시 사용자·요청·연결이 없다. 직접 가입하고 저장한 취향만 비교한다. 예시 카탈로그는 선택 UI용 제목·아티스트·추상 아트이며 음원이나 실제 앨범 이미지를 수집하지 않는다. 저장 키와 체험 방법은 [개발 가이드](development.md)에 모았다.

취향 입력을 바꾸면 이후 조회에서 추천·공개 비교를 다시 계산한다. 다른 탭의 화면을 지속적으로 동기화하는 작업은 없다. 실제 서버에서는 인가·DB 제약·캐시 무효화를 별도로 구현해야 한다.

## 현재 프론트 정책

| 항목        | 기준                                          |
| ----------- | --------------------------------------------- |
| 취향 완성   | 아티스트 5개·곡 10개·장르/무드 각각 1개 이상  |
| 장르·무드   | 각각 최대 3개, 입력 단계별 부분 저장 허용     |
| 공개        | 기본 false, 혼자 탐색은 비공개로 이용 가능    |
| 기본 유사도 | 아티스트 Jaccard 40% + 곡 30% + 장르·무드 30% |
| AI          | 호출·임베딩 미구현, 기본 규칙 프로필 사용     |

선택 개수는 기존 UI를 유지한 현재 정책이다. 초대 기한·재요청 등 서버 확정이 필요한 값은 [상태 규칙](state-transitions.md)에 구분했다. 분석 로딩은 UI 연출이며 실제 서버 AI 작업이 아니다.

## 라우팅과 랜딩

정적 호스팅에서도 경로에 직접 진입할 수 있도록 HashRouter를 사용한다. 화면 URL은 `/#/home` 형식이고 API 주소는 hash와 무관한 `/api/v1`이다. 앱 메뉴는 Home·Discover·Music·My Taste이며 공통 상단 메뉴와 데스크톱·모바일 공통 하단 릴을 제공한다. 랜딩의 릴은 스크롤 챕터, 로그인 후에는 앱 경로에 연결된다.

공개 랜딩은 세션 조회와 독립적으로 표시한다. 시작 CTA만 `/start`에서 인증·취향 상태를 확인한다. 컴포넌트 분리와 실제 인트로 범위는 [화면 지도](screens.md#s01-랜딩), 시각 기준은 [DESIGN.md](../DESIGN.md)에 있다.

공통 스크롤 모션은 늦게 마운트된 장면도 등록하고 스크롤·크기 변경 시 RAF로 CSS 변수를 갱신한다. 랜딩 반복 모션은 viewport/탭 상태에 따라 멈추며, 정리 시 observer·이벤트·예약 프레임을 해제한다. 새 애니메이션 라이브러리·오디오 자동 재생·장기 타이머는 추가하지 않았다.

## 백엔드와 배포 경계

백엔드는 Java 21·Spring Boot 4.1.2·Gradle Wrapper 9.5.1이다. 14개 Entity/Repository와 V1, 공통 페이지·오류 DTO, Security JSON 오류, 로그인·세션 조회·로그아웃·CSRF를 제공한다. Hibernate는 validate, DDL은 Flyway가 담당한다. 통합 검사는 실제 PostgreSQL 16에서 실행했다.

기존 프론트의 ID·목록·취향 저장·초대 상태는 최신 Notion과 달라 자동 호환되지 않는다. [설계 비교](backend-design-review.md)에 차이와 보류 정책을 기록했다. 프론트의 5명·10곡 완료 조건과 로컬 기한·가중치를 서버 정책으로 확정하지 않는다. [백엔드 안내](../backend/README.md)·[배포 안내](../deploy/README.md)를 참고한다. 임시 DB는 종료·삭제했으며 운영 DB·JCloud 연동은 미검증이다.
