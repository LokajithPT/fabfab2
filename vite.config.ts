import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "client/src"),
      "@shared": resolve(__dirname, "shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5001", changeOrigin: true },
      "/admin": { target: "http://localhost:5001", changeOrigin: true },
      "/auth": { target: "http://localhost:5001", changeOrigin: true },
      "/employee": { target: "http://localhost:5001", changeOrigin: true },
      "/qr": { target: "http://localhost:5001", changeOrigin: true },
      "/worker": { target: "http://localhost:5001", changeOrigin: true },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
