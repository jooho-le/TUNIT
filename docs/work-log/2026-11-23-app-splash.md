# 3초 전체 화면 스플래시

작업일: 2026-11-23(KST)

## 요청과 확인

약 3초간 표시되는 스플래시 화면을 추가한다. 작업 전 Git 상태는 clean인 `frontend` 브랜치였고 HEAD는 `363fade`였다. 현재 DESIGN.md의 Freshman 방향과 기존 세 색상 `#FFF21A`, `#171717`, `#A66BFF`를 유지한다.

기존 인트로는 랜딩 콘텐츠 영역에서 1.8초간 재생되고 탭의 `tunit-brand-intro-v2` 표시가 있으면 생략됐다. 앱 시작 전체 화면으로 옮기고 재생 여부를 앱 인스턴스의 상태로 관리하도록 변경했다.

## 변경 내용

- 앱을 열거나 새로고침하면 약 3초 동안 노란 Tunit. 워드마크·보라색 궤도·짧은 문구와 재생 바를 표시한다. 바는 장식용 재생 표시이며 실제 API 다운로드 비율을 의미하지 않는다.
- 헤더·메뉴·하단 릴과 본문은 스플래시 종료 후 표시한다. 기존 세션 확인은 백그라운드에서 계속 진행되며 서버 응답을 기다려 스플래시 시간을 늘리지 않는다.
- 3000ms 후 처음 요청한 경로를 표시한다. 내부 경로 이동에서는 반복하지 않는다. 로그인·초대의 복귀 쿼리도 보존한다.
- 건너뛰기·Escape·내 취향 찾기로 즉시 종료할 수 있다. 종료 후 본문에 초점을 옮기고 이전 body 스크롤 설정을 복구한다.
- 동작 줄이기 설정이면 시작부터 생략한다. 재생 도중 설정을 켜도 즉시 종료한다. 저속 화면 갱신 환경에서는 CSS 모션을 줄인다.
- 저장소를 이용해 표시 여부를 결정하거나 기존 계정·취향·인트로 표시를 지우지 않는다.
- 기존 랜딩 인트로의 중복 타이머·저장 표시 코드를 제거했다. 관련 테스트는 앱 시작 동작으로 옮기고 랜딩 본문·메뉴·챕터 테스트를 유지했다.
- 디자인 보드 S01-A를 ‘3초 스플래시’ 정지 장면으로 갱신했다. 45개 상태를 유지하며 HTML·목록을 다시 생성했다. 정적인 HTML 보드에서 3초 자동 전환을 실행하는 것은 아니다.
- DESIGN.md·화면 지도·검증 기록·디자인 보드 안내를 현재 동작에 맞췄다.

## 검증 결과

| 검사 | 결과 | 확인한 것 |
| --- | --- | --- |
| `npm test` | **55/55 PASS**, 7개 파일 | API/로컬 흐름·라우팅·랜드/메뉴·스크롤 및 스플래시 |
| 스플래시 전용 검사 | **10/10 PASS** | 2999/3000ms 경계·StrictMode·자동 종료·깊은 링크·즉시 시작·건너뛰기·Escape·저장값·재생 범위·리소스 정리 |
| `npm run build` | **PASS** | TypeScript strict·Vite 프로덕션 빌드 |
| `node frontend/design/generate.mjs` | **1/1 PASS** | 45개 프레임·S01~S27·스플래시 정지 장면·자산·CSS 구문 등 기존 내보내기 검사 |
| Chrome 외형 확인 | **확인** | 기존에 켜져 있던 TUNIT 서버를 새 탭에서 열어 전체 화면·노란 워드마크·보라 궤도·건너뛰기·시작 링크를 관찰 |
| React 검토 | **확인** | 안정적인 완료 콜백·단일 타이머·이벤트/스크롤 정리·키보드 초점·동작 줄이기·새 의존성 없음 |
| 문서/범위 검사 | **PASS** | Markdown 상대 링크·공백·백엔드/환경 설정/패키지 보존 |

3초 자동 종료와 이동/저장값 보존은 jsdom 자동화 검사로 확인했다. Chrome 외형 확인 도중 사용자가 탭을 전환해, 자동 종료 후 랜딩 전환을 브라우저에서 이어서 직접 관찰하지는 못했다. 모바일 실기기·터치·전체 화면 시각 회귀·Figma 반입은 미검증이다. 내보내기 전용 TypeScript 검사는 이번에 별도로 재실행하지 않았다.

검사 로그는 `/private/tmp/tunit-splash-final-test.log`, `/private/tmp/tunit-splash-build.log`, `/private/tmp/tunit-splash-design.log`다. 작업 전 파일 해시와 디자인/보드 사본은 `/private/tmp/tunit-splash-0v6pzlf3/`에 보관했다. 임시 기록과 빌드 산출물은 커밋 대상이 아니다.

## 관련 파일

| 파일 | 역할 |
| --- | --- |
| [App.tsx](../../frontend/src/app/App.tsx) | 앱 시작 스플래시 상태·경로 유지·종료 후 본문 초점 |
| [IntroSequence.tsx](../../frontend/src/features/landing/IntroSequence.tsx) | 전체 화면 콘텐츠·3초 타이머·건너뛰기·Escape·스크롤/이벤트 정리 |
| [IntroSequence.test.tsx](../../frontend/src/features/landing/IntroSequence.test.tsx) | 스플래시 전용 10개 검사 |
| [LandingPage.tsx](../../frontend/src/features/landing/LandingPage.tsx) | 기존 랜딩 전용 인트로 제거, 본문 유지 |
| [LandingPage.test.tsx](../../frontend/src/features/landing/LandingPage.test.tsx) | 랜딩 본문·시작 분기·스크롤 검사 |
| [content.ts](../../frontend/src/features/landing/content.ts) | 재생 시간 3000ms |
| [motion.ts](../../frontend/src/features/landing/motion.ts) | 이전 인트로 저장 표시 분기 제거, 스크롤 모션 보존 |
| [EditorialShell.test.tsx](../../frontend/src/components/shell/EditorialShell.test.tsx) | 종료 후 메뉴/챕터 접근 검사 |
| [landing.css](../../frontend/src/styles/landing.css) | 전체 화면·워드마크·궤도·재생 바·반응형·동작 줄이기 |
| [export.test.tsx](../../frontend/design/export.test.tsx) | S01-A 이름 갱신 |
| [showcase.html](../../frontend/design/showcase.html) · [screens.json](../../frontend/design/screens.json) | 재생성한 HTML 보드·화면 목록 |
| [디자인 보드 안내](../../frontend/design/README.md) | 정지 프레임과 앱 동작 구분 |
| [DESIGN.md](../../DESIGN.md) · [문서 안내](../README.md) · [화면 지도](../screens.md) · [검증 기록](../test-results.md) | 최신 동작/검증 정리 |
| [작업 기록 목록](README.md) · 이 파일 | 요청·변경·검증·커밋 메시지 |

## 작업 경계와 커밋 메시지

개발·프리뷰·백엔드 서버를 새로 실행하거나 재시작하지 않았다. 이미 실행 중이던 TUNIT 화면만 확인했다. 백엔드·인증·API 계약·패키지·실제 계정 데이터·Notion을 변경하지 않았다. 브랜치 생성·커밋·푸시·병합·배포도 수행하지 않았다.

```text
3초 전체 화면 스플래시와 자동 전환 추가
```
