// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pipeline-cyber-training/',   // REQUIRED — project-scoped GitHub Pages URL
  plugins: [tailwindcss()],
})
