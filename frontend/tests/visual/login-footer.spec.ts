import { expect, test } from '@playwright/test'

test('login ocupa o viewport sem reservar espaço para o rodapé', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 1040 })
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }),
  }))
  await page.goto('/login?returnTo=%2Fprodutos')
  const login = page.getByRole('region', { name: 'Entrar na sua conta' })
  await expect(login).toBeVisible()
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
  await expect(page.getByText('O monitoramento começa com um link do Mercado Livre.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  const dimensions = await login.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    height: element.getBoundingClientRect().height,
    viewport: innerHeight,
    width: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
  }))
  expect(dimensions.top).toBe(0)
  expect(dimensions.height).toBeGreaterThanOrEqual(dimensions.viewport)
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth)
  await page.screenshot({ path: testInfo.outputPath('login-full-height.png'), fullPage: true })
})
