import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    proxy: {
      '/employee': {
        target: 'http://117.218.59.207:5001/',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://117.218.59.207:5001/',
        changeOrigin: true,
      },
      '/qr': {
        target: 'http://117.218.59.207:5001/',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://117.218.59.207:5001/',
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
})
