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
  // Percorre a página para disparar imagens com loading="lazy" e depois espera
  // todas estarem decodificadas, evitando baseline instável em captura fullPage.
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0))
}

const themes = ['light', 'dark'] as const

for (const colorScheme of themes) {
  test.describe(`tema ${colorScheme}`, () => {
    test.use({ colorScheme })

    test('landing pública', async ({ page }) => {
      await replyGuestSession(page)
      await page.goto('/')
      const title = page.getByRole('heading', { name: /O preço muda.*Você fica sabendo/i, level: 1 })
      await expect(title).toBeVisible()
      await waitForStableImages(page)
      await expect(page).toHaveScreenshot(`landing-${colorScheme}.png`, { fullPage: true })
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
