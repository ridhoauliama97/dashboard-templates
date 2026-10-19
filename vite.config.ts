import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const root = import.meta.dirname

/**
 * `next/*` specifiers resolve to the shims in `src/shims`, so the upstream
 * source files stay byte-identical. Matches are anchored regexes because a
 * plain "next" alias would also swallow "next/link".
 */
const nextShims = [
  { find: /^next\/link$/, replacement: path.resolve(root, "./src/shims/next-link.tsx") },
  { find: /^next\/navigation$/, replacement: path.resolve(root, "./src/shims/next-navigation.ts") },
  { find: /^next\/headers$/, replacement: path.resolve(root, "./src/shims/next-headers.ts") },
  { find: /^next-themes$/, replacement: path.resolve(root, "./src/shims/next-themes.ts") },
  { find: /^next$/, replacement: path.resolve(root, "./src/shims/next.ts") },
]

export default defineConfig({
  base: "/dashboard-templates/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@\//, replacement: path.resolve(root, "./src") + "/" }, ...nextShims],
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1200,
    // Vite's default per-module splitting wins here: forcing vendors into a few
    // large groups cut requests from 94 to 40 but added ~680 KB of decoded JS
    // that the dashboard route never needs, with no change in first paint.
  },
})
