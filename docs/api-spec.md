# API 계약 초안

[문서 안내](README.md) · [아키텍처](architecture.md) · [상태 규칙](state-transitions.md)

프론트가 미래 Spring API에 기대하는 요청·응답이다. **실제 서버 엔드포인트는 미구현**이며 기본 mock 동작을 서버 구현 완료로 취급하지 않는다.

| 기준                  | 위치                                                                                |
| --------------------- | ----------------------------------------------------------------------------------- |
| 기계 판독 계약        | [contracts/openapi.yaml](../contracts/openapi.yaml) — YAML 1.2에서 유효한 JSON 표기 |
| TypeScript 인터페이스 | [api/types.ts](../frontend/src/api/types.ts)                                        |
| 요청 매핑             | [api/http.ts](../frontend/src/api/http.ts)                                          |
| HTTP·CSRF 처리        | [api/client.ts](../frontend/src/api/client.ts)                                      |

## 인증과 공통 요청

- 기본 경로: 같은 출처 `/api/v1`. 아래 표의 경로는 이 기준에 상대적이다.
- 인증: 미래 Spring의 HttpOnly 세션 쿠키, `credentials: include`.
- 변경 요청 전 `GET /auth/csrf`에서 `{token, headerName}`을 받고 `X-CSRF-TOKEN` 또는 `X-XSRF-TOKEN`을 보낸다.
- 가입·로그인·로그아웃 뒤 CSRF 캐시를 비운다. 토큰 발급이 실패하면 변경 요청을 보내지 않는다.
- 변경 요청을 자동 재전송하지 않고 HTTP 실패를 mock 성공으로 대체하지 않는다.

실제 소유권·공개·행동 권한과 CSRF 거절은 Spring에서 강제해야 한다. 보호 라우트와 헤더 전송만으로 서버 보안이 완성되는 것은 아니다.

## 요청 목록

| 기능                 | Method           | 경로                                          |
| -------------------- | ---------------- | --------------------------------------------- |
| 가입·로그인·로그아웃 | POST             | `/auth/signup`, `/auth/login`, `/auth/logout` |
| 현재 사용자·CSRF     | GET              | `/auth/me`, `/auth/csrf`                      |
| 내 프로필            | GET, PATCH       | `/me/profile`                                 |
| 내 취향              | GET, PUT, DELETE | `/me/taste`                                   |
| 음악 카탈로그        | GET              | `/music/catalog`                              |
| 음악 직접 추가       | POST             | `/music/artists`, `/music/tracks`             |
| 추천·궁합            | GET              | `/matches`, `/matches/{userId}`               |
| 발견 음악            | GET              | `/discover/tracks`                            |
| 초대 발급            | POST             | `/invitations`                                |
| 초대 상태            | GET              | `/invitations/{token}`                        |
| 초대 참여·동의       | POST             | `/invitations/{token}/accept`                 |
| 친구 비교            | GET              | `/invitations/{token}/compare`                |
| 관심 전송            | POST             | `/interests`                                  |
| 받은·보낸 관심       | GET              | `/interests/inbox`, `/interests/sent`         |
| 관심 수락            | POST             | `/interests/{id}/accept`                      |
| 관심 거절            | POST             | `/interests/{id}/reject`                      |
| 관심 취소            | POST             | `/interests/{id}/cancel`                      |
| 연결 목록            | GET              | `/connections`                                |

`GET /me/taste`는 계약에 있지만 현재 UI는 `/me/profile` 응답의 `taste`를 사용한다. 팔로우·채팅·피드 API는 계약하지 않았다.

## 응답과 오류

성공 데이터는 User·Profile·Match·Interest 등 JSON이다. 가입은 201, 로그아웃·취향 삭제는 204를 가정하며 최종 상태 코드는 서버 작성 때 확정한다. 후보 없음은 오류가 아닌 `[]`이다.

| 상태 | 의미                     | 프론트 처리                |
| ---- | ------------------------ | -------------------------- |
| 400  | 잘못된 입력·자기 요청    | 오류 표시·입력 유지        |
| 401  | 미인증·세션 만료         | 로그인으로 안내            |
| 403  | 인가·공개·동의·CSRF 위반 | 권한·공개 범위 안내        |
| 404  | 대상 없음                | 오류·재확인                |
| 409  | 중복·대기·종료 상태 충돌 | 최신 상태 조회             |
| 410  | 초대 만료                | 만료 안내                  |
| 422  | 취향 미완료              | 입력 안내                  |
| 500  | 저장·서버 실패           | 실패 표시·기존 데이터 유지 |

오류 본문은 `{code, message}`다. 네트워크 연결 실패는 HTTP 상태가 아닌 클라이언트 `status: 0` 오류로 구분한다.

취향 PUT은 부분 저장과 중복 ID 제거를 전제로 한다. 완료 여부는 서버 응답의 `complete`가 최종 기준이다. 세부 행동 규칙은 [상태 규칙](state-transitions.md)에 있다.

## 서버 작성 때 확정할 항목

`/auth/me`, `/auth/csrf`, PATCH `/me/profile`, 음악 카탈로그/직접 입력, 초대 참여 POST는 원래 Notion 경로 표에 없던 프론트 제안이다. Controller·DTO·보안 설정을 작성할 때 응답·상태 코드·검증 정책을 함께 확정해야 한다. 원문 위치는 [요구사항](requirements.md)에 모았다.
