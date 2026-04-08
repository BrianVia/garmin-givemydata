import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  root: "client",
  plugins: [preact()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
