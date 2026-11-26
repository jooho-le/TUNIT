import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findNumberedCopies } from "./check-numbered-copies.mjs";

const script = fileURLToPath(new URL("./check-numbered-copies.mjs", import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "tunit-copy-check-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { stdio: "pipe", timeout: 10_000 });
  git("init", "--quiet", "--initial-branch=fixture");
  const put = (name, body = "fixture") => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), body); };
  const track = name => git("add", "--", name);
  return { root, git, put, track };
}
const run = root => spawnSync(process.execPath, [script, "--root", root, "--json"], { encoding: "utf8", timeout: 10_000 });

test("untracked copies stop the command while differing contents stay intact", t => {
  const f = fixture(t); f.put("src/Controller.java", "original"); f.track("src/Controller.java");
  f.put("src/Controller 2.java", "different work to preserve");
  const result = run(f.root);
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout).copies, [{ copy: "src/Controller 2.java", original: "src/Controller.java" }]);
  assert.equal(readFileSync(join(f.root, "src/Controller 2.java"), "utf8"), "different work to preserve");
  assert.equal(readFileSync(join(f.root, "src/Controller.java"), "utf8"), "original");
});
test("tracked and staged copies are caught for CI as well", t => {
  const f = fixture(t); f.put("src/App.tsx"); f.track("src/App.tsx"); f.put("src/App 3.tsx"); f.track("src/App 3.tsx");
  assert.equal(run(f.root).status, 1);
  assert.deepEqual(findNumberedCopies(f.root), [{ copy: "src/App 3.tsx", original: "src/App.tsx" }]);
});
test("ignore patterns cannot hide a duplicate Java or SQL source from the guard", t => {
  const f = fixture(t); f.put(".gitignore", "* 2.*\n"); f.track(".gitignore");
  f.put("src/V1__schema.sql"); f.track("src/V1__schema.sql"); f.put("src/V1__schema 2.sql");
  assert.equal(f.git("ls-files", "--others", "--exclude-standard").toString(), "");
  assert.equal(run(f.root).status, 1);
});
test("normal digits, names without an indexed counterpart, and image variants are accepted", t => {
  const f = fixture(t); f.put("src/Scene.tsx"); f.track("src/Scene.tsx");
  f.put("src/Scene2.tsx"); f.put("src/Other 2.tsx");
  f.put("assets/cover.png"); f.track("assets/cover.png"); f.put("assets/cover 2.png");
  const result = run(f.root); assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).count, 0);
});
test("extensionless wrappers and Unicode paths are detected without changing them", t => {
  const f = fixture(t); f.put("backend/gradlew"); f.track("backend/gradlew"); f.put("backend/gradlew 2");
  f.put("설정/한글 설정.json"); f.track("설정/한글 설정.json"); f.put("설정/한글 설정 12.json");
  assert.equal(findNumberedCopies(f.root).length, 2);
});
test("a missing original is not treated as an existing duplicate pair", t => {
  const f = fixture(t); f.put("src/Old.java"); f.track("src/Old.java");
  rmSync(join(f.root, "src/Old.java")); f.put("src/Old 2.java");
  assert.deepEqual(findNumberedCopies(f.root), []);
});
test("an invalid Git root fails explicitly instead of silently passing", t => {
  const root = mkdtempSync(join(tmpdir(), "tunit-copy-check-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 2); assert.match(result.stderr, /Git 추적 목록/);
});
