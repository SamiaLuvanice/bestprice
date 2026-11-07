import { expect, test } from '@playwright/test'

// 0049/AC12 (achado I-1 da revisão I3): a tabela de produtos no shell com barra lateral não pode criar
// rolagem horizontal entre 1100 e 1440 px, mesmo com preço de 5 dígitos e nome longo.
const user = { id: 'u1', email: 'samia@example.com' }
function product(id: string, title: string, price: string, previous: string, change: string, percent: string) {
  return {
    id, external_id: `MLB${id.padStart(10, '1')}`, title, image_url: null, canonical_url: `https://produto.mercadolivre.com.br/MLB-${id}-x-_JM`,
    currency: 'BRL', price_context: 'mlb_marketplace_unit', current_price: price, previous_price: previous, min_price: price, max_price: previous,
    absolute_change: change, percentage_change: percent, availability: 'available', lookup_status: 'located', last_confirmed_availability: 'available',
    last_confirmed_availability_at: '2026-10-29T17:30:00Z', last_attempt_status: 'ok', last_attempt_at: '2026-10-29T17:30:00Z',
    last_success_at: '2026-10-29T17:30:00Z', last_price_observed_at: '2026-10-29T17:30:00Z', price_changed_at: '2026-10-29T17:30:00Z', stale: false,
  }
}
const tracked = [
  ['1', 'Notebook Inspiron 15 com tela grande e teclado numérico completo', '12879.00', '13139.00', '-260.00', '-1.98', '12700.00'],
  ['4', 'Fone Bluetooth', '329.00', '312.00', '17.00', '5.45', '300.00'],
].map(([id, title, price, previous, change, percent, target]) => ({
  id: `tracking-${id}`, active: true, active_since: '2026-10-01T12:00:00Z', product: product(id, title, price, previous, change, percent),
  alert: { id: `alert-${id}`, target_price: target, enabled: true, condition: 'at_or_below' },
}))

for (const path of ['/app/monitoring', '/produtos']) for (const width of [1024, 1100, 1200, 1280, 1440]) {
  test(`${path} sem rolagem horizontal a ${width} px (preço de 5 dígitos e nome longo)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo próprio teste')
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/me') return route.fulfill({ json: user })
      if (path === '/api/dashboard') return route.fulfill({ json: { summary: { tracked_count: 2, price_drop_count: 1, active_alert_count: 2, target_reached_count: 0 }, tracked_products: { items: tracked, next_cursor: null }, opportunities: tracked, recent_updates: [] } })
      if (path === '/api/tracked-products') return route.fulfill({ json: { items: tracked, next_cursor: null } })
      if (path.startsWith('/api/notifications')) return route.fulfill({ json: { items: [], next_cursor: null } })
      return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } })
    })
    await page.goto(path)
    await expect(page.getByText('Fone Bluetooth').first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }))
    expect(widths.scroll, `excesso de ${widths.scroll - widths.inner}px`).toBeLessThanOrEqual(widths.inner)
    if (width === 1440) {
      // A data continua numa linha na largura dos quadros (151:11).
      const lines = await page.locator('.products-table .relative-time').first().evaluate((element) => Math.round(element.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(element).lineHeight || '20')))
      expect(lines).toBeLessThanOrEqual(1)
    }
  })
}
