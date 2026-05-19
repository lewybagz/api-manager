import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
// Run `npm run build:analyze` then open `dist/stats.html` after build. Use Chrome Lighthouse (mobile) on `npm run preview` for LCP/INP baselines.
export default defineConfig(({ mode }) => ({
  base: "/internal/zeker/",
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  plugins: [
    react(),
    ...(mode === "analyze"
      ? [
          visualizer({
            brotliSize: true,
            filename: "dist/stats.html",
            gzipSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/internal/zeker/api": {
        changeOrigin: true,
        target: "http://127.0.0.1:3000",
        rewrite: (path) => path.replace(/^\/internal\/zeker\/api/, "/api"),
      },
    },
  },
}));
