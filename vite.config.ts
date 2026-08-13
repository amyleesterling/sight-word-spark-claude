import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { devTtsPlugin } from "./server/dev-tts-plugin";

// Static build (dist/) + Cloudflare Pages Function in functions/api/tts.ts.
// The devTtsPlugin mirrors that function locally so `npm run dev` has working audio
// when OPENAI_API_KEY is set in the shell environment.
export default defineConfig({
  // Relative base so the same build works at a domain root (Cloudflare Pages)
  // or under a subpath (GitHub Pages project site).
  base: "./",
  plugins: [react(), devTtsPlugin()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // Content-hashed filenames, paired with a deploy that keeps previous
    // builds' files on the branch (see .github/workflows/deploy.yml). Each
    // deploy therefore publishes URLs no CDN has cached yet — so a new build
    // is never served stale — while a cached index.html still finds the older
    // files it points at, so it can never white-screen either.
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts", "shared/**/*.test.ts"],
  },
});
