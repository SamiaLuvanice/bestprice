import { configDefaults, defineConfig } from 'vitest/config'
import { searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { notFoundPage } from './scripts/not-found-page.mjs'

export default defineConfig({
  // 0051/AC03: dist/404.html (cópia do index.html) faz o Pages responder 404 em rota sem arquivo.
  plugins: [react(), tailwindcss(), notFoundPage()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // 0049: fontes nunca viram base64 dentro do CSS (aumentariam o CSS principal e baixariam
    // todas as variações); os demais assets seguem o limite padrão do Vite.
    assetsInlineLimit: (filePath) => (/\.woff2?$/.test(filePath) ? false : undefined),
  },
  server: {
    // 0049: o catálogo de desenvolvimento lê o snapshot do Figma em ../designsystem/tokens.
    // Só essa pasta é liberada além da raiz padrão; o build de distribuição não a usa.
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), fileURLToPath(new URL('../designsystem/tokens', import.meta.url))] },
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8000',
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
