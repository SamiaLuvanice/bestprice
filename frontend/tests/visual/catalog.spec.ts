import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// 0049/AC05: captura cada seção do catálogo local (servidor de desenvolvimento) para o inventário.
// As capturas vão para test-results (evidência), não são baselines de regressão.
const sections = ['tokens', 'button', 'badge', 'input', 'selection', 'select', 'tabs', 'card', 'alert', 'alert-dialog', 'dropdown-menu',
  'tooltip', 'sonner', 'table', 'pagination', 'sidebar', 'avatar', 'progress', 'skeleton', 'separator', 'empty-state', 'price-chart-card']

async function openCatalog(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }) }))
  await page.goto('/dev/design-system')
  await expect(page.getByRole('heading', { level: 1, name: 'Design system BestPrice 2026' })).toBeVisible()
}

test('catálogo do design system: seções, fonte local e acessibilidade', async ({ page }, testInfo) => {
  const fontRequests: string[] = []
  page.on('request', (request) => { if (request.resourceType() === 'font') fontRequests.push(request.url()) })
  await openCatalog(page)
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

test('catálogo: estados abertos por teclado (select, menu, tooltip, diálogo e toast)', async ({ page }, testInfo) => {
  await openCatalog(page)
  const capture = (name: string) => page.screenshot({ path: testInfo.outputPath(`${name}.png`), animations: 'disabled' })

  await page.getByRole('combobox', { name: 'Ordenar por' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeVisible()
  await capture('select-aberto')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Ações do produto' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menu')).toBeVisible()
  await capture('menu-aberto')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Notificações' }).focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await capture('tooltip-aberto')

  await page.getByRole('button', { name: 'Parar de monitorar' }).first().focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('alertdialog', { name: 'Parar de monitorar?' })
  await expect(dialog).toBeVisible()
  await capture('dialogo-aberto')
  const dialogAccessibility = await new AxeBuilder({ page }).include('[role="alertdialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(dialogAccessibility.violations.map(({ id }) => id)).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Sucesso', exact: true }).click()
  await expect(page.locator('[data-sonner-toast]').getByText('Alerta criado.')).toBeVisible()
  await capture('toast')
})

test('catálogo: Button sm tem 36 px visíveis e alvo de toque de 44 px', async ({ page }) => {
  await openCatalog(page)
  const small = page.getByRole('button', { name: 'Pequeno', exact: true })
  const box = await small.boundingBox()
  expect(box?.height).toBe(36)
  const target = await small.evaluate((element) => {
    const after = getComputedStyle(element, '::after')
    return { height: after.height, position: getComputedStyle(element).position }
  })
  expect(target).toEqual({ height: '44px', position: 'relative' })
})
