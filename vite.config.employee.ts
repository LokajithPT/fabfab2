// vite.config.employee.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import { dirname, resolve } from "path";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: "employee", // set employee folder as root
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "employee/src"), // frontend source
      "@shared": resolve(__dirname, "shared"), // shared folder
      "@assets": resolve(__dirname, "attached_assets"), // assets
    },
  },
  server: {
    port: 5174, // frontend dev server (use a different port)
    fs: {
      strict: true,
      deny: ["**/.*"], // hide dotfiles
    },
    proxy: {
      "/api": {
        target: "http://117.218.59.207:5001", // Flask backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "../server/employeeshit", // production build output
    emptyOutDir: true, // clean previous builds
  },
});
