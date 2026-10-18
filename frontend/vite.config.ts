import { configDefaults, defineConfig } from 'vitest/config'
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
    // Regressão visual roda no Playwright (playwright.config.ts), não no Vitest.
    exclude: [...configDefaults.exclude, 'tests/visual/**'],
    // Fuso fixo: textos de tempo relativo e datas civis não dependem da máquina que roda os testes.
    env: { TZ: 'America/Sao_Paulo' },
    // Testes de integração da área renderizam a App inteira com user-event; sob carga paralela
    // passam de 5 s. O limite maior evita falso negativo sem mascarar espera infinita.
    testTimeout: 15_000,
  },
})
