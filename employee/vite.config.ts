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
        target: 'https://ahhhhhhhhhhhhhhhh.onrender.com/',
        changeOrigin: true,
      },
      '/admin': {
        target: 'https://ahhhhhhhhhhhhhhhh.onrender.com/',
        changeOrigin: true,
      },
       '/auth': {
        target: 'https://ahhhhhhhhhhhhhhhh.onrender.com/',
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
