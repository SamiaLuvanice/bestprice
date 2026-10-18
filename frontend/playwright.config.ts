import { defineConfig, devices } from '@playwright/test'

// Regressão visual da SPA (spec 0025): viewports 320/768/1280 px, tema claro e
// escuro por teste. Baselines são locais (fontes do sistema); a execução em CI
// fica para tarefa futura, conforme "Fora de escopo" da spec.
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'viewport-320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 } },
    },
    {
      name: 'viewport-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 640 } },
    },
    {
      name: 'viewport-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 640 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
