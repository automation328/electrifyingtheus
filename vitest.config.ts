import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // api/ too. It had NO test coverage and is in no tsconfig project either,
    // so nothing has ever compiled or exercised the serverless backend. The
    // weekly event importer writes to site_events on a schedule with no human
    // in the loop, which is not a thing to ship untested.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "api/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
