# JCloud 배포 구조 예약

현재 배포하지 않았습니다. `nginx/tunit.conf.example`은 React 빌드와 `/api` 역방향 프록시 검토용입니다. 실제 시스템 설정에는 적용하지 않았습니다.

- 정적 산출물: `frontend/dist/`
- 미래 Spring: loopback `127.0.0.1:8080`
- PostgreSQL: JCloud에서 허용되는 내부 위치 확정 후 설정
- 운영 HTTPS·도메인·프록시 헤더·쿠키 Secure 설정은 실제 환경에서 검증
- systemd/컨테이너 사용 여부 미확정. 실행 서비스·자동 시작·Compose 파일을 추가하지 않음

프론트 정적 배포만으로 회원가입·DB·관심 상태전이가 실제 서비스가 되지는 않습니다. Spring과 DB 구현 후 외부 컴퓨터에서 전체 흐름을 검증해야 합니다.
