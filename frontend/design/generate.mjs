import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = fileURLToPath(new URL("../../node_modules/vitest/vitest.mjs", import.meta.url));
const result = spawnSync(process.execPath, [cli, "run", "--config", "design/vitest.config.ts"], {
  cwd: root,
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;
