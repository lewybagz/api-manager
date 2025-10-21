import react from '@vitejs/plugin-react-swc'
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})