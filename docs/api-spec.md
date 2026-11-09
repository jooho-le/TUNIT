# 프론트 API 연동 초안

기계 판독 계약은 [contracts/openapi.yaml](../contracts/openapi.yaml), TypeScript 인터페이스는 [api/types.ts](../frontend/src/api/types.ts), 요청 매핑은 [api/http.ts](../frontend/src/api/http.ts)입니다. OpenAPI 파일은 YAML 1.2에서 유효한 JSON 표기를 사용합니다. 서버 구현 완료를 뜻하지 않습니다.

기본 URL은 같은 출처 `/api/v1`입니다. 인증은 미래 Spring의 HttpOnly 세션 쿠키를 전제로 `credentials: include`를 사용합니다. 변경 요청은 먼저 `GET /auth/csrf`에서 `{token, headerName}`을 받고 허용된 `X-CSRF-TOKEN` 또는 `X-XSRF-TOKEN` 헤더를 보냅니다. 로그인/가입/로그아웃 뒤 토큰 캐시를 비웁니다. CSRF 발급 실패 시 변경 요청을 보내지 않습니다.

| 기능      | 요청                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| 인증      | POST `/auth/signup`, `/auth/login`, `/auth/logout`; GET `/auth/me`, `/auth/csrf`                                 |
| 내 정보   | GET/PATCH `/me/profile`; GET/PUT/DELETE `/me/taste`                                                              |
| 음악      | GET `/music/catalog`; POST `/music/artists`, `/music/tracks`                                                     |
| 추천·발견 | GET `/matches`, `/matches/:userId`, `/discover/tracks`                                                           |
| 초대      | POST `/invitations`; GET `/invitations/:token`; POST `/:token/accept`; GET `/:token/compare`                     |
| 관심      | POST `/interests`; GET `/interests/inbox`, `/interests/sent`; POST `/interests/:id/accept`, `/reject`, `/cancel` |
| 연결      | GET `/connections`                                                                                               |

`/auth/me`, `/auth/csrf`, PATCH `/me/profile`, 음악 카탈로그/직접 입력, 초대 참여 POST는 Notion의 원래 경로 표에 없던 **프론트 제안**입니다. Spring Controller/DTO 작성 시 응답·상태 코드·보안 설정을 합의해야 합니다. 별도 취향 조회 대신 현재 UI는 profile 응답 안의 taste를 사용합니다. 팔로우·대화·피드 API는 계약하지 않았습니다.

성공 응답은 User/Profile/Match/Interest 등 JSON입니다. `logout`, 취향 삭제는 204로 가정합니다. 예외는 `{code, message}`입니다. 401은 로그인, 403은 권한/공개/CSRF, 409는 중복·최종 상태, 410은 만료, 422는 미완료 취향 안내로 이어집니다. 후보 없음은 오류가 아닌 `[]`입니다.

취향 PUT은 부분 저장을 허용하고 중복 ID를 제거합니다. 완료 여부는 서버 응답의 `complete`가 최종 기준입니다. 대상의 공개·소유권·관심 행동 권한은 미래 서버에서 검증해야 하며 프론트 보호 라우트만으로 보안을 충족하지 않습니다.

Mock과 HTTP는 공통 인터페이스를 사용하지만 저장·인증 구현은 다릅니다. HTTP 모드는 실패 시 로컬 데이터로 자동 전환하지 않습니다. 로컬 어댑터 테스트 결과는 실제 API 응답·DB 트랜잭션 결과가 아닙니다.
