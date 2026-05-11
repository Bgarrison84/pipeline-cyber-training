// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',   // browser-like DOM for component/DOM tests
    include: ['tests/**/*.test.js'],
  },
})
