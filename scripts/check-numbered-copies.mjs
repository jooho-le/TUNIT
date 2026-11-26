import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "..");
const sourceExtensions = new Set([
  ".java", ".sql", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".jsonc", ".json5", ".css", ".html", ".md", ".yml", ".yaml",
  ".sh", ".bat", ".gradle", ".kts", ".properties", ".xml", ".toml",
]);

/** Checks filenames only. Never reads, moves, deletes or stages source contents. */
export function findNumberedCopies(root = projectRoot) {
  let indexed;
  try {
    indexed = execFileSync("git", ["-C", root, "ls-files", "--cached", "--full-name", "-z"], {
      encoding: "utf8", timeout: 10_000, maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Git 추적 목록을 읽지 못했습니다. Git 저장소 루트에서 실행해 주세요.");
  }
  const tracked = new Set(indexed.split("\0").filter(Boolean));
  const directories = new Set([...tracked].map(path => dirname(path)));
  const copies = [];
  for (const directory of directories) {
    let entries;
    try { entries = readdirSync(join(root, directory), { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") continue; throw new Error("사본 검사 중 폴더 목록을 읽지 못했습니다."); }
    for (const entry of entries) {
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      const match = /^(.*) ((?:[2-9]|[1-9]\d+))(\.[^.]+)?$/.exec(entry.name);
      if (!match) continue;
      const originalName = match[1] + (match[3] ?? "");
      if (!sourceExtensions.has(extname(originalName).toLowerCase()) && !["gradlew", "mvnw"].includes(originalName)) continue;
      const original = directory === "." ? originalName : `${directory}/${originalName}`;
      if (!tracked.has(original) || !existsSync(join(root, original))) continue;
      copies.push({ copy: directory === "." ? entry.name : `${directory}/${entry.name}`, original });
    }
  }
  return copies.sort((a, b) => a.copy < b.copy ? -1 : a.copy > b.copy ? 1 : 0);
}

function main(args) {
  let root = projectRoot, json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") json = true;
    else if (args[i] === "--root" && args[i + 1]) root = resolve(args[++i]);
    else { console.error("사용법: node scripts/check-numbered-copies.mjs [--root 저장소경로] [--json]"); return 2; }
  }
  try {
    const copies = findNumberedCopies(root);
    if (json) console.log(JSON.stringify({ count: copies.length, copies }, null, 2));
    else if (!copies.length) console.log("사본 검사 통과: 추적 원본과 대응하는 번호 사본이 없습니다.");
    else {
      console.error(`번호 사본 후보 ${copies.length}개를 발견했습니다. 파일 내용은 비교하거나 변경하지 않았습니다.`);
      for (const item of copies.slice(0, 15)) console.error(`  ${JSON.stringify(item.copy)} → ${JSON.stringify(item.original)}`);
      if (copies.length > 15) console.error(`  외 ${copies.length - 15}개. 전체 목록: npm run check:copies -- --json`);
      console.error("원본과 사본을 백업·비교한 뒤 정리해 주세요. .gitignore로 숨겨도 소스 검사에서는 발견합니다.");
    }
    return copies.length ? 1 : 0;
  } catch (error) { console.error(`사본 검사 실패: ${error.message}`); return 2; }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) process.exitCode = main(process.argv.slice(2));
