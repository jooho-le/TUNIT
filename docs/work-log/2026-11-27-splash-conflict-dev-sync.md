# 스플래시 충돌 해결·dev 동기화 — 2026-11-27

## 요청과 승인

스플래시가 빠진 상태를 해결하고 로컬을 원격 dev와 동일하게 맞추며 현재 브랜치도 dev로 전환한다. PR #4는 frontend→dev이고 문서/생성 HTML6개 파일에 충돌이 있었다.

최초 자동 승인 검토가 frontend에 origin/dev를 병합하는 명령을 병합 권한 부족으로 거절했으며 그 명령은 실행되지 않았다. 허용된 로컬 dev fast-forward/전환부터 수행하고 기존 확인 기록을 stash에 보존했다. 이후 사용자가 **“충돌 해결·푸시·dev 병합 승인”**으로 최신 dev→frontend 통합·해결 커밋/푸시·테스트 후 PR #4→dev 병합을 명시 승인했다. main은 수정하지 않는다.

## 보존과 통합

- 시작 브랜치 feature/notion-p0-20261127/HEAD a3a9446, 원격 dev a3a9446, frontend60bffc3. 로컬 dev는 ada7ec1에서 뒤처져 있어 a3a9446으로 fast-forward했다.
- 기존 미커밋 docs/work-log/README.md의 확인 기록 링크와 2026-11-27-splash-branch-check.md를 임시 스냅샷 및 stash로 보존했다. 이번 통합 코드에 해당 기록을 원문으로 되살렸으며 stash는 추가 보관한다.
- frontend의 e8c52cf/60bffc3 스플래시와 dev의 최신 백엔드/HTTP/P0 코드를 병합했다. 이력 재작성·force push·브랜치 삭제·worktree 생성은 하지 않는다.
- 충돌6개: docs/README.md, docs/screens.md, docs/test-results.md, docs/work-log/README.md, frontend/design/README.md, frontend/design/showcase.html.
- 문서는 최신 API/검증 범위와3초4컷 스플래시를 함께 설명하도록 통합했다. 두 브랜치의 작업 기록/검증 이력과 기존 문서 링크를 보존했다.
- 생성 HTML은 한쪽 결과를 선택하지 않고 현재 통합된 React 소스에서 다시 생성했다. S01~S27/스플래시4컷/연결 해제 확인을 포함49개 상태다.
- 스플래시는 앱 시작/새로고침에3000ms·취향→음악→사람→브랜드4컷을 표시한다. 건너뛰기/Escape/CTA·원래 경로/초대 복귀·동작 줄이기·타이머/스크롤 정리·기존 계정 보존을 유지한다.
- 기존3색과 디자인 방향을 유지했다. backend/contracts/frontend API162개 파일은 dev와 바이트 단위로 동일함을 확인했다.

## 실제 검증

| 검사 | 결과 |
| --- | --- |
| npm test | 71/71 PASS, 11파일 |
| npm run build | PASS |
| node frontend/design/generate.mjs | 3/3 PASS, 49상태 |
| 디자인 TypeScript | PASS |
| node contracts/generate-types.mjs --check | PASS |
| dev의 backend/contracts/frontend API 비교 | 162개 동일 |
| origin/dev 대비 git diff --check | PASS |
| 변경 Markdown 상대 링크 | 143개/누락0 |
| 이전 미커밋 확인 기록 원문 대조 | 바이트 단위 동일 |

위는 충돌 해결 커밋 전 실제 실행 결과다. frontend 부모 기준 전체 staged 검사는 dev에서 가져온 기존 gradlew.bat의 CRLF/일부 빈 줄을 경고했으므로, 이번 변경 자체는 origin/dev 대비 diff --check로 확인했고 기존 서버/래퍼 포맷을 임의 변경하지 않았다. 백엔드 자체를 수정하지 않았으므로 기존72 PASS 기록을 보존하고 이번에는 PostgreSQL 검사를 재실행하지 않았다. 상시 프론트/프리뷰/Spring 서버·실제 브라우저/Figma/JCloud·운영 DB를 실행/수정하지 않았다. Notion도 이번 작업에서는 수정하지 않았다.

## Git 반영과 최종 확인 절차

이 기록은 해결 커밋에 포함한다. 검증된 해결 코드를 frontend에 정상 push하고 GitHub 검사를 확인한 뒤 [PR #4](https://github.com/jooho-le/TUNIT/pull/4)를 dev에 merge한다. 원격 작업 결과/최종SHA는 PR과 최종 응답에서 확인한다. 이후 로컬을 dev로 전환하고 origin/dev로 fast-forward한다.

최종 확인은 현재 브랜치 dev, HEAD=dev=origin/dev, 추적 파일 차이0·작업 트리clean, 원본 스플래시 커밋 포함, main/origin/main이 시작7b69769 그대로인지를 검사한다. 기존 확인 기록은 통합한 상태로 보존하고 안전용 stash도 남긴다.

## 관련 파일

- 위6개 충돌 파일과 frontend/design/screens.json 재생성.
- docs/architecture.md·docs/development.md의 앱 시작/이전 저장 표시 설명 갱신.
- 기존 스플래시 누락 확인 기록 복원·작업 기록 목록 통합·이 기록 신규 작성.
- 두 부모에서 자동 병합된 코드의 전체 검증, 서버/API 파일 보존 확인. 원격 dev 대비 실제 코드 차이는 Git PR에서 확인한다.

## 한국어 커밋 메시지

```text
merge: 최신 dev와 4컷 스플래시 변경 충돌 해결
```

원격 PR 병합 메시지:

```text
merge: 4컷 스플래시와 최신 P0 구현을 dev에 통합
```
