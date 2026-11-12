import { expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor, act, within } from "@testing-library/react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import type { TunitApi } from "../src/api/types";
import type { Taste } from "../src/types";
import { createMockApi } from "../src/api/mock";
import { MemoryStorage, validTaste } from "../src/test/helpers";
import { catalogArtists, catalogTracks } from "../src/features/catalog";
import App from "../src/app/App";
import { buildBoard, type DesignFrame } from "./template";

// Only this export job sees synthetic accounts. Production APIs and storage stay untouched.
const adapter = vi.hoisted(() => ({ current: null as TunitApi | null }));
vi.mock("../src/api", async () => ({
  ApiError: (await import("../src/api/types")).ApiError,
  apiMode: "mock",
  api: new Proxy({}, {
    get: (_, key: keyof TunitApi) => (...args: unknown[]) => {
      const method = adapter.current![key] as (...values: unknown[]) => unknown;
      return method(...args);
    },
  }),
}));

const dir = `${resolve(process.cwd(), "design")}/`;
const dbKey = "tunit-browser-demo-v1";
const sessionKey = "tunit-browser-demo-session";
const epoch = Date.parse("2026-11-10T03:00:00.000Z");
const password = "design-only-example";
const secondTaste: Taste = {
  ...validTaste(),
  artists: catalogArtists.slice(2, 7).map((a) => a.id),
  tracks: catalogTracks.slice(2, 12).map((t) => t.id),
};

type Fixture = Awaited<ReturnType<typeof makeFixture>>;
async function makeFixture(base?: string, ids?: string[]) {
  const storage = new MemoryStorage();
  if (base) storage.setItem(dbKey, base);
  const sessions = [new MemoryStorage(), new MemoryStorage(), new MemoryStorage()];
  let now = epoch;
  const apis = sessions.map((session) => createMockApi({ storage, session, now: () => now }));
  const userIds: string[] = [];
  if (ids) sessions.forEach((session, i) => session.setItem(sessionKey, ids[i]));
  else {
    for (let i = 0; i < apis.length; i++) {
      const user = await apis[i].signup({
        email: `preview-${i + 1}@example.test`,
        nickname: ["윤슬(예시)", "새벽(예시)", "여름(예시)"][i],
        password,
      });
      userIds.push(user.id);
      await apis[i].saveTaste(i === 0 ? validTaste() : secondTaste);
    }
  }
  return { storage, apis, ids: ids ?? userIds, expire: () => { now += 48 * 3600000; } };
}

type View = {
  key: string;
  screen: string;
  title: string;
  route: string | ((f: Fixture) => string);
  group: number;
  height: number;
  user?: number | null;
  tier?: string;
  expected?: string;
  focus?: string;
  motion?: boolean;
  offline?: boolean;
  prepare?: (f: Fixture) => Promise<string | void>;
  action?: (root: HTMLElement) => void | Promise<void>;
};

const landing = (key: string, title: string, focus: string): View => ({
  key, screen: "S01", title, focus, route: "/landing", group: 0, height: 1100, user: null,
});
const views: View[] = [
  { ...landing("S01-A", "브랜드 인트로", ".landing-intro"), motion: true, height: 1000 },
  landing("S01-B", "랜딩 · 메인 타이틀", ".landing-hero"),
  landing("S01-C1", "랜딩 · 취향을 기록하다", "#landing-taste"),
  landing("S01-C2", "랜딩 · 같은 취향의 사람", "#landing-twin"),
  landing("S01-C3", "랜딩 · 새로운 음악", "#landing-discovery"),
  landing("S01-C4", "랜딩 · 친구와 비교", "#landing-friends"),
  landing("S01-D", "랜딩 · 시작하기", ".landing-final"),
  { key: "MENU", screen: "S01", title: "전체 메뉴 · 펼친 상태", route: "/landing", group: 0, height: 1100, user: null,
    action: (root) => { fireEvent.click(within(root).getByRole("button", { name: "메뉴 열기" })); } },
  { key: "S02-A", screen: "S02", title: "로그인", route: "/login", group: 1, height: 1250, user: null },
  { key: "S02-B", screen: "S02", title: "회원가입", route: "/login", group: 1, height: 1450, user: null,
    action: (root) => { fireEvent.click(within(root).getByRole("button", { name: "회원가입" })); } },
  { key: "S03", screen: "S03", title: "온보딩 · 시작", route: "/onboarding/intro", group: 1, height: 1250 },
  { key: "S04", screen: "S04", title: "아티스트 5명 선택", route: "/onboarding/artists", group: 1, height: 1900 },
  { key: "S05", screen: "S05", title: "좋아하는 곡 10개 선택", route: "/onboarding/tracks", group: 1, height: 2400 },
  { key: "S06", screen: "S06", title: "장르와 무드 선택", route: "/onboarding/mood", group: 1, height: 1650 },
  { key: "S07-A", screen: "S07", title: "취향 분석 중", route: "/onboarding/analyzing", group: 1, height: 1100 },
  { key: "S07-B", screen: "S07", title: "분석 연결 실패 · 기본 취향", route: "/onboarding/analyzing", group: 1, height: 1200,
    offline: true, expected: "연결은 잠시 멈춰도," },
  { key: "S08", screen: "S08", title: "취향 분석 결과", route: "/taste", group: 2, height: 2400 },
  { key: "S09", screen: "S09", title: "로그인 후 홈", route: "/home", group: 2, height: 2000 },
  { key: "S24", screen: "S24", title: "혼자 취향 탐색", route: "/solo", group: 2, height: 2400 },
  { key: "S14-A", screen: "S14", title: "마이페이지 · 취향 공개", route: "/my", group: 2, height: 2900 },
  { key: "S14-B", screen: "S14", title: "마이페이지 · 삭제 확인", route: "/my", group: 2, height: 3100,
    action: (root) => { fireEvent.click(within(root).getByRole("button", { name: /내 취향 삭제/ })); } },
  { key: "S10", screen: "S10", title: "취향이 맞는 사람 찾기", route: "/discover", group: 3, height: 1750 },
  { key: "S26", screen: "S26", title: "추천 후보 없음", route: "/empty", group: 3, height: 1300 },
  { key: "S11", screen: "S11", title: "상대 프로필", route: (f) => `/people/${f.ids[1]}`, group: 3, height: 2400 },
  { key: "S12", screen: "S12", title: "취향 궁합 상세 비교", route: (f) => `/matches/${f.ids[1]}`, group: 3, height: 2900 },
  { key: "S13", screen: "S13", title: "새로운 음악 발견", route: "/music", group: 3, height: 2700 },
  { key: "PRIVATE", screen: "403", title: "상대 취향 비공개 · 접근 안내", route: (f) => `/people/${f.ids[1]}`, group: 3, height: 1100,
    expected: "공개 범위와 권한을 확인해 주세요.",
    prepare: async (f) => { await f.apis[1].saveTaste({ ...secondTaste, public: false }); } },
  { key: "S25-A", screen: "S25", title: "친구 초대 만들기", route: "/invite", group: 4, height: 1400 },
  { key: "S25-B", screen: "S25", title: "초대 링크 · 친구 참여 대기", route: "", group: 4, height: 1300,
    prepare: async (f) => `/invite/${(await f.apis[0].createInvitation(true)).token}` },
  { key: "S25-C", screen: "S25", title: "받은 초대 · 비교 동의", route: "", group: 4, height: 1400, user: 1,
    prepare: async (f) => `/invite/${(await f.apis[0].createInvitation(true)).token}` },
  { key: "S25-D", screen: "S25", title: "친구 취향 입력 대기", route: "", group: 4, height: 1350,
    prepare: async (f) => {
      const inv = await f.apis[0].createInvitation(true);
      await f.apis[1].acceptInvitation(inv.token, true);
      await f.apis[1].deleteTaste();
      return `/invite/${inv.token}`;
    } },
  { key: "S25-E", screen: "S25", title: "양쪽 공개·동의 필요", route: "", group: 4, height: 1400, user: 1,
    prepare: async (f) => {
      const inv = await f.apis[0].createInvitation(true);
      await f.apis[1].acceptInvitation(inv.token, true);
      await f.apis[1].saveTaste({ ...secondTaste, public: false });
      return `/invite/${inv.token}`;
    } },
  { key: "S25-F", screen: "S25", title: "초대 링크 만료", route: "", group: 4, height: 1200,
    prepare: async (f) => { const inv = await f.apis[0].createInvitation(true); f.expire(); return `/invite/${inv.token}`; } },
  { key: "S27", screen: "S27", title: "친구와 1:1 궁합 결과", route: "", group: 4, height: 2900,
    prepare: async (f) => { const inv = await f.apis[0].createInvitation(true); await f.apis[1].acceptInvitation(inv.token, true); return `/friends/${inv.token}`; } },
  { key: "S15", screen: "S15", title: "관심 보내기", route: (f) => `/interest/${f.ids[1]}`, group: 5, height: 1550 },
  { key: "S16-A", screen: "S16", title: "보낸 관심 · 응답 대기", route: "/interests/sent", group: 5, height: 1450,
    prepare: async (f) => { await f.apis[0].sendInterest(f.ids[1], "같은 노래를 좋아해서 반가워요. 추천곡도 함께 나눠요!"); } },
  { key: "S16-B", screen: "S16", title: "보낸 관심 · 요청 취소", route: "/interests/sent", group: 5, height: 1400,
    prepare: async (f) => { const req = await f.apis[0].sendInterest(f.ids[1], "다음에 음악으로 다시 만나요."); await f.apis[0].actOnInterest(req.id, "cancel"); } },
  { key: "S19-A", screen: "S19", title: "받은 관심 · 수락과 거절", route: "/interests/inbox", group: 5, height: 1500,
    prepare: async (f) => { await f.apis[1].sendInterest(f.ids[0], "플레이리스트가 닮아서 반가워요. 요즘 어떤 곡을 듣나요?"); } },
  { key: "S19-B", screen: "S19", title: "받은 관심 · 거절 완료", route: "/interests/inbox", group: 5, height: 1450,
    prepare: async (f) => { const req = await f.apis[1].sendInterest(f.ids[0], "음악 취향을 나누고 싶어요."); await f.apis[0].actOnInterest(req.id, "reject"); } },
  { key: "S20", screen: "S20", title: "상호 수락 · 연결 목록", route: "/connections", group: 5, height: 1500,
    prepare: async (f) => { const req = await f.apis[1].sendInterest(f.ids[0], "우리의 공통곡을 더 들어봐요."); await f.apis[0].actOnInterest(req.id, "accept"); } },
  { key: "S17", screen: "S17", title: "팔로우", route: (f) => `/follow/${f.ids[1]}`, group: 6, height: 1150, tier: "P1 · 로컬 UI" },
  { key: "S18", screen: "S18", title: "궁합 카드 공유", route: (f) => `/share/${f.ids[1]}`, group: 6, height: 1750, tier: "P1 · 로컬 UI" },
  ...(["chat", "playlist"] as const).map((kind, i): View => ({
    key: `S${21 + i}`, screen: `S${21 + i}`, title: i ? "공동 플레이리스트 · 안내" : "연결 후 대화 · 안내",
    route: "", group: 6, height: 1300, tier: "P2 · 예약 화면",
    prepare: async (f) => { const req = await f.apis[1].sendInterest(f.ids[0], "우리의 공통곡을 더 들어봐요."); await f.apis[0].actOnInterest(req.id, "accept"); return `/${kind}/${(await f.apis[0].connections())[0].id}`; },
  })),
  { key: "S23", screen: "S23", title: "음악 피드 · 안내", route: "/feed", group: 6, height: 1300, tier: "P2 · 예약 화면" },
];

function splitSelectors(selector: string) {
  const parts: string[] = [];
  let depth = 0, quote = "", start = 0;
  for (let i = 0; i < selector.length; i++) {
    const character = selector[i];
    if (character === "\\") { i++; continue; }
    if (quote) { if (character === quote) quote = ""; continue; }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === "(" || character === "[") depth++;
    if (character === ")" || character === "]") depth--;
    if (character === "," && depth === 0) { parts.push(selector.slice(start, i)); start = i + 1; }
  }
  parts.push(selector.slice(start));
  return parts;
}

function exportCss() {
  const css = ["global", "flows", "editorial", "landing"].map((name) =>
    readFileSync(`${dir}../src/styles/${name}.css`, "utf8")).join("\n");
  const tree = postcss.parse(css);
  tree.walkAtRules("import", (rule) => { rule.remove(); });
  tree.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
    // Split only selector-list commas, preserving :is(), :not() and attribute values.
    rule.selector = splitSelectors(rule.selector).map((selector) => {
      if (selector.includes(":root")) return selector.replaceAll(":root", ".design-screen");
      if (/^\s*(html|body)\b/.test(selector)) return selector.replace(/\b(html|body)\b/g, ".design-screen");
      return `.design-screen ${selector.trim()}`;
    }).join(", ");
  });
  tree.walkDecls((decl) => {
    decl.value = decl.value.replace(/(-?[\d.]+)(?:s|d|l)?v(w|h)\b/g, "$1cq$2");
  });
  tree.walkAtRules("media", (rule) => {
    if (/\((?:min|max)-(?:width|height):/.test(rule.params)) {
      rule.name = "container";
      rule.params = `screen ${rule.params}`;
    }
  });
  return tree.toString();
}

function serialize(root: HTMLElement, prefix: string) {
  // DOM properties do not all survive innerHTML serialization.
  root.querySelectorAll("input").forEach((input) => {
    input.setAttribute("value", input.type === "password" ? "" : input.value);
    input.toggleAttribute("checked", input.checked);
  });
  root.querySelectorAll("textarea").forEach((input) => { input.textContent = input.value; });
  const ids = new Map<string, string>();
  root.querySelectorAll("[id]").forEach((element) => {
    const old = element.id;
    const next = `${prefix}-${old}`;
    ids.set(old, next);
    element.id = next;
  });
  root.querySelectorAll("*").forEach((element) => {
    for (const attr of [...element.attributes]) {
      let value = attr.value.replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${ids.get(id) ?? id})`);
      if (["aria-labelledby", "aria-describedby", "aria-controls", "for"].includes(attr.name))
        value = value.split(" ").map((id) => ids.get(id) ?? id).join(" ");
      if (["href", "xlink:href"].includes(attr.name) && value.startsWith("#") && ids.has(value.slice(1)))
        value = `#${ids.get(value.slice(1))}`;
      element.setAttribute(attr.name, value);
    }
    // A static board must not autofocus or submit forms.
    element.removeAttribute("autofocus");
    element.removeAttribute("tabindex");
    if (element instanceof HTMLButtonElement) element.type = "button";
  });
  root.querySelectorAll("img").forEach((image) => {
    const asset = image.getAttribute("src");
    if (!asset?.startsWith("/assets/")) throw new Error(`Unexpected image: ${asset}`);
    const bytes = readFileSync(`${dir}../public${asset}`);
    image.src = `data:image/png;base64,${bytes.toString("base64")}`;
    image.loading = "eager";
  });
  return root.innerHTML;
}

test("export actual frontend screens as one static, self-contained design atlas", async () => {
  let serial = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(() =>
    `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`);
  const initial = await makeFixture();
  const base = initial.storage.getItem(dbKey)!;
  const frames: DesignFrame[] = [];
  for (const view of views) {
    const fixture = await makeFixture(base, initial.ids);
    const preparedRoute = await view.prepare?.(fixture);
    adapter.current = fixture.apis[view.user ?? 0];
    if (view.user === null) {
      adapter.current = createMockApi({ storage: fixture.storage, session: new MemoryStorage() });
    }
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({
      matches: !view.motion, media: query, addEventListener: () => {}, removeEventListener: () => {},
    }) });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: !view.offline });
    const route = preparedRoute || (typeof view.route === "function" ? view.route(fixture) : view.route);
    window.history.replaceState(null, "", `/#${route}`);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector(".resource-loading")).toBeNull();
      if (view.screen === "403") expect(container.textContent).toContain(view.expected);
      else expect(container.querySelector(`[data-screen="${view.screen}"]`)).not.toBeNull();
    });
    if (view.offline) await waitFor(() => expect(container.textContent).toContain(view.expected), { timeout: 2500 });
    if (view.action) await act(async () => { await view.action!(container); });
    const clone = container.cloneNode(true) as HTMLElement;
    if (view.focus) {
      const selected = clone.querySelector(view.focus);
      expect(selected, view.key).not.toBeNull();
      if (view.focus === ".landing-intro") clone.querySelector(".landing-story-content")?.remove();
      else {
        clone.querySelector(".landing-intro")?.remove();
        const introduction = view.key === "S01-C1" ? clone.querySelector(".landing-story-introduction") : null;
        clone.querySelector(".landing-story-content")!.replaceChildren(selected!);
        if (introduction) selected!.prepend(introduction);
        clone.querySelector(".landing-page")!.setAttribute("data-export-focus", view.focus);
      }
    }
    // Open-menu frames show only the real overlay, not hidden page content behind it.
    if (view.key === "MENU") clone.querySelector(".landing-page")?.remove();
    const html = serialize(clone, view.key.toLowerCase());
    expect(html).not.toContain("resource-loading");
    expect(html).not.toContain("fatal-error");
    if (view.key === "S14-B") expect(html).toContain("취향 삭제 확인");
    if (view.key === "MENU") expect(html).toContain('aria-label="전체 메뉴"');
    frames.push({ ...view, route: route.replaceAll(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/g, ":id"), html });
    cleanup();
  }
  for (let i = 1; i <= 27; i++) expect(frames.some((f) => f.screen === `S${String(i).padStart(2, "0")}`)).toBe(true);
  const fontCss = readFileSync(`${dir}fonts.css`, "utf8");
  const html = buildBoard(frames, exportCss(), fontCss);
  const parsed = new DOMParser().parseFromString(html, "text/html");
  for (const style of parsed.querySelectorAll("style")) {
    expect(() => postcss.parse(style.textContent!)).not.toThrow();
  }
  expect(parsed.querySelectorAll(".atlas-frame")).toHaveLength(views.length);
  expect(parsed.querySelector("iframe, canvas, script[src], link[rel=stylesheet]")).toBeNull();
  expect(html).not.toMatch(/@import|fetch\(|localStorage|sessionStorage|passwordHash/);
  expect(fontCss).not.toMatch(/url\(https?:/);
  expect([...parsed.images].every((image) => image.src.startsWith("data:"))).toBe(true);
  const ids = [...parsed.querySelectorAll("[id]")].map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const element of parsed.querySelectorAll("[filter]")) {
    const id = element.getAttribute("filter")?.match(/url\(#([^)]*)\)/)?.[1];
    if (id) expect(parsed.getElementById(id)).not.toBeNull();
  }
  const manifest = frames.map(({ html: _, ...frame }) => frame);
  writeFileSync(`${dir}showcase.html`, html);
  writeFileSync(`${dir}screens.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.info(`Exported ${frames.length} frames, all S01–S27, ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MiB.`);
});
