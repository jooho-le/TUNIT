# 배포 준비 범위

[문서 안내](../docs/README.md) · [아키텍처](../docs/architecture.md) · [백엔드 안내](../backend/README.md)

최종 배포 대상은 JCloud다. 현재는 [Nginx 예시](nginx/tunit.conf.example)만 작성했으며 시스템에 적용하거나 배포하지 않았다.

| 항목                     | 현재 가정·상태                                                |
| ------------------------ | ------------------------------------------------------------- |
| 정적 파일                | `frontend/dist/`                                              |
| 미래 Spring API          | loopback `127.0.0.1:8080`, 같은 출처 `/api` 프록시            |
| PostgreSQL               | JCloud에서 허용되는 내부 배치 미확정                          |
| HTTPS·도메인·프록시 헤더 | 실제 환경에서 구성·검증 필요                                  |
| 실행 방식                | systemd/컨테이너 미확정, 실행 서비스·자동 시작·Compose 미설정 |

프론트 정적 파일 배포와 실제 Spring·DB 연동 완료는 구분한다. 외부 컴퓨터에서 가입→취향 저장→초대→관심 수락을 수행하는 검증은 [테스트 기록](../docs/test-results.md)의 T22에 남긴다.
