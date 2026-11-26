# PR #2 병합·검사 표시 확인

확인일: 2026-11-19(KST)

## 요청

GitHub PR #2 화면의 `1 of 2 checks passed`와 병합 표시가 나타난 이유를 확인한다.

## 확인한 결과

- [PR #2](https://github.com/jooho-le/TUNIT/pull/2)는 `backend → dev`로 정상 병합되어 닫혔다. 대상 커밋은 `1d6d8c4`, 병합 커밋은 `e8d21d2`다.
- 캡처에서는 한 검사가 완료되지 않은 상태였다. 현재 동일 head 커밋의 push·PR 검사와 병합 커밋의 검사는 모두 `completed / success`다.

| 실행 | 결과 | 근거 |
| --- | --- | --- |
| backend push | SUCCESS | [44388997229](https://github.com/jooho-le/TUNIT/actions/runs/44388997229) |
| pull_request | SUCCESS | [44389130573](https://github.com/jooho-le/TUNIT/actions/runs/44389130573) |
| dev 병합 커밋 | SUCCESS | [44389159994](https://github.com/jooho-le/TUNIT/actions/runs/44389159994) |

`.github/workflows/checks.yml`이 push와 pull_request 모두에서 실행되므로 동일 커밋에서 두 검사가 보인다. 조회한 PR job의 npm ci·npm test·npm run build 단계도 모두 성공했다.

공개 API 조회 결과 현재 dev는 `protected=false`, 적용된 branch rule은 빈 배열이다. 필수 검사가 끝날 때까지 병합을 막는 규칙이 설정된 상태가 아니므로 검사 완료 전에도 병합할 수 있다. 이번 확인에서는 보호 규칙을 바꾸지 않았다.

PR 변경 파일은 125개이며 frontend/ 파일 18개도 포함되어 있다. 후속 커밋 `1d6d8c4`에 프론트 가독성·디자인 보드 변경이 함께 들어간 것을 로컬 커밋과 원격 파일 목록에서 확인했다. 브랜치 이름이 커밋에 포함할 파일 종류를 자동으로 제한하지 않는다.

현재 GitHub Actions workflow는 프론트 검사만 실행한다. 앞서 통과한 백엔드 43개는 로컬 MockMvc·임시 PostgreSQL 검증 결과이며 GitHub에서 백엔드 검사가 실행된 결과로 취급하지 않는다.

## 수행 범위와 한계

- GitHub 커넥터의 PR·workflow/job 조회와 공개 GitHub API로 체크/보호 상태를 읽었다. CLI의 gh 인증이 없어 공개 API를 사용했으며 인증 파일·토큰·사용자 설정은 읽거나 변경하지 않았다.
- 소스·workflow·브랜치 규칙·Git 이력을 변경하지 않았다. 검사 재실행·새 서버·빌드·커밋·푸시·병합·되돌리기도 수행하지 않았다.
- 이번 변경 파일은 이 기록과 [작업 기록 목록](README.md)이다. 로컬 상태는 기록 작성 전 clean이었으며 backend 브랜치 HEAD는 1d6d8c4였다.
- `git diff --check`와 새 기록의 상대 링크를 확인했다. 새로운 애플리케이션 테스트를 실행하지 않았으며 기존 결과를 재실행 결과로 표시하지 않는다.

## 한국어 커밋 메시지

```text
PR 병합 및 GitHub 검사 상태 확인 기록
```
