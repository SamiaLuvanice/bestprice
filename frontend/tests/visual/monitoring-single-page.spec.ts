import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// 0063/AC12: página única de Monitoramento sem rolagem horizontal de 320 a 1440 px, itens
// empilhados no celular, alvos de 44 px e sem violações axe WCAG 2.2 AA (com produtos, vazia e erro).
const user = { id: 'u1', email: 'pessoa@example.com' }
function product(id: string, title: string, price: string | null, percent: string | null, availability = 'available') {
  return {
    id: `product-${id}`, external_id: `MLB${id.padStart(10, '1')}`, title, image_url: null, canonical_url: `https://produto.mercadolivre.com.br/MLB-${id}-x-_JM`,
    currency: 'BRL', price_context: 'mlb_marketplace_unit', current_price: price, previous_price: price, min_price: price, max_price: price,
    absolute_change: null, percentage_change: percent, availability, lookup_status: 'located', last_confirmed_availability: availability,
    last_confirmed_availability_at: '2026-10-29T17:30:00Z', last_attempt_status: 'ok', last_attempt_at: '2026-10-29T17:30:00Z',
    last_success_at: '2026-10-29T17:30:00Z', last_price_observed_at: '2026-10-29T17:30:00Z', price_changed_at: '2026-10-29T17:30:00Z', stale: false,
  }
}
const tracked = [
  ['1', 'Notebook Inspiron 15 com tela grande e teclado numérico completo', '12879.00', '-8.28'],
  ['2', 'Fone Bluetooth', '329.00', '5.45'],
  ['3', 'Monitor 27 polegadas', '1249.00', '0.00'],
  ['4', 'Teclado mecânico', '249.00', null, 'unavailable'],
  ['5', 'Mouse sem fio', null, null],
  ['6', 'Cadeira gamer com encosto reclinável', '899.00', null],
].map(([id, title, price, percent, availability]) => ({
  id: `tracking-${id}`, active: true, active_since: '2026-10-01T12:00:00Z', product: product(id!, title!, price ?? null, percent ?? null, availability ?? 'available'),
  alert: id === '1' ? { id: 'alert-1', target_price: '12700.00', enabled: true, condition: 'at_or_below' } : null,
}))
const summary = { tracked_count: 6, price_drop_count: 1, active_alert_count: 1, target_reached_count: 0 }
const updates = [{ id: 'u1', tracked_product_id: 'tracking-1', type: 'price_changed', previous_value: '13139.00', current_value: '12879.00', currency: 'BRL', observed_at: '2026-10-29T17:30:00Z' }]

type Mode = 'populated' | 'empty' | 'error'

async function open(page: Page, mode: Mode) {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ json: user })
    if (path === '/api/dashboard') {
      if (mode === 'error') return route.fulfill({ status: 503, json: { error: { code: 'unavailable', message: 'Não foi possível carregar o painel. Tente novamente.', fields: [] } } })
      const items = mode === 'empty' ? [] : tracked
      return route.fulfill({ json: { summary: mode === 'empty' ? { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 } : summary,
        tracked_products: { items, next_cursor: null }, opportunities: [], recent_updates: mode === 'empty' ? [] : updates } })
    }
    if (path === '/api/tracked-products') return route.fulfill({ json: { items: mode === 'empty' ? [] : tracked, next_cursor: null } })
    if (path.startsWith('/api/notifications')) return route.fulfill({ json: { items: [], next_cursor: null } })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } })
  })
  await page.goto('/app/monitoring')
  await expect(page.getByRole('heading', { level: 1, name: 'Monitoramento de preços' })).toBeVisible()
  if (mode === 'populated') await expect(page.getByText('Fone Bluetooth').first()).toBeVisible()
  if (mode === 'empty') await expect(page.getByRole('heading', { name: 'Nenhum produto acompanhado' })).toBeVisible()
  if (mode === 'error') await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o painel.')
  await page.evaluate(() => document.fonts.ready)
}

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`página única sem rolagem horizontal a ${width} px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo próprio teste')
    await page.setViewportSize({ width, height: 900 })
    await open(page, 'populated')
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }))
    expect(widths.scroll, `excesso de ${widths.scroll - widths.inner}px`).toBeLessThanOrEqual(widths.inner)
  })
}

test('no celular cada produto é um item empilhado com os dados essenciais e alvos de 44 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo próprio teste')
  await page.setViewportSize({ width: 390, height: 900 })
  await open(page, 'populated')
  const row = page.getByRole('rowgroup', { name: 'Fone Bluetooth' })
  for (const text of ['Fone Bluetooth', 'R$ 329,00', '+5,45%', 'Em alta', '29/10/2026']) await expect(row.getByText(text, { exact: false }).first()).toBeVisible()
  const box = await row.locator('.product-main').boundingBox()
  expect(box?.width ?? 0).toBeLessThanOrEqual(390)
  for (const target of [page.getByRole('link', { name: 'Ver alertas' }), page.getByRole('button', { name: /^Notificações/ }),
    page.getByRole('button', { name: /Adicionar anúncio/ }), row.getByRole('link', { name: /Ver detalhes/ })]) {
    const size = await target.boundingBox()
    expect(size?.height ?? 0, await target.textContent() ?? '').toBeGreaterThanOrEqual(44)
    expect(size?.width ?? 0).toBeGreaterThanOrEqual(44)
  }
})

for (const mode of ['populated', 'empty', 'error'] as const) for (const width of [390, 1280]) {
  test(`página única ${mode} sem violações axe a ${width} px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo próprio teste')
    await page.setViewportSize({ width, height: 900 })
    await open(page, mode)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(result.violations).toEqual([])
  })
}
