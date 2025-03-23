import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, "game"),
  build: {
    outDir: path.join(__dirname, "webroot"),
    emptyOutDir: true,
    copyPublicDir: true,
    sourcemap: true,
  },
  css: {
    postcss: './postcss.config.js',
  }
});