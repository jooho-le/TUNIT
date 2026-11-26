# Figma용 HTML 최신 상태 확인 — 2026-11-27

## 요청

이전에 만든 Figma 편집용 단일 HTML이 최신인지 확인하고, 있으면 경로/파일명을 안내한다. 없거나 오래됐으면 현재 코드로 만든다.

## 결과와 파일

- 기준은 `dev`의 `e8560e6`이며 작업 시작 시 작업 트리는 clean이었다.
- 기존 최신 파일이 있다: [showcase.html](../../frontend/design/showcase.html).
- 절대 경로: `/Users/leejooho/Desktop/TUNIT/frontend/design/showcase.html`.
- 현재 소스로 내보내기를 다시 실행한 결과 HTML·화면 목록의 SHA-256이 실행 전과 정확히 같았다. 기존 결과물이 현재 코드와 일치하므로 별도 중복 HTML을 만들지 않았다.
- S01~S27을 포함49개 상태, 스플래시4컷(S01-A/A2/A3/A4)과 연결 해제 확인(S20-B)이 포함돼 있다. 파일 크기는20,830,389바이트다.
- HTML을 열어 상단 `Figma용 HTML 저장`을 누르면 보기 도구/축소 설정을 제거한 `tunit-figma.html`을 다운로드한다. 이는 기존 폴더에 별도로 저장된 파일명이 아니라 내보내기 버튼의 다운로드 파일명이다. 반입 절차는 [디자인 보드 안내](../../frontend/design/README.md)를 따른다.

## 실제 검증

- `node frontend/design/generate.mjs`: 2파일/3개 검사 PASS. 개발·프리뷰·백엔드 서버를 시작하지 않는다.
- 표준 HTML 파서로 실제 프레임49개를 세고 screens.json49개 및 위 필수 상태를 확인했다. 초기 보조 정규식 확인은 실패해 HTML 파서로 정정했으며 내보내기 검사 자체는 통과했다.
- Figma용 저장 버튼과 다운로드 파일명 코드를 확인했다.
- HTML SHA-256: `b7a0cfbecb6ddd4512203bc4ead1c28dfa1d7caf8ce0d790f033c1560bd97d68`.
- screens.json SHA-256: `ad63edeeeacf119912c06d98e74ce7071401a7fa3f727b6502b8d5fe423981e0`.
- 실제 Figma 반입·변환 후 편집·브라우저 다운로드 완료는 이번 작업에서 실행하지 않았다. HTML의 입력/계정/인물은 디자인용 fixture이며 실제 서버 데이터가 아니다.

## 변경 범위

기존 HTML·목록·앱 코드는 변경하지 않았다. 이 확인 기록과 [작업 기록 목록](README.md)만 작성/수정했다. 서버 실행·Git 브랜치 전환·커밋·푸시·Notion 수정은 하지 않았다.

## 한국어 커밋 메시지

```text
docs: 피그마용 전체 화면 HTML 최신 상태 확인
```
