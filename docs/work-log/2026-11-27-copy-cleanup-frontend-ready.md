# 사본 백업 분리·실제 변경 보존·frontend 개발 준비 — 2026-11-27

## 요청과 승인 범위

사본 정리/실제 변경 보존 → 최신 dev 반영 frontend → 검사·테스트·빌드 → 선택 커밋/푸시 → frontend→dev PR 흐름을 안내한 뒤 사용자가 “진행해”라고 승인했다. 프론트의 새 제품 기능을 임의로 만들지 않고 기존 준비 작업을 완료한다. main은 변경하지 않고 상시 서버를 시작하지 않는다.

## 사본과 작업 보존

- 시작은 dev11e0aa7이며 origin/dev와 같았다. 원격을 fetch해 최신 상태를 확인했다.
- 미추적 번호 사본163개와 실제 수정5개·신규5개(감지 스크립트/테스트 및 이전 작업 기록)를 구분했다.
- 번호 사본은 대응 원본이 Git에 등록됐고 실제 존재하는 일반 파일인지 재확인했다. 내용을 덮어쓰거나 삭제하지 않고 아래 기존 Git 제외 폴더로 같은 파일을 rename했다.

```text
.preview/numbered-copies-2026-11-27-mkthkxfm
```

- files/ 아래에163개 원래 상대경로를 보존한다. inode/device/size가 이동 전후 같은지 확인했다. 내용이 다른7개·이전 읽기 미확인17개도 포함해 전부 보관한다. 과거 비교139동일/7상이/17미확인은 prior-comparison.json의 당시 결과이며 이번에 임의 병합하지 않았다.
- manifest.json에 원래 경로·대응 원본·이동 여부와 메타데이터를 저장했다. pending-work.patch와 pending-work/에 기존 미커밋 실제 변경도 별도 보관했다. 백업/로그는 Git에 올리지 않는다.
- .preview/는 기존부터 Git 제외됐고 소스 경로 밖이므로 Java/SQL/프론트 입력에 사본이 섞이지 않는다. 새 ignore 규칙이나 전역 동기화 설정을 추가하지 않았다. 검사기는 재발 사본을 다시 찾는다.

## 실제 변경 정리

- 최신 dev에서 chore/numbered-copy-cleanup 작업 브랜치를 만들고 기존 감지 코드/설정·Notion 상태/사본 진단/감지 작업 기록을 보존했다.
- scripts/check-numbered-copies.mjs와 테스트, npm 명령/프론트 사전 검사, CI 단계를 선택 커밋한다. 전체 git add .·force push·reset --hard·clean -fd를 사용하지 않는다.
- 개발 가이드의 “기존 사본으로 현재 실행 차단” 설명을 현재 백업/검사 통과 상태로 갱신하고 최신 실제 검증을 기록했다.
- 앱 디자인/React 업무 기능·백엔드 업무 코드·V1/V2 SQL을 임의 변경하지 않았다. 최신 Figma용 HTML49상태도 기존 파일과 해시가 같다.

## 실제 검증

| 검사 | 결과 |
| --- | --- |
| 사본 분리/원본 대응·메타데이터/백업 제외 |163개 보존·작업 소스 사본0·PASS |
| npm run check:copies | PASS, 후보0 |
| npm run test:copies |7 PASS |
| npm test |71 PASS, 11파일 |
| npm run build | PASS |
| 디자인 보드 생성 |3 PASS, 49상태·기존 해시 동일 |
| Gradle clean | PASS, 생성물만 정리 |
| 임시 PostgreSQL test-postgres.sh |72 PASS, FAIL0/ERROR0/SKIP0·bootJar PASS |
| node contracts/generate-types.mjs --check | PASS |

임시 SCRAM DB만 생성했고 검증 후 종료/삭제했다. 예전 중복 XML까지 포함한 합산을 피하고 새8개 suite의72개만 집계했다. 상시 개발/프리뷰/Spring 서버·실제 개발 DB·JCloud·Figma 반입은 실행하지 않았다.

## Git 반영·최종 브랜치

이 기록을 포함한 별도 정리 커밋을 만든 뒤 frontend가 그 커밋을 fast-forward로 포함하도록 한다. frontend를 정상 push해 dev 대상 PR을 만들고 GitHub 검사 성공을 확인한 뒤 병합한다. 이후 로컬 dev와 frontend를 원격 dev의 통합 결과로 fast-forward하고 frontend도 정상 push해 다음 작업을 frontend에서 시작할 수 있게 한다. main과 기존 stash/브랜치는 보존한다.

이 기록은 커밋 전 검증 결과/승인 절차를 담는다. 원격 PR 번호·병합 결과·최종 SHA와 작업 트리 clean 확인은 PR/Git 로그 및 최종 응답에서 확인한다. 사본 원인 프로그램은 여전히 미확정이며 사본이 절대 재발하지 않는다고 표현하지 않는다.

## 관련 파일

- scripts/check-numbered-copies.mjs·check-numbered-copies.test.mjs
- package.json·frontend/package.json·.github/workflows/checks.yml
- docs/development.md·docs/test-results.md·docs/work-log/README.md
- 앞선 미커밋 Notion 상태/사본 진단/재발 감지 기록3개와 이 기록
- 백업은 위 .preview/ 경로에만 보관하며 커밋 파일에 포함하지 않는다.

## 한국어 커밋 메시지

```text
chore: 번호 사본 격리와 재발 감지 설정 정리
```

PR 병합 메시지:

```text
merge: 번호 사본 감지와 개발 준비 변경을 dev에 통합
```
