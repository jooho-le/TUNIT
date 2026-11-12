// Optional, networked maintenance command: download public font files only.
// No project text, HTML or local file content is included in network requests.
// Normal board generation uses the checked-in fonts.css and needs no network.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const dir = fileURLToPath(new URL("./", import.meta.url));
const url = new URL("https://fonts.googleapis.com/css2");
for (const family of [
  "Cormorant Garamond:ital,wght@0,300;0,400;1,300;1,400",
  "DM Sans:wght@400;500;600",
  "Noto Sans KR:wght@400;500",
]) url.searchParams.append("family", family);
url.searchParams.set("display", "swap");
function download(address) {
  return execFileSync("curl", ["--fail", "--silent", "--show-error", "--location", "--max-time", "30", address], { maxBuffer: 40 * 1024 * 1024 });
}
let css = download(url.href).toString();
const sources = [];
for (const source of new Set(css.match(/https:\/\/[^)\s]+/g))) {
  const bytes = download(source);
  const mime = bytes.subarray(0, 4).toString() === "wOF2" ? "font/woff2" : "font/ttf";
  css = css.replaceAll(source, `data:${mime};base64,${bytes.toString("base64")}`);
  sources.push({ url: source, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}
mkdirSync(`${dir}licenses`, { recursive: true });
for (const [name, folder] of [["Cormorant-Garamond", "cormorantgaramond"], ["DM-Sans", "dmsans"], ["Noto-Sans-KR", "notosanskr"]]) {
  const license = download(`https://raw.githubusercontent.com/google/fonts/main/ofl/${folder}/OFL.txt`);
  writeFileSync(`${dir}licenses/${name}-OFL.txt`, license);
}
writeFileSync(`${dir}fonts.css`, `/* Public Google Fonts, SIL OFL 1.1. See licenses/. No project text is sent to Google. */\n${css}`);
writeFileSync(`${dir}font-sources.json`, `${JSON.stringify({ families: ["Cormorant Garamond", "DM Sans", "Noto Sans KR"], sources }, null, 2)}\n`);
console.info(`Embedded ${sources.length} font assets. Regenerate showcase.html to apply them.`);
