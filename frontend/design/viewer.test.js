import { expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

function openViewer() {
  // Small fixture exercises the actual viewer without a server or downloaded assets.
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="atlas-toolbar"><a data-fit>전체 맞춤</a><button data-zoom="+">+</button>
    <button data-zoom="-">−</button><output id="zoom-label"></output><button id="native-size">100%</button>
    <select id="flow-select"><option value=""></option><option value="flow-1">첫 흐름</option></select>
    <select id="screen-select"><option value=""></option><option value="frame-S09">홈</option></select>
    <button id="export-html">Figma용 HTML 저장</button></div>
    <div class="atlas-stage"><main class="atlas-board"><header class="atlas-cover"><nav></nav></header>
    <section class="atlas-group" id="flow-1"><div class="atlas-grid"><article class="atlas-frame" id="frame-S01"></article></div></section>
    <section class="atlas-group" id="flow-2"><div class="atlas-grid"><article class="atlas-frame" id="frame-S09"></article><article class="atlas-frame" id="frame-S14"></article></div></section>
    </main></div><script></script></body></html>`, {
    url: "https://preview.example.test/", runScripts: "outside-only",
  });
  const { window } = dom;
  window.scrollTo = vi.fn();
  window.eval(readFileSync(resolve("design/viewer.js"), "utf8"));
  const select = window.document.getElementById("screen-select");
  const focusHome = () => {
    select.value = "frame-S09";
    select.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  return { dom, window, select, focusHome };
}

test("a selected screen can be read alone and Escape restores the complete atlas", () => {
  const { dom, window, select, focusHome } = openViewer();
  try {
    focusHome();
    expect(window.document.querySelector(".atlas-board")?.classList.contains("is-focused")).toBe(true);
    expect(window.document.querySelector(".is-focused-frame")?.id).toBe("frame-S09");
    expect(window.document.querySelectorAll(".atlas-group[hidden]")).toHaveLength(1);
    window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    expect(select.value).toBe("");
    expect(window.document.querySelector(".is-focused, .is-focused-frame, .atlas-group[hidden]")).toBeNull();
    expect(window.document.querySelectorAll(".atlas-frame")).toHaveLength(3);
  } finally { dom.window.close(); }
});

test("Figma export includes all frames at original size even while viewing one screen", async () => {
  const { dom, window, focusHome } = openViewer();
  try {
    let download;
    window.URL.createObjectURL = vi.fn((blob) => { download = blob; return "blob:design-export"; });
    window.URL.revokeObjectURL = vi.fn();
    window.HTMLAnchorElement.prototype.click = vi.fn();
    focusHome();
    window.document.getElementById("export-html").click();
    const html = await new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(download);
    });
    const exported = new window.DOMParser().parseFromString(html, "text/html");
    expect(exported.querySelectorAll(".atlas-frame")).toHaveLength(3);
    expect(exported.querySelector(".atlas-toolbar, script, .is-focused, .is-focused-frame, .atlas-group[hidden]")).toBeNull();
    expect(exported.querySelector(".atlas-board")?.hasAttribute("style")).toBe(false);
    expect(window.document.querySelector(".is-focused-frame")?.id).toBe("frame-S09");
  } finally { dom.window.close(); }
});
