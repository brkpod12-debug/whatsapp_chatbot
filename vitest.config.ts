import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      // Mirror tsconfig's `@/*` alias so tests can import app modules.
      "@": path.resolve(__dirname),
      // `server-only` throws on import outside a React Server Component build,
      // which is the whole point of the package and also makes any module that
      // guards itself with it untestable. Next's own server build maps it to an
      // empty module; do the same here.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
});
