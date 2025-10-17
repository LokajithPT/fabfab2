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
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
       '/auth': {
        target: 'http://localhost:5005',
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
