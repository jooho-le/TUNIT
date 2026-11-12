import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface DesignFrame {
  key: string;
  screen: string;
  title: string;
  route: string;
  group: number;
  height: number;
  tier?: string;
  html: string;
}
const groups = [
  ["브랜드와 첫인상", "INTRO / LANDING / MENU", "랜딩의 스크롤 구간을 장면별로 펼쳤습니다. 01 → 04 순서로 하나의 랜딩 페이지가 이어집니다."],
  ["나만의 취향을 찾는 과정", "SIGN IN / ONBOARDING", "계정 진입부터 아티스트, 음악, 무드 선택과 분석 상태까지."],
  ["나를 발견하는 화면", "TASTE / HOME / MY PAGE", "취향 결과, 홈, 혼자 탐색과 내 정보 관리. 마이페이지의 삭제 확인은 별도 상태로 표시합니다."],
  ["음악에서 사람으로", "DISCOVER / PROFILE / MUSIC", "추천 목록, 프로필과 궁합 비교. 후보가 없거나 공개가 중단된 상태도 함께 확인합니다."],
  ["친구에게 건네는 취향", "INVITATION / FRIEND COMPARISON", "초대 생성 → 참여 → 취향 완성·공개 동의 → 비교. 대기와 만료 화면을 함께 배치했습니다."],
  ["관심이 연결이 되는 순간", "INTEREST / CONNECTION", "관심 작성, 보낸 요청, 받은 요청과 상호 연결. 각 상태는 독립적인 예시입니다."],
  ["그다음 주파수", "FOLLOW / SHARE / NEXT", "P1은 현재 로컬 UI, P2는 실제 앱의 예약 안내 화면입니다. 향후 화면을 새로 가정하지 않았습니다."],
];
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function buildBoard(frames: DesignFrame[], appCss: string, fontCss: string) {
  const style = readFileSync(resolve("design/atlas.css"), "utf8");
  const viewer = readFileSync(resolve("design/viewer.js"), "utf8");
  const licenses = ["Cormorant-Garamond", "DM-Sans", "Noto-Sans-KR"].map((name) =>
    `/* ${name}\n${readFileSync(resolve(`design/licenses/${name}-OFL.txt`), "utf8").replaceAll("*/", "* /")}\n*/`).join("\n");
  const content = groups.map(([title, label, description], index) => `
    <section class="atlas-group" id="flow-${index + 1}" aria-labelledby="flow-title-${index + 1}">
      <header class="atlas-group-heading">
        <span class="atlas-number">0${index + 1}</span>
        <div><p>${label}</p><h2 id="flow-title-${index + 1}">${title}</h2><span>${description}</span></div>
        <b>${frames.filter((frame) => frame.group === index).length} SCREENS</b>
      </header>
      <div class="atlas-grid">${frames.filter((frame) => frame.group === index).map((frame) => `
        <article class="atlas-frame" id="frame-${frame.key}" data-name="${escape(frame.title)}" data-screen-id="${frame.screen}">
          <header class="atlas-frame-label"><div><span>${frame.key}</span><h3>${escape(frame.title)}</h3></div><b>${frame.tier ?? "P0 · 현재 프론트"}</b></header>
          <p class="atlas-frame-route">${escape(frame.route)} <span>1440 × ${frame.height}</span></p>
          <div class="screen-viewport" style="height:${frame.height}px"><div class="design-screen">${frame.html}</div></div>
          <p class="atlas-frame-caption">${frame.key} <span>텍스트 · CSS · SVG / 편집용 정적 장면</span></p>
        </article>`).join("\n")}</div>
    </section>`).join("\n");
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>TUNIT — 전체 화면 디자인 보드</title>
<style>${licenses}\n${fontCss}</style><style>${appCss}\n${style}</style></head>
<body class="atlas-body">
  <div class="atlas-toolbar" role="toolbar" aria-label="디자인 보드 보기 도구">
    <strong>TUNIT / DESIGN ATLAS</strong>
    <a href="#atlas-top" data-fit>전체 맞춤</a><button type="button" data-zoom="-">−</button><output id="zoom-label">100%</output><button type="button" data-zoom="+">+</button>
    <button type="button" id="native-size">원본 크기 100%</button>
    <label>흐름 <select id="flow-select"><option value="">선택</option>${groups.map(([title], i) => `<option value="flow-${i + 1}">0${i + 1} ${title}</option>`).join("")}</select></label>
    <span>화면 더블클릭: 확대 / Esc: 전체</span><button type="button" id="export-html">Figma용 HTML 저장</button>
  </div>
  <div class="atlas-stage"><main class="atlas-board" id="atlas-top">
    <header class="atlas-cover">
      <div class="atlas-cover-top"><span>[ TUNIT / PRODUCT DESIGN ARCHIVE ]</span><span>2026.11.10 / DESIGN3 EDITION</span></div>
      <div class="atlas-title-row"><div><h1>Tunit<span>.</span></h1><p>같은 취향에서, 새로운 연결로.</p></div><div class="atlas-count"><strong>${frames.length}</strong><span>STATES<br>27 SCREENS</span></div></div>
      <div class="atlas-cover-bottom"><p>전체 프론트 화면을 흐름별로 펼친 HTML 디자인 보드<br><span>현재 React 프론트에서 추출 · 데스크톱 1440px · 모든 인물과 계정은 디자인 예시</span></p><nav aria-label="보드 목차">${groups.map(([title], i) => `<a href="#flow-${i + 1}">0${i + 1} ${title} ↗</a>`).join("")}</nav></div>
    </header>
    ${content}
    <footer class="atlas-foundations">
      <div class="atlas-foundations-title"><span>FOUNDATIONS</span><h2>소리보다 먼저, 우리의 색.</h2><p>DESIGN3의 타이포그래피와 여백 / TUNIT의 기존 세 가지 색상</p></div>
      <div class="atlas-swatches"><div><i style="background:#FFF21A"></i><strong>FREQUENCY YELLOW</strong><span>#FFF21A · 행동과 강조</span></div><div><i style="background:#171717"></i><strong>CANVAS BLACK</strong><span>#171717 · 기본 캔버스</span></div><div><i style="background:#A66BFF"></i><strong>CONNECTION PURPLE</strong><span>#A66BFF · 연결과 무드</span></div><div class="atlas-type"><em>Taste. Tune. Together.</em><strong>DM Sans / Noto Sans KR</strong><span>Cormorant Garamond · Italic 300</span></div></div>
      <p class="atlas-footnote">정적 디자인 검토용 · 실제 API·로그인·개인 데이터와 연결되지 않습니다. &nbsp; / &nbsp; P2는 현재 프론트의 안내 상태입니다. &nbsp; / &nbsp; Figma 반입 시 폰트·벡터·레이아웃은 플러그인 결과를 확인하세요.</p>
    </footer>
  </main></div><script>${viewer}</script></body></html>\n`;
}
