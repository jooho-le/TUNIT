# 여러 화면이 이어지는 4컷 스플래시

작업일: 2026-11-23(KST)

## 요청과 기준

기존 스플래시가 단순하고 특색이 부족하므로 여러 화면이 보이는 구성으로 개선한다. 시작 시 `frontend` 브랜치·HEAD `e8c52cf`였고 Git 작업 트리는 clean이었다. 전체 길이 약 3초, Freshman 타이포그래피, 기존 세 색상 `#FFF21A`·`#171717`·`#A66BFF`를 유지한다.

## 변경 내용

| 구간 | 화면 | 연출 |
| --- | --- | --- |
| 0~660ms | 취향 프로필 | 노란 캔버스, `Taste yourself.`, 취향 창·음악 창·스티커 |
| 660~1320ms | 음악 탐색 | 보라 캔버스, `Find your next.`, 레코드 아트·미니 플레이어 |
| 1320~2040ms | 새로운 연결 | 다크 캔버스, `New people.`, Music Twin 창·두 취향 아이콘 |
| 2040~3000ms | 브랜드 | 세 창이 배경에 모이고 노란 `Tunit.`·보라 점으로 마무리 |

- 기울어진 인터페이스 창이 겹쳐 들어오고 큰 제목과 짧은 설명이 컷마다 바뀐다. CSS의 이동·크기·문자 등장 애니메이션을 사용하며 프레임마다 실행되는 JS 루프나 새 의존성은 추가하지 않았다.
- 창은 장식용 화면 미리보기다. 실제 사용자·추천 수·궁합 점수·음악 데이터를 요청하거나 생성하지 않는다. 비활성 컷은 `hidden`으로 숨기고 장식 영역 전체는 접근성 트리에서 제외한다.
- 건너뛰기·Escape·바로 시작하기·3초 종료·동작 줄이기·원래 경로 유지·내부 이동 시 반복하지 않는 기존 동작을 보존했다. 중간 종료 시 남은 장면 타이머도 정리한다.
- 모바일에서는 제목 위/창 아래로 배치하고 창 크기·스티커·글자 크기를 조정했다. 낮은 화면 높이에는 별도 축소 규칙을 적용했다.
- 디자인 HTML에는 네 컷을 독립된 정지 프레임으로 추가했다. S01~S27은 유지하며 상태 수는 45개에서 48개, 첫 흐름은 8개에서 11개로 바뀌었다. 실제 컴포넌트의 복제본에서 장면만 선택하므로 제품용 디버그 경로·재생 설정은 추가하지 않았다.
- 디자인 기준·화면 지도·검증 문서·보드 안내를 현재 결과에 맞췄다. 이전 스플래시 작업 기록은 이력으로 보존했다.

## 관련 파일

| 파일 | 변경 |
| --- | --- |
| [SplashScenes.tsx](../../frontend/src/features/landing/SplashScenes.tsx) | 새 4컷·취향/음악/연결 창·브랜드 마무리 |
| [IntroSequence.tsx](../../frontend/src/features/landing/IntroSequence.tsx) | 컷 상태·전환 타이머·정리 |
| [content.ts](../../frontend/src/features/landing/content.ts) | 컷 순서·전환 시점·타입 |
| [landing.css](../../frontend/src/styles/landing.css) | 장면별 캔버스·창·타이포·등장 모션·반응형 |
| [IntroSequence.test.tsx](../../frontend/src/features/landing/IntroSequence.test.tsx) | 컷 전환 경계 추가, 중간 해제 시 타이머 정리 보강 |
| [export.test.tsx](../../frontend/design/export.test.tsx) · [template.ts](../../frontend/design/template.ts) | 4컷 추출·단일 장면 검사·보드 설명 |
| [showcase.html](../../frontend/design/showcase.html) · [screens.json](../../frontend/design/screens.json) | 재생성한 48개 상태 |
| [디자인 보드 안내](../../frontend/design/README.md) | 4컷·상태 수·검수 범위 |
| [DESIGN.md](../../DESIGN.md) · [문서 안내](../README.md) · [화면 지도](../screens.md) · [검증 기록](../test-results.md) | 현재 동작·검증 |
| [작업 기록 목록](README.md) · 이 파일 | 요청·결과·커밋 메시지 |

## 실제 검증 결과

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| `npm test` | **56/56 PASS**, 7개 파일 | 기존 흐름·스플래시·메뉴·접근성·스크롤 |
| 스플래시 전용 검사 | **11/11 PASS** | 659/660·1319/1320·2039/2040ms 전환, 2999/3000ms 종료·StrictMode·건너뛰기·깊은 링크·저장값 보존·재생 범위·중간 해제 정리 |
| `npm run build` | **PASS** | TypeScript strict·Vite 프로덕션 빌드 |
| `node frontend/design/generate.mjs` | **1/1 PASS** | 48개 프레임·S01~S27·컷별 장면·CSS 구문·독립 자산·ID/필터 참조 |
| 내보내기 포함 TypeScript | **PASS** | 임시 tsconfig에서 앱 src·내보내기 검사·템플릿 검사 |
| Chrome 정지 외형 | **확인** | 로컬 보드의 1440×1000 네 컷, 동일 마크업/CSS로 만든 390×844 임시 정지 미리보기 |
| React 검토 | **확인** | 장면 컴포넌트 분리·타이머/리스너 정리·접근성·새 라이브러리 없음 |
| 변경 범위·공백·문서 링크 | **PASS** | 기존 파일 해시 비교·`git diff --check`·수정 Markdown의 로컬 링크 검사 |

내보내기 TypeScript 검사는 처음에 `/private/tmp`의 설정이 저장소의 Node 타입을 찾지 못해 실패했다. 임시 설정의 `typeRoots`를 설치된 저장소 타입 경로로 지정한 뒤 재실행해 통과했다. 프로젝트 설정·패키지는 변경하지 않았다.

이번 Chrome 확인은 **정지 장면 배치** 검수다. 컷 전환·자동 종료·라우팅은 jsdom 검사로 확인했으며, 실제 브라우저의 모션 타이밍 실측·저사양 성능·모바일 실기기/터치·Figma 반입은 미검증이다. 임시 390×844 HTML은 검수 자료이며 제품에 포함하지 않는다. 서버·DB 통합 검사를 수행한 결과가 아니다.

검사 로그는 `/private/tmp/tunit-splash-sequence-test.log`, `tunit-splash-sequence-build.log`, `tunit-splash-sequence-design.log`, `tunit-splash-sequence-types.log`다. 작업 전 해시·HEAD·디자인/보드 사본은 `/private/tmp/tunit-splash-sequence-cn7et_zp/`에 보관했다. 임시 파일·빌드 산출물은 커밋 대상이 아니다.

## 작업 경계와 커밋 메시지

서버를 새로 실행하거나 재시작하지 않았다. 백엔드·인증·API·공통 팔레트 토큰·의존성·Notion·기존 계정/세션 데이터·브랜치를 변경하지 않았다. 커밋·푸시·병합·배포는 수행하지 않았다.

```text
feat: 취향·음악·연결 화면의 4컷 스플래시 구현
```
