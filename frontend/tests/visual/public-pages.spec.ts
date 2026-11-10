import { expect, test, type Page } from '@playwright/test'

// Capturas públicas determinísticas: a sessão é simulada por interceptação de
// rede; nenhum backend é necessário (spec 0025, AC05).

async function replyGuestSession(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }),
    }),
  )
}

async function waitForStableImages(page: Page) {
  // Imagens lazy passam a eager e são decodificadas antes da captura fullPage: rolar a página
  // dependia do tempo do IntersectionObserver e deixava o banner sem carregar (spec 0028).
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.images, async (image) => {
      image.loading = 'eager'
      await image.decode().catch(() => undefined)
    }))
  })
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0))
}

const themes = ['light', 'dark'] as const

for (const colorScheme of themes) {
  test.describe(`tema ${colorScheme}`, () => {
    test.use({ colorScheme })

    test('landing pública', async ({ page }, { project }) => {
      // 0050: a landing tem movimento contínuo (flutuação, feixe, órbitas) e conteúdo que entra pela
      // rolagem; com movimento reduzido a captura mostra o estado final e não varia entre execuções.
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await replyGuestSession(page)
      await page.route('**/api/auth/signup', (route) => route.fulfill({ json: { enabled: false } }))
      await page.goto('/')
      // 0050: landing nova.
      const title = page.getByRole('heading', { name: 'Pare de dar F5 no preço.', level: 1 })
      await expect(title).toBeVisible()
      await waitForStableImages(page)
      // O Chromium diverge em até 12 pixels isolados de antisserrilhamento em mobile.
      const maxDiffPixels = ['viewport-320', 'viewport-390'].includes(project.name) ? 12 : 0
      await expect(page).toHaveScreenshot(`landing-${colorScheme}.png`, { fullPage: true, maxDiffPixels })
    })

    test('login', async ({ page }) => {
      await replyGuestSession(page)
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Entrar na sua conta', level: 1 })).toBeVisible()
      await expect(page).toHaveScreenshot(`login-${colorScheme}.png`, { fullPage: true })
    })

    test('página não encontrada', async ({ page }) => {
      await replyGuestSession(page)
      await page.goto('/rota-inexistente')
      await expect(page.getByRole('heading', { name: 'Este endereço saiu do radar.', level: 1 })).toBeVisible()
      await expect(page).toHaveScreenshot(`not-found-${colorScheme}.png`, { fullPage: true })
    })
  })
}
