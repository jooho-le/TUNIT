# API 계약

[문서 안내](README.md) · [상태 규칙](state-transitions.md) · [Notion 대조](notion-p0-implementation-review.md)

2026-11-27 기준 Spring에 구현된 **30개 HTTP 작업**이다. 실제 경로는 `/api/v1`을 앞에 붙인다. 정본은 [OpenAPI](../contracts/backend-foundation.openapi.json)이며, Java 경로·공개 DTO 및 [생성한 TypeScript 타입](../frontend/src/api/generated.ts)을 자동 검사한다. `contracts/openapi.yaml`은 초기 프론트 제안의 보존본이며 현재 서버 계약이 아니다.

## 인증과 요청

- 같은 출처의 서버 세션 쿠키, `credentials: include`. HttpOnly·SameSite=Lax·운영 Secure=true를 유지한다.
- 변경 전 `GET /auth/csrf`의 `{token,headerName}` 사용. 가입·로그인·로그아웃 뒤 클라이언트 CSRF 캐시를 비운다. CSRF 없는 요청은 401보다 먼저 403이 될 수 있다.
- 익명 허용: CSRF·가입·로그인과 `GET /invitations/{token}`. 초대 비교·카탈로그는 로그인 필수다.
- 성공 DTO는 직접 반환한다. 목록은 `{items,page,size,totalElements}`이며 태그 조회만 배열이다. 빈 추천은 200과 빈 items다. 204는 본문이 없다.
- 페이지는 0부터, 기본 size 20(매칭 10), 최대 50. 음수·범위 초과·DB offset 초과는 400. 검색 q는 앞뒤 공백 제거 후 최대 255자이며 `%`·`_`도 일반 문자로 취급한다.
- DTO에 없는 필드, 잘못된 UUID/JSON 타입은 400. 사용자 ID·상태·version·권한을 클라이언트에서 덮어쓸 수 없다.

## 구현한 요청

| Method | 경로 | 동작 |
| --- | --- | --- |
| GET | `/auth/csrf` | 세션 CSRF 획득 |
| POST | `/auth/login` | JSON 세션 로그인 |
| GET | `/auth/me` | 현재 인증 사용자 |
| POST | `/auth/logout` | 세션 로그아웃 |
| POST | `/auth/signup` | 회원가입 |
| GET | `/catalog/tags` | 활성 태그 조회 |
| GET | `/me/taste` | 본인 취향 조회 |
| PUT | `/me/taste` | 본인 취향 전체 교체 |
| DELETE | `/me/taste` | 본인 취향 초기화 |
| GET | `/me/profile/settings` | 본인 공개·비교 동의 설정 조회 |
| PATCH | `/me/profile/settings` | 본인 공개·비교 동의 설정 부분 변경 |
| GET | `/catalog/artists` | DB 아티스트 검색 |
| GET | `/catalog/tracks` | DB 곡·아티스트 검색 |
| GET | `/me/profile` | 내 취향 분석 |
| PATCH | `/me/profile` | 본인 닉네임 변경 |
| GET | `/matches` | 실제 공개 후보의 취향 유사도 |
| GET | `/matches/{userId}` | 공개 취향 비교 |
| GET | `/discover/tracks` | 실제 등록된 새로운 음악 |
| POST | `/invitations` | 24시간 단일 상대 초대 |
| GET | `/invitations/{token}` | 개인정보 없는 초대 상태 |
| POST | `/invitations/{token}/complete` | 양측 동의 확인 후 초대 완료 |
| GET | `/invitations/{token}/compare` | 초대 참여자 비교 |
| POST | `/interests` | 관심 PENDING 생성 |
| POST | `/interests/{id}/accept` | 관심 accept |
| POST | `/interests/{id}/reject` | 관심 reject |
| POST | `/interests/{id}/cancel` | 관심 cancel |
| GET | `/interests/sent` | 본인 관심 sent |
| GET | `/interests/inbox` | 본인 관심 inbox |
| GET | `/connections` | 현재 내 연결 목록 |
| DELETE | `/connections/{connectionId}` | 당사자 연결 해제·수락 이력 보존 |

## 중요한 본문·응답

- 취향 PUT: `{artistIds,trackIds,tagIds}` 세 배열 전체 교체. 공개·동의는 별도 `PATCH /me/profile/settings`의 `{isPublic?,comparisonConsent?}`로 변경한다. 부분 성공을 하나의 성공으로 표시하지 않는다.
- 취향 COMPLETE: 아티스트 5명·곡 10곡·GENRE 1~3개·MOOD 1~3개. 닉네임 PATCH는 `{nickname}`만 받는다.
- 관심 생성: `{recipientId}`만 받는다. 수락/거절/취소는 빈 본문이며 응답 `{id,status,connectionId,resolvedAt}`의 connectionId는 수락 때만 존재한다. 한마디 입력·일반 사용자 음악 등록은 확정된 서버 계약에 없어 HTTP UI에서 숨긴다.
- 초대 생성 응답 `{invitationUrl,expiresAt,status}`. 원문 토큰은 생성 URL에서만 제공하고 DB에는 SHA-256 해시를 저장한다. 조회 응답은 `{status,valid,requiresLogin,readyToCompare,viewerRole,expiresAt}`이며 익명에게 이름·사용자 ID·취향을 주지 않는다. `/complete`는 상대 한 명만 연결한다.
- 곡은 실제 `genres`와 참여 아티스트 `genres`를 제공한다. `commonArtistGenres`는 둘의 교집합이며 조회 때 계산한다. 외부 링크·artwork는 검토한 HTTPS 호스트만 제공하고 기본 null이다. 실제 재생·외부 검색 수집은 없다.
- 매칭 점수는 0~1 또는 null. 없는 특징은 breakdown에서 null이며 가용 특징의 가중치를 재정규화한다. 추천 가중치 30/30/40은 사용자가 승인한 초기 가설이다.

## 오류와 클라이언트 처리

오류는 `{code,message,fieldErrors,timestamp,path}`와 `X-Request-Id`다. 요청 ID는 서버가 생성하며 오류 path에서 초대 토큰을 가린다. 비밀번호·쿠키·CSRF·SQL·해시·원문 토큰은 오류/애플리케이션 요청 로그에 넣지 않는다.

| 상태 | 의미·처리 |
| --- | --- |
| 400 | 입력 오류·자기 요청; 입력 보존, 해당 필드 안내·초점 |
| 401 | 로그인/세션 필요; 현재 초대 등 내부 경로를 유지해 로그인 안내 |
| 403 | 권한·CSRF·비교 공개/동의 부족; 원인 안내, 자동 재전송 없음 |
| 404 | 없는/비공개 상대·없는/만료 초대·없는/이미 해제된 연결 |
| 409 | 취향 미완료·중복 PENDING·이미 연결·종료 상태·경합; 현재 상태 재조회 |
| 500/503 | 서버/인증 의존 서비스 실패; 성공 처리하지 않고 기존 입력 유지 |
| 클라이언트 0 | 네트워크 실패; 관심 생성·연결 해제는 GET으로 반영 여부 확인 |

초기 mock의 410/422와 다른 서버 정책은 [상태 규칙](state-transitions.md)에 분리했다. HTTP 요청을 mock 성공으로 대체하거나 변경 요청을 자동 재시도하지 않는다. 정상 상태 코드라도 JSON이 잘못됐으면 502 INVALID_RESPONSE로 처리한다.

회원탈퇴·초대 철회(P1)·공급자 API·팔로우/채팅은 이 계약에 추가하지 않았다.
