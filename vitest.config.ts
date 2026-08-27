import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  // Mirror tsconfig's `@/*` alias so tests can import app modules.
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
