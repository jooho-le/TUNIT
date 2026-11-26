# Notion TUNIT 구현 대조 — 2026-11-27

기준: TUNIT 작업 트래커의 `작업 구분`이 **Codex 개발 또는 설계 완료**인 전체 26개 페이지. 상태 필터를 추가하지 않았다. 조회 결과 `has_more=false`이며 본문을 가져와 요구사항·연관 문서를 대조했다. 구현 단계에서는 Notion을 읽기만 했다. 이후 사용자 별도 요청으로 승인 정책·실제 결과를 기존 Notion 문서에 반영했으며, [별도 반영 기록](work-log/2026-11-27-notion-approved-decisions-reflection.md)을 참고한다.

작업 브랜치 `feature/notion-p0-20261127`은 GitHub dev `c69f959`에서 생성했다. 기존 `frontend`의 스플래시·디자인 작업은 해당 브랜치에 보존하며 이 작업에서 무단 병합하지 않는다.

## 문서별 대조 목록

| 순서 | 페이지 | 작업 구분 | 확인·구현 연결 |
| --- | --- | --- | --- |
| 1 | [기획서 작성](https://app.notion.com/e6ad062130a983c6aebf81017c8a84a5) | 설계 완료 | 직접 입력·실제 사용자 기반 P0; 결제·데이팅·사업 가설은 범위 밖 |
| 2 | [핵심 기능 MVP 설정](https://app.notion.com/cd9d062130a982ce8ff081028f1a0f24) | 설계 완료 | P0 인증/취향/추천/초대/관심, P1/P2 분리 |
| 3 | [ui 플로우 차트](https://app.notion.com/bb2d062130a9825b96dd8146e5be5194) | 설계 완료 | S01~S27 기존 디자인 보존·실서버 계약 연결 |
| 4 | [logic 플로우 차트](https://app.notion.com/bf2d062130a9827fa1b4810bb2064ecb) | Codex 개발 | 추천·초대·관심 상태전이·원자성 |
| 5 | [프론트/백엔드/DB/배포 구조 결정](https://app.notion.com/facd062130a982a9976c0106e84da547) | 설계 완료 | React/Spring/PostgreSQL/JCloud 유지, 실배포 별도 |
| 6 | [데이터 목록 만들기](https://app.notion.com/428d062130a9834e8ac7814b95f7cdbe) | 설계 완료 | 14종 영속 모델·계산 데이터 구분 |
| 7 | [각 데이터 필드 정의](https://app.notion.com/bc6d062130a98224984081f41d45a5a4) | 설계 완료 | V1 유지, 새 제약은 V2·DTO와 Entity 분리 |
| 8 | [폴더 구조 잡기](https://app.notion.com/40bd062130a983068865015edc17e6de) | 설계 완료 | 기존 feature/Controller→Service→Repository 구조 재사용 |
| 9 | [기능 요청/응답 쪼개기](https://app.notion.com/08bd062130a983e88a2701f841818397) | 설계 완료 | 사용자 행동→서버 요청→UI 실패 복구 |
| 10 | [엔드포인트 목록 설계 (GET/POST/PUT/DELETE)](https://app.notion.com/368d062130a98360983881a6a9f6594f) | 설계 완료 | 카탈로그·프로필·매칭·초대·관심·연결 경로 대조 |
| 11 | [요청값/응답값 형태 설계](https://app.notion.com/c13d062130a983d69dd501963e87f5a1) | Codex 개발 | 페이지·직접 DTO·nullability·OpenAPI/TS 일치 |
| 12 | [에러 규칙 정하기](https://app.notion.com/dfad062130a98315822a818db3d79ad1) | 설계 완료 | 공통 오류·403/404·409·트랜잭션 실패 비노출 |
| 13 | [서버 에러 시 화면 안죽게 처리](https://app.notion.com/693d062130a982e8a96001c2e9b3ea7d) | Codex 개발 | 네트워크·401·403·409·204·입력 유지 |
| 14 | [CORS, 로깅, 에러처리 기본틀 설정](https://app.notion.com/3aed062130a982aabf16813dbfe1a990) | Codex 개발 | 같은 출처 프록시·요청 ID·민감정보 마스킹 |
| 15 | [입력값 검사](https://app.notion.com/003d062130a982f88573012486c9f3a2) | Codex 개발 | 문자열/UUID/중복/범위·GENRE/MOOD 검증 |
| 16 | [비밀번호 해시 저장](https://app.notion.com/39bd062130a983ef8584812b8b982827) | 설계 완료 | 기존 BCrypt 구현 재사용·회귀 테스트 |
| 17 | [회원가입 API + 중복체크](https://app.notion.com/c8ed062130a98293a1758110ab3c0b36) | 설계 완료 | 기존 가입·중복·별도 로그인 정책 유지 |
| 18 | [로그인 API](https://app.notion.com/7b0d062130a98394aec90104f999fc6b) | 설계 완료 | 기존 세션 로그인·CSRF 회전 재사용 |
| 19 | [세션·쿠키·CSRF 인증 보안 설정](https://app.notion.com/df2d062130a9820bb5bc01f267ab4702) | 설계 완료 | 세션·쿠키·CSRF 강도 유지 |
| 20 | [로그아웃 전략 결정](https://app.notion.com/92bd062130a98371b52e813ca93b63a0) | 설계 완료 | 기존 세션 무효화·204 유지 |
| 21 | [본인 권한 수정/삭제 체크](https://app.notion.com/3bbd062130a983349690812baab90ac0) | Codex 개발 | 초대 당사자·관심 발신/수신·비공개 접근 검사 |
| 22 | [Create API](https://app.notion.com/85ed062130a982119d7b016272b8cb89) | Codex 개발 | 초대/관심 생성·중복 방지 |
| 23 | [Read API](https://app.notion.com/06fd062130a983d2b5e7813c366b2b73) | Codex 개발 | 검색·분석·추천·초대·관심·연결 목록 |
| 24 | [Update API](https://app.notion.com/2c1d062130a98352b274813bcf5289be) | Codex 개발 | 관심 종료 전이·초대 완료 원자성 |
| 25 | [Delete API](https://app.notion.com/b8cd062130a983c6bf8301b134a85be7) | Codex 개발 | 취향 초기화 유지·연결 해제 추가; 탈퇴/철회 별도 |
| 26 | [중요 기능 테스트 시나리오 작성](https://app.notion.com/22ed062130a98319b1d30169bb47cbf7) | 설계 완료 | T01~T44 중 적용 가능한 서버/DB/프론트 검증 |

## 구현 전 확인한 충돌과 해결

- 현재 HTTP 어댑터의 `/music/catalog`, `/invitations/{token}/accept`, `Taste` 요청·목록 배열은 서버 설계와 다르다. `/catalog/*`, `/complete`, `{artistIds,trackIds,tagIds}`, PageResponse와 명시적인 DTO 변환으로 맞춘다. 가입 후 자동 로그인은 하지 않는다.
- 옛 개요의 `match_snapshots`는 선택 캐시다. 데이터 필드 문서의 14개 테이블을 유지하며 캐시/벡터/가짜 사용자를 추가하지 않는다.
- 카탈로그 태그의 일부 예시가 items 래퍼지만 상세 DTO·기존 서버는 배열이다. 기존 배열 계약을 유지한다.
- 초대 생성 예시 일부에 Markdown 링크가 JSON 내부로 섞여 있다. 필드 계약표의 `invitationUrl/expiresAt/status`를 사용한다.
- 공개 카탈로그 여부는 미확정이므로 기존 로그인 보호를 유지한다. 외부 공급자/이미지 사용권은 확정 전이어서 자동 수집·초기 음악 데이터 삽입을 하지 않는다.
- GET 초대 상태로 수신자를 연결하거나 DB 상태를 변경하지 않는다. 만료는 응답 시 판정하고 명시적 POST에서만 완료한다.
- 만료 링크는 기존 `INVITATION_NOT_FOUND` 404, 비공개 상대는 `RESOURCE_NOT_FOUND` 404로 보호하며 별도 410 정책을 임의 도입하지 않는다. 없는/이미 해제된 연결은 기존 리소스 없음 404를 사용한다.
- 회원탈퇴·P1 초대 철회·개인정보/로그 보관 기간·운영 배포는 정책/환경이 필요한 별도 범위다. 현재 사용자 승인 없이 활성화하지 않는다.

## 이 세션에서 확인한 정책

- 사용자는 문서 제안식 아티스트 30%·곡 30%·장르 40%를 초기 구현 기준으로 선택했다. 실제 추천 성능·관계 성사 확률로 검증된 값이 아니다. 없는 장르를 생성하지 않으며 출처별 정규화·가용 특징 재정규화를 사용한다.
- 초대: 24시간·난수 원문은 생성 시 한 번만 응답·해시 저장·상대 1명·완료 중복 거부·만료 후 비교 차단·매 비교 시 양측 완료/공개/동의 재검사.
- 관심: 같은/역방향 PENDING 409·거절/취소/해제 후 새 요청 허용·수신자 수락/거절·발신자 취소.
- 연결: 당사자만 현재 연결 물리 삭제·과거 ACCEPTED 보존·제3자 403. 회원탈퇴·P1 초대 철회는 보류.
- 검색은 기존 DB만 사용한다. 기본 20/최대 50, 이름 또는 제목→UUID 정렬, q는 공백 정리·최대 255자다. 임의 sort는 지원하지 않는다.

## 실행과 결과

기존 UI와 Notion의 장르 표시 기준을 연결하기 위해 계약을 보완했다. 닉네임 편집은 `PATCH /me/profile`을 추가해 실제 서버로 연결한다. 초대 상태의 초대자 대기 화면·유효기간 표시는 개인정보 없는 `viewerRole`·`expiresAt`만 보완하고 사용자 이름·ID는 공개하지 않는다. 공개 설정과 취향 PUT은 독립 API로 분리하며 한 요청처럼 부분 성공을 숨기지 않는다. 관심 한마디·일반 사용자의 카탈로그 직접 등록은 확정된 P0 서버 계약에 없어 HTTP 화면에서 제공하지 않는다.

곡의 `commonArtistGenres`는 곡 GENRE와 참여 아티스트 GENRE 합집합의 교집합이다. 조회에서 계산하고 조인 테이블에 일치 플래그를 저장하지 않는다. 실제 API의 DTO 필드·프론트 생성 타입·곡 목록 표시를 함께 맞췄다.

완료: 30개 HTTP 작업·OpenAPI/TS 생성 타입·HTTP 어댑터·역할/CSRF·쌍 잠금/동시성·V2 부분 UNIQUE·조회 부작용 방지·안전한 요청 로그. 프론트 디자인/CSS·3색·기존 mock 기본 모드는 유지했다.

검증: **백엔드72 PASS/bootJar PASS**, 임시 PostgreSQL V1/V2·14테이블, **프론트66 PASS/build PASS**, **디자인3 PASS/46상태**, 디자인 TS·생성 타입 일치 PASS. 상세 T01~T44 구분과 미검증 환경은 [검증 기록](test-results.md)에 있다. “26문서 전부 읽음”은 미확정/P1/P2/실배포까지 전부 완료했다는 뜻이 아니다.

보류/한계: 외부 공급자/카탈로그 데이터 권한과 데이터 준비, 회원탈퇴/보존, P1 초대 철회, GENRE 복합 FK의 DB 직접 쓰기 강화, AI·실배포·운영 로그 정책·대규모 쿼리 최적화. 브라우저→실제 HTTP→Spring→DB 전체 흐름·Figma·JCloud는 미검증이다. HTTP P0 준비와 기본 로컬 mock의 이전 체험 정책을 구분한다.

기술 근거: [Spring Data JPA locking](https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html), [Spring OncePerRequestFilter](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/OncePerRequestFilter.html), [PostgreSQL partial index](https://www.postgresql.org/docs/16/indexes-partial.html), [expression index](https://www.postgresql.org/docs/16/indexes-expressional.html). 잠금 방식과 부분 UNIQUE를 조합한 구체적인 업무 구현은 이 저장소의 결정이며 실제 PostgreSQL 테스트로 확인했다.

