# DB 스키마와 구현 경계

[설계 비교](backend-design-review.md) · [백엔드 안내](../backend/README.md) · [V1 SQL](../backend/src/main/resources/db/migration/V1__initial_schema.sql)

2026-11-19 기준 [Notion 필드 정의](https://app.notion.com/p/bc6d062130a98224984081f41d45a5a4) 15절 V1을 임시 PostgreSQL 16에 적용하고 14개 테이블·Entity/Repository와 Hibernate validate를 확인했다. 운영/개발 DB에 상시 적용한 상태는 아니다.

| 테이블 | PK·관계와 주요 제약 |
| --- | --- |
| users | UUID, email UNIQUE 및 lower(email) UNIQUE, 해시·닉네임 필수 |
| artists | UUID, 외부 ID가 있을 때 source/external_id UNIQUE |
| tracks | UUID, 외부 ID 조건부 UNIQUE, 외부 링크 nullable TEXT |
| taste_tags | UUID, GENRE/MOOD CHECK, type/name UNIQUE |
| track_artists | track_id/artist_id 복합 PK·FK, PRIMARY/FEATURED CHECK |
| user_artists | user_id/artist_id 복합 PK·FK, weight 1~5 |
| user_tracks | user_id/track_id 복합 PK·FK, weight 1~5 |
| user_taste_tags | user_id/tag_id 복합 PK·FK, weight 1~5 |
| artist_genres | artist_id/tag_id 복합 PK·FK |
| track_genres | track_id/tag_id 복합 PK·FK |
| taste_profiles | user_id 공유 PK·FK, INCOMPLETE/COMPLETE, 공개·비교 동의 기본 false |
| invitations | UUID, inviter/accepted_by FK, token_hash UNIQUE, 상태·자기 초대·완료 필수 값 CHECK |
| interest_requests | UUID, sender/recipient FK, 다른 사용자·상태·version·종료 시각 CHECK, @Version |
| connections | UUID, 두 사용자·원인 요청 FK, 정규화 순서 CHECK, 사용자 쌍·원인 요청 각각 UNIQUE |

시각은 TIMESTAMPTZ/Instant이며 6개 복합 PK는 @EmbeddedId/@MapsId다. UUID 발급 버전은 정하지 않고 호출자가 제공한다. 연결 순서는 PostgreSQL과 같은 unsigned UUID 비교를 쓴다.

## 보류한 무결성과 정책

- PENDING 중복·역방향·거절 후 재신청 정책이 미확정이므로 부분 UNIQUE 인덱스는 보류했다.
- GENRE 조인 생성자는 MOOD를 거부하지만 일반 FK는 참조 태그의 type을 검사하지 못한다. DB 직접 입력이 가능함을 실제로 확인했다.
- connections FK만으로 요청 ACCEPTED와 참여자 쌍 일치를 강제하지 못한다. 수락 서비스의 동일 트랜잭션 검증이 필요하다.
- 취향 완료 수·초대 기간·카탈로그 권한·탈퇴 보존 정책은 미확정이다.
- users.visibility, match_snapshots, 관심 note 등 과거 프론트 초안의 필드/테이블은 추가하지 않았다.

현재 검사 결과를 전체 업무 무결성 완성으로 표시하지 않는다. [검증 기록](test-results.md)을 함께 확인한다.
