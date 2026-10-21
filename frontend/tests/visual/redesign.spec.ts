import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const product = {
  id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
  canonical_url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM', currency: 'BRL', price_context: 'mlb_marketplace_unit',
  current_price: '299.90', previous_price: '349.90', min_price: '279.90', max_price: '369.90',
  absolute_change: '-50.00', percentage_change: '-14.29', availability: 'available', lookup_status: 'located',
  last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-21T12:00:00Z',
  last_attempt_status: 'ok', last_attempt_at: '2026-10-21T12:00:00Z', last_success_at: '2026-10-21T12:00:00Z',
  last_price_observed_at: '2026-10-21T12:00:00Z', price_changed_at: '2026-10-21T12:00:00Z', stale: false,
}
const tracked = { id: 'tracking-1', active: true, active_since: '2026-10-01T12:00:00Z', product,
  alert: { id: 'alert-1', target_price: '279.90', enabled: true, condition: 'at_or_below' } }
const entries = ['369.90', '349.90', '359.90', '279.90', '319.90', '299.90'].map((price, index) => ({
  id: `history-${index}`, price, currency: 'BRL', captured_at: `2026-10-${String(index * 3 + 1).padStart(2, '0')}T12:00:00Z`,
}))

const scenarios = [
  { name: 'landing', path: '/', guest: true },
  { name: 'login', path: '/login', guest: true },
  { name: 'inicio', path: '/', guest: false },
  { name: 'produtos', path: '/produtos', guest: false },
  { name: 'detalhe', path: '/produtos/tracking-1', guest: false },
  { name: 'alertas', path: '/alertas', guest: false },
  { name: 'nao-encontrada', path: '/nao-existe', guest: true },
  { name: 'vazio', path: '/', guest: false, empty: true },
  { name: 'erro', path: '/', guest: false, error: true },
  { name: 'carregando', path: '/', guest: false, loading: true },
] as const

for (const scenario of scenarios) {
  test(`redesign ${scenario.name}: responsivo e recuperável`, async ({ page }, testInfo) => {
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      // Requisição pausada até o fechamento da página, para observar os esqueletos.
      if ('loading' in scenario && path === '/api/dashboard') return
      const error = { error: { code: 'unavailable', message: 'Não foi possível carregar o painel. Tente novamente.', fields: [] } }
      let body: unknown = { items: [], next_cursor: null }
      let status = 200
      if (path === '/api/auth/me') {
        status = scenario.guest ? 401 : 200
        body = scenario.guest ? error : { id: 'user-1', email: 'pessoa@example.com' }
      } else if (path === '/api/dashboard') {
        status = 'error' in scenario ? 503 : 200
        body = 'error' in scenario ? error : {
          summary: { tracked_count: 'empty' in scenario ? 0 : 1, price_drop_count: 'empty' in scenario ? 0 : 1, active_alert_count: 'empty' in scenario ? 0 : 1, target_reached_count: 0 },
          tracked_products: { items: 'empty' in scenario ? [] : [tracked], next_cursor: null },
          opportunities: 'empty' in scenario ? [] : [tracked], recent_updates: [],
        }
      } else if (path === '/api/tracked-products') body = { items: [tracked], next_cursor: null }
      else if (path.endsWith('/history')) body = { items: entries, next_cursor: 'older-records' }
      else if (path === '/api/tracked-products/tracking-1') body = tracked
      else if (path === '/api/notifications') body = { items: [{ id: 'notice-1', tracked_product_id: tracked.id, product_title: product.title,
        observed_price: '279.90', target_price: '279.90', created_at: '2026-10-21T12:00:00Z', read_at: null }], next_cursor: null }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto(scenario.path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (scenario.name === 'detalhe') {
      await expect(page.getByRole('img', { name: /Evolução do preço/ })).toBeVisible()
      await expect(page.locator('.recharts-line-curve')).toBeVisible()
      await expect(page.getByText(/Exibindo os registros carregados/)).toBeVisible()
    }
    if (scenario.name === 'vazio') await expect(page.getByText('Você ainda não está acompanhando nenhum produto.')).toBeVisible()
    if (scenario.name === 'erro') await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    if (scenario.name === 'carregando') await expect(page.getByText('Carregando seu painel…')).toBeVisible()
    await page.evaluate(async () => {
      for (const image of document.images) { image.loading = 'eager'; await image.decode().catch(() => undefined) }
      await document.fonts.ready
    })
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
    const smallControls = await page.locator('button:visible, a:visible, input:visible, summary:visible').evaluateAll((controls) => controls
      .filter((control) => {
        const box = control.getBoundingClientRect()
        return box.width < 43 || box.height < 43
      }).map((control) => control.textContent?.trim() || control.getAttribute('aria-label') || control.tagName))
    expect(smallControls).toEqual([])
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`${scenario.name}.png`), fullPage: true, animations: 'disabled' })
    if (!scenario.guest) await expect(page.getByRole('button', { name: /Conta: pessoa@example.com/ })).toBeVisible()
    if (scenario.name === 'produtos') {
      await page.getByRole('button', { name: 'Ações de Fone sem fio' }).click()
      const panel = page.getByRole('group', { name: 'Ações de Fone sem fio' })
      const stop = panel.getByRole('button', { name: 'Parar de monitorar' })
      await stop.scrollIntoViewIfNeeded()
      await expect(stop).toBeVisible()
      expect(await stop.evaluate((button) => {
        const box = button.getBoundingClientRect()
        return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
      })).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('menu-produto.png'), fullPage: true, animations: 'disabled' })
    }
  })
}
