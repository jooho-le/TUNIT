# 누락했던 세 설계 문서와 API 구현 범위

> 이 문서는 2026-11-19 당시의 검토 기록이다. 2026-11-27에 26문서·30개 API로 확장한 현재 결과는 [최신 대조](notion-p0-implementation-review.md)와 [검증 기록](test-results.md)을 따른다. 아래 “미구현/보류”는 당시 기준이다.

검토일: 2026-11-19. Notion은 읽기만 한다. 기존 프론트·V1 SQL·미커밋 작업을 보존한다.

## 추가 확인한 원문

- [데이터 목록 만들기](https://app.notion.com/p/428d062130a9834e8ac7814b95f7cdbe)
- [기능 요청/응답 쪼개기](https://app.notion.com/p/08bd062130a983e88a2701f841818397)
- [엔드포인트 목록 설계 (GET/POST/PUT/DELETE)](https://app.notion.com/p/368d062130a98360983881a6a9f6594f)

위 세 문서를 [DTO 계약](https://app.notion.com/p/c13d062130a983d69dd501963e87f5a1), [필드/V1 정의](https://app.notion.com/p/bc6d062130a98224984081f41d45a5a4), 기존 코드와 교차 확인했다.

## 충돌과 처리 기준

| 항목 | 확인한 차이 | 처리 |
| --- | --- | --- |
| 데이터 종류 | 데이터 목록도 P0 14종을 명시 | 기존 V1·Entity/Repository가 일치하므로 중복 테이블·추가 마이그레이션 불필요 |
| 태그 응답 | 엔드포인트 예시는 items, 후속 DTO 문서는 TagSummary 배열 | 후속 필드 계약에 맞춰 활성 태그 배열 반환 |
| 가입 응답 | 앞 문서는 id/email/nickname, 후속 DTO는 createdAt 추가 | 후속 SignupResponse 4개 필드 적용 |
| 공개 설정 경로 | 이전 프론트 제안 PATCH /me/profile, 후속 문서는 /me/profile/settings | 후속 GET/PATCH /me/profile/settings 적용. 기존 프론트는 수정하지 않음 |
| 취향 PUT | 초기 문서는 빈 배열/전량 교체 잠정, 후속 필드 계약은 3배열 필수·빈 배열 허용 | 세 배열 전체 교체, 누락/null/중복 검증, 부분 선택은 INCOMPLETE |
| 삭제 응답 | 기능 분해는 초기화 상태 설명, 엔드포인트 문서는 204 | DELETE /me/taste는 204 빈 응답 |
| 페이지·정렬·음악 사용권 | 상한/정렬·공급자·외부 URL 허용 범위 미확정 | 카탈로그 음악 검색·외부 링크 노출은 정책 결정 후 구현 |
| 프로필 장르 분포 | 응답 weight는 0~1이나 직접 태그/곡/아티스트의 합산 규칙 미확정 | 가짜 분포·요약을 만들지 않고 GET /me/profile은 보류 |

## 사용자가 이번에 확정한 정책

- 회원가입: 비밀번호 8자 이상·UTF-8 72바이트 이하, 닉네임 앞뒤 공백 제거 후 1~50자, 가입 후 별도 로그인.
- 선택 상한: 아티스트 5명·곡 10곡·장르 3개·무드 3개.
- COMPLETE: 아티스트 5명·곡 10곡·장르와 무드 각각 1~3개. 그보다 적게 저장한 유효 선택은 INCOMPLETE.
- UUID는 기존 Java UUID 식별자 규격을 따르며 발급 버전을 제품 정책으로 고정하지 않는다.

## 이번 추가 구현

| Method | /api/v1 경로 | 범위 |
| --- | --- | --- |
| POST | /auth/signup | 정규화·검증·BCrypt·DB 중복 409·201, 자동 로그인 없음 |
| GET | /catalog/tags | 로그인한 활성 사용자의 GENRE/MOOD 활성 태그 조회 |
| GET | /me/taste | 본인 선택 ID·DB 상태·시각, 조회 중 저장 없음 |
| PUT | /me/taste | 본인 선택 전체 교체·ID/활성 태그/개수 검증·상태 갱신·트랜잭션 |
| DELETE | /me/taste | 본인 선택·요약 초기화·INCOMPLETE·동일 트랜잭션 |
| GET | /me/profile/settings | 본인 공개·비교 동의, 없으면 기본 false/false |
| PATCH | /me/profile/settings | 두 설정 중 제공한 불리언만 변경; null·빈 객체·다른 필드 거절 |

공개 설정과 초기화의 갱신은 같은 사용자 행을 잠가 직렬화한다. 초기화는 별도 설정인 공개·비교 동의를 보존한다. 기존 선호 항목의 가중치는 전체 교체 시 유지하며 새 항목은 V1 기본값 1을 사용한다. 추천 캐시·AI 요약 생성 서비스는 없으므로 구현했다고 표시하지 않는다. 선택 변경 시 기존 요약은 제거한다.

## 별도 구현·결정이 필요한 범위

- 아티스트·곡 검색: 공급자/사용권, 검색 정렬·size 상한 및 공개 범위.
- 개인 프로필 장르 분포·음악 발견·Music Twin: 분포/추천 가중치와 미산정 처리.
- 친구 초대·관심 요청·연결 업무 API: 만료·재사용·역방향 중복·재신청 및 업무 동시성. 이전 요청의 전체 업무 구현 제외 범위를 유지한다.
- 회원 탈퇴·카탈로그 쓰기·P1/P2·프론트 HTTP 연결·JCloud 배포.

## 전체 엔드포인트 대조

기존 인증 4개와 신규 7개는 [실제 OpenAPI](../contracts/backend-foundation.openapi.json) 및 Controller 경로 대조 테스트로 확인한다. 아래 17개 작업은 구현된 엔드포인트로 문서화하거나 성공 응답을 흉내 내지 않는다. 기본 경로는 /api/v1이다.

| Method | 보류 경로 | 필요한 결정·작업 |
| --- | --- | --- |
| GET | /catalog/artists | 데이터 공급/사용권·검색 정책 |
| GET | /catalog/tracks | 데이터 공급/사용권·검색 정책·외부 링크 |
| GET | /me/profile | 장르 분포·요약 계산 규칙 |
| GET | /matches | 추천·점수 미산정 정책·비공개 제외 |
| GET | /matches/{userId} | 비교 계산·상세 공개 범위 |
| GET | /discover/tracks | 실제 음악 데이터·추천·링크 정책 |
| GET | /invitations/{token} | 토큰·유효기간·재사용 |
| GET | /invitations/{token}/compare | 참여자·양측 동의·궁합 계산 |
| GET | /interests/sent | 관심 업무·반환 공개 범위 |
| GET | /interests/inbox | 관심 업무·반환 공개 범위 |
| GET | /connections | 수락 업무·당사자 조회 |
| POST | /invitations | 토큰·만료·재사용 정책 |
| POST | /invitations/{token}/complete | 준비·동의·경합·재호출 |
| POST | /interests | 역방향·재신청·동시 중복 정책 |
| POST | /interests/{id}/accept | 수신자·PENDING·연결 생성 트랜잭션 |
| POST | /interests/{id}/reject | 수신자·상태전이 |
| POST | /interests/{id}/cancel | 발신자·상태전이·수락 경합 |

최종 검사는 **43개 PASS**다. [검증 기록](test-results.md)과 [이번 작업 기록](work-log/2026-11-19-backend-missing-specs.md)에 근거를 정리했다. 원문의 설계 체크 표시를 API 구현 완료로 간주하지 않는다.
