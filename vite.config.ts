import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site under /fp-shapes/. The dev server uses / so
// `npm run dev` opens at the root URL.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/fp-shapes/" : "/",
  test: {
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
  },
}));
