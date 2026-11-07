import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// 0049/AC05: captura cada seção do catálogo local (servidor de desenvolvimento) para o inventário.
// As capturas vão para test-results (evidência), não são baselines de regressão.
const sections = ['tokens', 'button', 'badge', 'input', 'card', 'table', 'skeleton', 'separator', 'empty-state', 'price-chart-card', 'pendentes']

test('catálogo do design system: seções, fonte local e acessibilidade', async ({ page }, testInfo) => {
  const fontRequests: string[] = []
  page.on('request', (request) => { if (request.resourceType() === 'font') fontRequests.push(request.url()) })
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }) }))
  await page.goto('/dev/design-system')
  await expect(page.getByRole('heading', { level: 1, name: 'Design system BestPrice 2026' })).toBeVisible()
  await expect(page.getByText('--sidebar-accent-foreground')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  for (const id of sections) {
    const section = page.locator(`[data-catalog-section="${id}"]`)
    await expect(section).toBeVisible()
    await section.screenshot({ path: testInfo.outputPath(`${id}.png`), animations: 'disabled' })
  }
  // AC14: nenhuma fonte de serviço externo; a Geist Mono vem do próprio servidor.
  expect(fontRequests.filter((url) => !url.startsWith(new URL(page.url()).origin))).toEqual([])
  expect(await page.evaluate(() => document.fonts.check('13px "Geist Mono"'))).toBe(true)
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target).slice(0, 5) }))).toEqual([])
})
