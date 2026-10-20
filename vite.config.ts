import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "demo",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "@base-ui/react"],
  },
  build: { outDir: "../.local/demo-dist", emptyOutDir: true },
  server: { host: "127.0.0.1" },
  lint: {
    ignorePatterns: [
      ".local/**",
      "licenses/**",
      "src/ui/**",
      "src/hooks/use-mobile.ts",
      "src/hooks/use-highlighted-code.ts",
      "src/lib/highlighter.tsx",
      "tools/oxlint/anti-slop/**",
    ],
    categories: { correctness: "error", suspicious: "error", perf: "error" },
    plugins: ["react", "typescript"],
    jsPlugins: [{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" }],
    rules: {
      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",

      "react/rules-of-hooks": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
  fmt: {
    ignorePatterns: [
      "src/ui/**",
      "src/hooks/use-mobile.ts",
      "src/hooks/use-highlighted-code.ts",
      "src/lib/highlighter.tsx",
      "src/styles/shadcn.css",
      "src/styles/preset.css",
      "tools/oxlint/anti-slop/**",
      "licenses/**",
      ".agents/skills/**",
      ".local/**",
      "bun.lock",
      "**/*.md",
      "**/*.json",
      "**/*.toml",
      "**/*.yml",
      "**/*.yaml",
    ],
    printWidth: 110,
  },
});
