import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }),
  }))
})

test('banner final preserva toda a arte sem recortar o telefone', async ({ page }) => {
  await page.goto('/')
  const banner = page.locator('.landing-signup__art')
  await banner.scrollIntoViewIfNeeded()
  await expect(banner).toBeVisible()
  await expect.poll(() => banner.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  const geometry = await banner.evaluate((image: HTMLImageElement) => {
    const box = image.getBoundingClientRect()
    const container = image.closest('section')!.getBoundingClientRect()
    return { ratio: box.width / box.height, naturalRatio: image.naturalWidth / image.naturalHeight,
      fits: box.left >= container.left - 1 && box.right <= container.right + 1 && box.top >= container.top - 1 && box.bottom <= container.bottom + 1 }
  })
  expect(geometry.ratio).toBeCloseTo(geometry.naturalRatio, 2)
  expect(geometry.fits).toBe(true)
})

test('rodapé da landing tem fundo preto e texto claro', async ({ page }) => {
  await page.goto('/')
  const footer = page.getByRole('contentinfo')
  await footer.scrollIntoViewIfNeeded()
  const colors = await footer.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    text: getComputedStyle(element).color,
  }))
  expect(colors).toEqual({ background: 'rgb(0, 0, 0)', text: 'rgb(255, 255, 255)' })
  await expect(footer.getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('marca do login fica no formulário à direita, com fundo transparente', async ({ page }) => {
  await page.goto('/login')
  const brand = page.locator('.login-form-side .brand')
  await expect(brand).toBeVisible()
  const marks = page.getByRole('img', { name: 'BestPrice', exact: true })
  await expect(marks).toHaveCount(1)
  await expect(page.locator('.login-visual .brand')).toHaveCount(0)
  expect(await brand.locator('img').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  if ((page.viewportSize()?.width ?? 0) >= 841) {
    const box = await brand.boundingBox()
    expect(box?.x).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) / 2)
  }
})
