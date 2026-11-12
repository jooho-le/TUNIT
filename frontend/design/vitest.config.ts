import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Standalone export job. It never starts the development server.
export default defineConfig({
  root: fileURLToPath(new URL("../", import.meta.url)),
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["design/export.test.tsx"],
    fileParallelism: false,
    testTimeout: 60000,
    restoreMocks: true,
  },
});
