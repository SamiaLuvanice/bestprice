import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    restoreMocks: true,
    // Fuso fixo: textos de tempo relativo e datas civis não dependem da máquina que roda os testes.
    env: { TZ: 'America/Sao_Paulo' },
  },
})
