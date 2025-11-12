import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Centralized API URL - Change this to switch between local and remote
const API_BASE_URL = "http://localhost:5001"; // For remote server, use: "http://117.218.59.207:5001"
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    proxy: {
      "/employee": {
        target: API_BASE_URL + "/",
        changeOrigin: true,
      },
      "/api": {
        target: API_BASE_URL + "/",
        changeOrigin: true,
      },
      "/qr": {
        target: API_BASE_URL + "/",
        changeOrigin: true,
      },
      "/auth": {
        target: API_BASE_URL + "/",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
