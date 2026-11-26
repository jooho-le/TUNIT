# pull 이후 미추적 사본 표시 원인 확인 — 2026-11-27

## 요청과 범위

Git pull 후 VS Code 소스 제어에165개 변경과 `settings 2.json`, `AuthController 2.java` 같은 파일이 표시되는 이유를 확인한다. 원인 확인 범위이며 파일 삭제/이동·Git 정리/커밋·사용자 동기화 설정 변경은 수행하지 않는다.

## 확인 결과

- 현재 dev와 origin/dev는 모두11e0aa7(파일정리)이다. `git rev-list --left-right --count HEAD...origin/dev` 결과0/0, 미해결 Git 병합 파일은 없다.
- 확인 시점165개는 미추적164개와 수정1개였다.
- 이름에 ` 2`가 붙은 미추적 사본163개 모두 각각 대응하는 정상 파일이 Git에 추적되고 있다. ` 2` 사본 자체는 Git 추적 목록에 없다.
- 나머지2개는 앞선 Notion 상태 정리에서 작성한 실제 작업 기록이다: docs/work-log/README.md 수정과2026-11-27-notion-task-status-review.md 신규 파일.
- VS Code의 U는 untracked(미추적), dev*는 작업 트리에 변경이 있다는 뜻이다. pull은 원격 커밋을 반영하지만 이런 로컬 미추적 파일과 미커밋 기록을 자동 삭제하지 않는다.
- 사본의 이름/원본 대응 관계를 확인했다. 파일을 만든 프로그램은 확인되지 않았으므로 특정 동기화 서비스나 Git 자체의 생성으로 단정하지 않는다. core.hooksPath 설정과 활성 로컬 Git hook도 확인되지 않았다.

## 내용 비교와 한계

- 최초 Python 전체 읽기 비교가 파일 읽기에서 오래 대기해 직접 중단했다. 지속 실행 작업을 남기지 않았다.
- 시간 제한을 둔 cmp 검사(파일당1초·최대4개 동시·163개 유한 목록)로 바꿔 비교했다.
- **동일139개 / 내용 다름7개 / 시간 제한으로 미확인17개**다. 이름만 보고 전부 같은 파일로 취급하지 않는다.
- 대표 설정/Gradle 실행기/AuthController/V1 SQL 사본4개는 원본과 동일했다.
- 내용이 다르거나 미확인인 파일은 아래와 같다.

| 사본 | 비교 결과 |
| --- | --- |
| `docs/notion-p0-implementation-review 2.md` | 내용 다름 |
| `frontend/design/README 2.md` | 내용 다름 |
| `frontend/design/atlas 2.css` | 읽기 시간 제한·미확인 |
| `frontend/design/export.test 2.tsx` | 내용 다름 |
| `frontend/design/font-sources 2.json` | 읽기 시간 제한·미확인 |
| `frontend/design/fonts 2.css` | 읽기 시간 제한·미확인 |
| `frontend/design/generate 2.mjs` | 읽기 시간 제한·미확인 |
| `frontend/design/prepare-fonts 2.mjs` | 읽기 시간 제한·미확인 |
| `frontend/design/screens 2.json` | 내용 다름 |
| `frontend/design/showcase 2.html` | 내용 다름 |
| `frontend/design/template 2.ts` | 내용 다름 |
| `frontend/design/viewer 2.js` | 읽기 시간 제한·미확인 |
| `frontend/design/viewer.test 2.js` | 읽기 시간 제한·미확인 |
| `frontend/design/vitest.config 2.ts` | 읽기 시간 제한·미확인 |
| `frontend/src/api/generated 2.ts` | 읽기 시간 제한·미확인 |
| `frontend/src/api/http.test 2.ts` | 읽기 시간 제한·미확인 |
| `frontend/src/components/shell/EditorialHeader 2.tsx` | 읽기 시간 제한·미확인 |
| `frontend/src/components/shell/EditorialReel 2.tsx` | 읽기 시간 제한·미확인 |
| `frontend/src/components/shell/EditorialShell.test 2.tsx` | 내용 다름 |
| `frontend/src/features/auth/AuthHttp.test 2.tsx` | 읽기 시간 제한·미확인 |
| `frontend/src/features/interests/Connections.test 2.tsx` | 읽기 시간 제한·미확인 |
| `frontend/src/features/interests/InterestCompose.test 2.tsx` | 읽기 시간 제한·미확인 |
| `frontend/src/styles/editorial 2.css` | 읽기 시간 제한·미확인 |
| `frontend/src/styles/readability 2.css` | 읽기 시간 제한·미확인 |

중복 Java 소스와 Flyway V1/V2 SQL도 포함돼 있다. 전체 커밋 대상으로 처리하지 말고, 정리할 때는 먼저 백업한 뒤 동일 사본·다른 내용·미확인 파일과 실제 작업 기록을 구분해야 한다. 이번에는 삭제/격리하지 않았다.

## 검증 및 변경 파일

- Git 상태/추적 파일·원본 대응163개·0/0 커밋 차이·미해결 병합0개를 확인했다.
- 개발/프리뷰/Spring 서버·빌드/DB/테스트는 실행하지 않았다. Notion·인증·Git ignore·동기화 설정을 바꾸지 않았다.
- 이 진단 기록과 [작업 기록 목록](README.md)만 신규/수정했다. 기존165개 변경을 보존했으며 이 진단 기록 추가로 소스 제어 개수는1개 늘 수 있다.
- 비교 목록과 결과는 저장소 밖 임시 디렉터리에 보관했다. 파일 내용이나 비밀값을 기록/출력하지 않았다.

## 한국어 커밋 메시지

```text
docs: pull 이후 미추적 중복 사본과 실제 변경 구분 기록
```

실제 커밋·푸시·Git 정리 명령은 실행하지 않았다.
