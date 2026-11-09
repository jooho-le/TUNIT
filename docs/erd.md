# DB 구조 예약 — 미구현

Notion 설계 기준의 관계를 정리한 문서입니다. SQL·JPA Entity·Flyway 마이그레이션·실제 DB는 만들지 않았습니다.

| 테이블                     | 핵심 관계·제약 초안                                                     |
| -------------------------- | ----------------------------------------------------------------------- |
| users                      | email UNIQUE, password_hash, nickname, visibility                       |
| artists / tracks           | 출처·외부 ID 중복 제어                                                  |
| track_artists              | 곡 ↔ 아티스트 복합 PK/FK                                               |
| user_artists / user_tracks | 사용자·음악 복합 UNIQUE/FK                                              |
| taste_profiles             | 사용자별 준비 상태·태그·갱신 시각                                       |
| invitations                | inviter, used_by, token_hash, expires_at, 양측 동의                     |
| interest_requests          | sender, recipient, status, version; 본인 요청 금지·PENDING 쌍 중복 방지 |
| connections                | 정규화된 사용자 쌍 UNIQUE, accepted_request_id                          |
| match_snapshots            | 선택적 추천 캐시; 취향 변경·삭제·공개 전환 시 무효화                    |

관심 요청 ACCEPTED와 연결 생성은 같은 트랜잭션이어야 합니다. 낙관적/행 잠금 및 관계쌍 유일 제약은 서버 구현 시 선택하고, T12/T18/T19 통합 테스트로 검증합니다. 로컬 JSON 저장은 이 관계형 제약의 구현 증거가 아닙니다.
