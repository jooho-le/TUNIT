# 스플래시 누락 여부 확인 — 2026-11-27

## 요청

이전에 만든 스플래시 화면이 사라진 것 같다는 요청에 따라 코드와 Git 이력을 확인한다. 이번 작업은 확인 범위이며 복원·병합·서버 실행은 진행하지 않는다.

## 확인 결과

- 시작 시 작업 트리는 clean, 현재 브랜치는 `feature/notion-p0-20261127`, HEAD는 `a3a9446`이다.
- 원본은 `frontend` 브랜치의 `e8c52cf`(스플레시 초안), `60bffc3`(스플레시 초안2)에 보존돼 있다. 현재 HEAD에는 두 커밋이 포함되지 않았다.
- `frontend`의 스플래시는 3000ms이며 취향·음악·사람·브랜드의 네 장면을 표시한다. `SplashScenes.tsx`와 앱 Layout의 `splashActive` 상태, 관련 스타일/검사도 해당 브랜치에 있다.
- 현재 브랜치는 `SplashScenes.tsx`와 앱 시작 스플래시가 없고, 랜딩의 기존 `IntroSequence.tsx`와 `INTRO_DURATION=1800`만 있다. `tunit-brand-intro-v2`를 이미 본 탭이나 동작 줄이기 환경에서는 기존 인트로도 생략된다.
- 원인은 백엔드 작업 브랜치를 dev `c69f959`에서 만들 때 별도 frontend 브랜치의 스플래시 커밋을 포함하지 않은 것이다. 원본 스플래시 작업이 Git에서 유실된 상태가 아니다.

## 검증과 미검증

- `git log --oneline HEAD..frontend`에서 위 두 커밋을 확인했다.
- `git merge-base --is-ancestor 60bffc3 HEAD`는 종료 코드1로 미포함을 확인했다.
- `git show frontend:...`로 3000ms·네 장면·앱 시작 연결을 읽고 현재 파일의 1800ms/랜딩 한정 동작과 대조했다.
- 브랜치를 전환하거나 앱 코드를 수정하지 않았다. 서버·브라우저 재현·자동화 테스트는 실행하지 않았다. 이번 확인은 정적 코드/Git 이력 기준이다.
- 복원 시 두 커밋의 관련 변경을 현재 백엔드/HTTP 어댑터 수정과 함께 검토해야 한다. frontend 전체 파일로 덮어쓰면 최신 API·오류 처리·연결 해제 등의 변경을 잃을 수 있으므로 이번 확인에서는 덮어쓰지 않았다.

## 관련 파일

- 현재 `frontend/src/app/App.tsx`, `frontend/src/features/landing/IntroSequence.tsx`, `content.ts`, `motion.ts`는 읽기만 했다.
- `frontend` 브랜치의 같은 파일과 `SplashScenes.tsx`, 스플래시 작업 기록을 Git 객체로 읽었다.
- 이 확인 기록과 [기록 목록](README.md)만 생성·수정했다.

## 한국어 커밋 메시지

```text
docs: 스플래시 누락 원인과 원본 브랜치 보존 상태 기록
```

실제 커밋·푸시·병합·복원은 하지 않았다.
