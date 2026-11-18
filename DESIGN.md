# TUNIT 디자인 기준

[문서 안내](docs/README.md) · [화면 지도](docs/screens.md) · [이미지 기록](docs/design/hero-art-direction.md)

현재 방향은 사용자가 지정한 [DESIGN3.md](DESIGN3.md)의 Freshman 스타일이다. **초대형 이탤릭 워드마크·평면 구성·얇은 선·각진 컴포넌트·필름 릴 내비게이션**을 랜딩과 기능 화면에 적용한다.

## 색상

| 역할                  | 색상      | CSS 토큰   |
| --------------------- | --------- | ---------- |
| 행동·활성 상태·헤드셋 | `#FFF21A` | `--yellow` |
| 전체 캔버스           | `#171717` | `--canvas` |
| 작은 표식·취향·연결   | `#A66BFF` | `--purple` |

본문·테두리는 기존 중립색을 사용한다. 참고 원본의 빨강·순수 검정으로 주요 색상을 바꾸지 않는다. 색상 블록보다 타이포그래피·여백·얇은 선으로 정보를 구분한다.

## 타이포그래피와 구성

- Hero는 초대형 `Tunit.` 이탤릭 워드마크를 중심으로 구성한다. 헤드셋·보라색 물감은 작은 썸네일에 보존한다.
- 디스플레이 폰트는 공개 대체 글꼴 Cormorant Garamond 300 이탤릭을 사용한다. 시스템 Iowan Old Style·Baskerville·Times New Roman을 fallback으로 둔다.
- 본문은 기존 DM Sans·Noto Sans KR을 유지한다. 원본의 Editorial New 등 유료 글꼴을 설치한 것으로 표시하지 않는다.
- 표면은 평면이며 공통 카드·버튼·태그·입력은 각진 형태와 얇은 테두리로 맞춘다. 기존 추상 음악 아트도 동일한 노랑·보라 계열로 표시한다.
- 레코드·취향 교집합 등 의미가 있는 원형 도형은 사용하되 장식용 입체 그림자·배경 그라데이션은 줄인다.
- 한 장면에는 핵심 메시지 하나를 두고, 큰 제목과 작은 편집 메타데이터의 대비로 위계를 만든다.

## 내비게이션

| 영역              | 동작                                                             |
| ----------------- | ---------------------------------------------------------------- |
| 상단              | 작은 `t.` 글리프·로그인/내 취향·시작 CTA·`+ MENU`                |
| 전체 메뉴         | 큰 이탤릭 화면 목록, Escape 닫기·Tab 초점 순환·닫기 후 초점 복귀 |
| 랜딩 하단 릴      | 취향 분석·Music Twin·음악 발견·친구 비교 챕터로 스크롤 이동      |
| 로그인 후 하단 릴 | Home·Discover·Music·My Taste, 현재 화면 표시                     |
| 가입·온보딩 하단  | 브랜드 복귀와 짧은 편집 문구                                     |

메뉴가 열리면 배경 입력·스크롤을 막고, 닫으면 이전 스크롤 설정을 복구한다. 릴은 큰 화면과 모바일에서 모두 고정하며 본문에 여유 공간을 둔다.

## 랜딩과 모션

인트로는 헤더와 하단 릴을 제외한 **전체 콘텐츠 영역의 타이틀 시퀀스**다. 약 1.8초 후 Hero로 이어지고, 건너뛰기·바로 시작하기를 제공한다. `tunit-brand-intro-v2`로 새 인트로를 탭당 한 번 보여주며 이전 v1 표시와 계정 데이터는 삭제하지 않는다.

스크롤 소개는 취향 분석 → Music Twin → 음악 발견 → 친구 1:1 비교 순서를 유지한다. 챕터 릴을 누르면 인트로를 마치고 해당 장면으로 이동한다. 단일 페이지 hash 라우팅은 바꾸지 않는다.

반복 모션은 화면 밖·백그라운드에서 멈추고 모바일에서는 효과를 줄인다. 동작 줄이기·저속 갱신 환경에서는 정적으로 표시하며 키보드 접근과 기본 스크롤을 유지한다.

## 구현 위치

| 역할                  | 파일                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 색상·기본 기능 스타일 | [global.css](frontend/src/styles/global.css), [flows.css](frontend/src/styles/flows.css)                                                       |
| 공통 편집 디자인      | [editorial.css](frontend/src/styles/editorial.css)                                                                                             |
| 랜딩 구성             | [landing.css](frontend/src/styles/landing.css), [LandingPage.tsx](frontend/src/features/landing/LandingPage.tsx)                               |
| 전체 메뉴·릴          | [EditorialHeader.tsx](frontend/src/components/shell/EditorialHeader.tsx), [EditorialReel.tsx](frontend/src/components/shell/EditorialReel.tsx) |
| 장면 문구·인트로 시간 | [content.ts](frontend/src/features/landing/content.ts)                                                                                         |

## 참고 원본

원본은 변경하지 않는다. 아래 문서의 모든 폰트·색상·컴포넌트 규칙을 그대로 복제한 것은 아니다.

| 참고     | 보관 위치                                                                 | 용도                                |
| -------- | ------------------------------------------------------------------------- | ----------------------------------- |
| ORYZO    | [oryzo.md](docs/design/references/oryzo.md)                               | 초기 제품 중심 구성 기록            |
| Apple    | [apple.md](docs/design/references/apple.md)                               | 이전 섹션·제품 연출 기록            |
| Freshman | [DESIGN3.md](DESIGN3.md), [보관 원본](docs/design/references/freshman.md) | 현재 편집·영화 타이틀 스타일의 기준 |
