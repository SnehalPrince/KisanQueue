import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
// Vitest test config is augmented via the triple-slash directive in tsconfig
// rather than importing from vitest/config to avoid Vite version conflicts.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // @ts-expect-error — typed by vitest reference in tsconfig.app.json
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})
