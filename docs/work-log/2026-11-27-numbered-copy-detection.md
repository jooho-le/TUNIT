# 번호 사본 재발 감지 추가 — 2026-11-27

## 요청과 선택

`파일명 2.java` 같은 사본이 앞으로 계속 나타나지 않도록 할 수 있는지 요청했다. 위치 변경/사본 백업 전환과 현 위치 감지 추가 중 사용자가 **“현재 위치 유지·재발 감지만 추가”**를 선택했다. 이에 프로젝트/기존163개 사본을 옮기거나 삭제하지 않고, 실행 전 파일명 검사만 추가했다.

## 구현

- scripts/check-numbered-copies.mjs: Git에 등록된 원본이 있는 폴더의 이름만 조회한다. 같은 폴더의 `Controller 2.java`·`README 3.md`·`gradlew 2` 같은 숫자2이상 접미사 후보를 찾는다. 파일 내용 비교/수정·이동/삭제·Git stage/commit은 하지 않는다.
- 원본이 Git에 등록되어 있고 실제 존재하는 소스/설정/문서에 한정한다. 일반 숫자 이름·대응 원본 없는 파일·이미지 변형을 무조건 금지하지 않는다. Git ignore로 숨겨진 소스 사본도 검사한다. node_modules/build/.preview를 통째로 재귀 순회하지 않는다.
- 루트 명령 `npm run check:copies`, 전체 JSON 목록 `npm run check:copies -- --json`, 검사기 테스트 `npm run test:copies`를 추가했다.
- frontend의 predev/pretest/prebuild에 연결했다. 루트 명령과 frontend 직접 실행 모두 앱 도구 시작 전에 검사하며 사본 발견 시 종료1로 중단한다. 개발 서버를 이번 작업에서 실행한 것은 아니다. test:watch/preview·Gradle 직접 실행에는 별도 훅을 강제로 추가하지 않았다.
- CI 기존 Node/npm 설정은 유지하고 검사기 테스트 단계를 추가했다. 기존 npm test/build는 해당 사전 검사를 자동 수행한다. 로컬 Git 훅을 설치하거나 커밋 자체를 차단하지는 않으므로 커밋 전 수동 검사도 안내했다.
- 사용자 선택에 따라 `.gitignore`로 사본을 감추거나 VS Code 미추적 표시를 숨기지 않았다. Git 설정·프로젝트 위치·계정/동기화·인증/비밀값·기존 앱 디자인과 업무 API는 바꾸지 않았다.
- 수정 전 package.json/frontend package/CI/development 문서는 저장소 밖 임시 백업에 보존했다. 기존 script 명령·의존성·package metadata가 유지됨을 대조했다.

## 실제 검증 결과

| 검사 | 결과 |
| --- | --- |
| npm run test:copies | **7 PASS / FAIL0 / SKIP0** |
| 현재 npm run check:copies -- --json | **종료1,163개 감지** — 예상한 차단 동작 |
| npm test | **종료1,163개 감지**, Vitest 실행 전 중단 |
| npm run build | **종료1,163개 감지**, TypeScript/Vite 실행 전 중단 |
| npm run predev --workspace tunit | **종료1,163개 감지**, 실제 dev 명령/서버 미실행 |
| 기존 package script/의존성/metadata 비교 | PASS, 기존 값 유지 |
| Git HEAD/브랜치·ignore 규칙 | 11e0aa7/dev·변경 없음 |
| 기존 사본 목록 |163개 경로 보존 |

테스트는 실제 임시 Git index를 사용해 미추적/추적·staged 사본, ignore로 가려진 SQL, 정상 파일명/이미지, Unicode/확장자 없는 wrapper, 사라진 원본, 잘못된 Git root를 확인한다. 서로 다른 사본 내용이 검사 후에도 남는 것을 검증했다. 임시 fixture는 종료 후 삭제하며 실제 저장소에 commit/push하지 않는다.

현재 사본이 남아 있으므로 앱 테스트/빌드 전체가 성공했다고 보고하지 않는다. 이번에 구현한 검사기7개와 사전 차단3개만 검증했다. CI는 로컬 파일을 수정한 단계이며 원격에 반영/실행하지 않았다. 기존71개 앱 테스트/백엔드72개를 이번에 재실행한 결과로 표현하지 않는다.

## 한계와 원인 조사

이 변경은 **감지/실행 전 차단**이며 파일 생성이나 VS Code 소스 제어 표시 자체를 막는 기능이 아니다. 기존163개 사본은 그대로 나타난다. 사본 생성 프로그램을 확정하지 못했으므로 앞으로 파일이 절대 생기지 않는다고 보장하지 않는다. 원본이 Git에 아직 등록되지 않은 경우·대응 원본 없는 번호 파일·바이너리 이미지 변형은 검사 범위 밖이다.

Desktop에서 com.apple.file-provider-domain-id·com.apple.fileprovider.detached#B 등 메타데이터를 확인했지만 서비스의 현재 활성 여부나 사본 생성 원인을 단정하지 않았다. [Apple 공식 안내](https://support.apple.com/en-us/109344)는 Desktop/Documents의 iCloud 동기화 동작을 설명한다. 이번 작업은 사용자 선택에 따라 폴더 이동·iCloud/다른 동기화 설정 변경·자동 삭제·상시 감시를 하지 않았다.

## 생성·수정 파일

- [검사기](../../scripts/check-numbered-copies.mjs), [검사기 테스트](../../scripts/check-numbered-copies.test.mjs) 신규 작성.
- [루트 npm 명령](../../package.json), [프론트 사전 검사](../../frontend/package.json), [CI](../../.github/workflows/checks.yml) 추가.
- [개발 가이드](../development.md)에 사용법/범위/현재 차단/수동 검사 안내.
- 이 작업 기록·[작업 기록 목록](README.md) 갱신. 앞선 Notion/진단 기록·사용자 사본은 보존했다.

## 한국어 커밋 메시지

```text
chore: 번호 사본 재발 감지와 실행 전 검사 추가
```

실제 커밋·푸시·병합·배포·Notion 수정·서버 실행은 하지 않았다.
