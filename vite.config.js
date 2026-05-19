// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pipeline-cyber-training/',   // REQUIRED — project-scoped GitHub Pages URL
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      workbox: {
        globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}'],
        cleanupOutdatedCaches: true,
        // NO navigateFallback — hash router conflict (Pitfall 4)
      },
      manifest: {
        name: 'OT Security Lab',
        short_name: 'OT Training',
        description: 'Pipeline cybersecurity training — TSA SD-02 series compliance',
        theme_color: '#111827',
        background_color: '#1a1a1a',
        display: 'standalone',
        scope: '/pipeline-cyber-training/',
        start_url: '/pipeline-cyber-training/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    }),
  ],
})
