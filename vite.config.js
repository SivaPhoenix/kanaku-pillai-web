import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      // The browser only ever talks to its own origin; /api is forwarded to the backend, so the refresh cookie stays same-origin.
      proxy: { "/api": { target: apiTarget, changeOrigin: true } },
    },
    preview: {
      port: 4173,
      proxy: { "/api": { target: apiTarget, changeOrigin: true } },
    },
    build: {
      sourcemap: true,
      target: "es2022",
    },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./tests/setup.js"],
      include: ["src/**/*.test.{js,jsx}", "tests/**/*.test.{js,jsx}"],
      css: false,
    },
  };
});
