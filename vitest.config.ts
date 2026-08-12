import solid from "vite-plugin-solid";
import { defineConfig, type Plugin } from "vitest/config";

export default defineConfig({
  // vitest's bundled vite (a peer-range mismatch: vitest wants vite@5, this project runs vite@6)
  // structurally duplicates vite's Plugin type, so vite-plugin-solid's return type doesn't match
  // vitest/config's own Plugin. The cast is just bridging those two copies of the same shape.
  plugins: [solid() as Plugin],
  // Solid ships separate server and browser builds; component tests need the browser one.
  resolve: {
    conditions: ["development", "browser"],
  },
  test: {
    // Server tests are the majority, so node stays the default and component tests opt into jsdom per file.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs/],
      },
    },
  },
});
