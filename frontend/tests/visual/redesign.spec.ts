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
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`${scenario.name}.png`), fullPage: true, animations: 'disabled' })
    if (!scenario.guest) await expect(page.getByRole('button', { name: /Conta: pessoa@example.com/ })).toBeVisible()
    if (!scenario.guest) {
      // 0028/AC12: cabeçalho e conteúdo começam na mesma margem lateral.
      const edges = await page.evaluate(() => ({
        header: document.querySelector('.app-header-inner')?.getBoundingClientRect().left,
        content: document.querySelector('main .content, main .hero')?.getBoundingClientRect().left,
      }))
      expect(edges.header).toBeDefined()
      expect(Math.abs((edges.header ?? 0) - (edges.content ?? -99))).toBeLessThanOrEqual(1)
    }
    // Abaixo de 960 px o menu ⋮ fica oculto: a linha leva ao detalhe (teste da linha compacta).
    if (scenario.name === 'produtos' && (page.viewportSize()?.width ?? 0) >= 960) {
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

// 0028/AC04: utilitários do tema produzem as cores documentadas em designsystem/README.md.
test('tokens: bg-primary, text-primary, text-muted, text-muted-foreground e bg-muted', async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }) }))
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const colors = await page.evaluate(() => {
    const probe = (classes: string) => {
      const element = document.createElement('span')
      element.className = classes
      document.body.append(element)
      const style = getComputedStyle(element)
      const result = { color: style.color, background: style.backgroundColor }
      element.remove()
      return result
    }
    return {
      bgPrimary: probe('bg-primary').background,
      textPrimary: probe('text-primary').color,
      textPrimaryForeground: probe('text-primary-foreground').color,
      textMutedForeground: probe('text-muted-foreground').color,
      textMuted: probe('text-muted').color,
      bgMuted: probe('bg-muted').background,
      bgAction: probe('bg-action').background,
      textActionForeground: probe('text-action-foreground').color,
    }
  })
  expect(colors).toEqual({
    bgPrimary: 'rgb(199, 0, 94)', textPrimary: 'rgb(199, 0, 94)', textPrimaryForeground: 'rgb(255, 255, 255)',
    textMutedForeground: 'rgb(98, 98, 103)', textMuted: 'rgb(98, 98, 103)', bgMuted: 'rgb(245, 245, 247)',
    bgAction: 'rgb(57, 255, 20)', textActionForeground: 'rgb(0, 0, 0)',
  })
})

// 0028/AC01: com título longo, a imagem do detalhe mantém tamanho e proporção em 320 e 390 px.
for (const width of [320, 390]) {
  test(`detalhe com título longo mantém a imagem em ${width}px`, async ({ page }) => {
    const longTitle = 'Fone de ouvido sem fio com cancelamento ativo de ruído, estojo de carregamento e garantia estendida do fabricante'
    const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ccc"/></svg>')
    const detail = { ...tracked, product: { ...product, title: longTitle, image_url: 'https://http2.mlstatic.com/D_NQ_NP_000000-MLA0000000000_000000-O.webp' } }
    await page.setViewportSize({ width, height: 800 })
    await page.route('https://http2.mlstatic.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: decodeURIComponent(image.slice(image.indexOf(',') + 1)) }))
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      let body: unknown = { items: [], next_cursor: null }
      if (path === '/api/auth/me') body = { id: 'user-1', email: 'pessoa@example.com' }
      else if (path.endsWith('/history')) body = { items: entries, next_cursor: null }
      else if (path === '/api/tracked-products/tracking-1') body = detail
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto('/produtos/tracking-1')
    await expect(page.getByRole('heading', { level: 1, name: longTitle })).toBeVisible()
    const box = await page.locator('.detail-product-heading .product-image').boundingBox()
    expect(box?.width).toBe(80)
    expect(box?.height).toBe(80)
  })
}

// Revisão 0028 (AC05): no celular a linha segue o quadro 11 (~139 px): imagem, título, preço,
// pílula e seta; a linha inteira leva ao detalhe, que concentra Atualizar agora e Parar.
test('Produtos em 390px usa linha compacta que abre o detalhe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let body: unknown = { items: [], next_cursor: null }
    if (path === '/api/auth/me') body = { id: 'user-1', email: 'pessoa@example.com' }
    else if (path === '/api/dashboard') body = { summary: { tracked_count: 1, price_drop_count: 1, active_alert_count: 1, target_reached_count: 0 },
      tracked_products: { items: [tracked], next_cursor: null }, opportunities: [], recent_updates: [] }
    else if (path === '/api/tracked-products') body = { items: [tracked], next_cursor: null }
    else if (path.endsWith('/history')) body = { items: entries, next_cursor: null }
    else if (path === '/api/tracked-products/tracking-1') body = tracked
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto('/produtos')
  const row = page.getByRole('rowgroup', { name: 'Fone sem fio' })
  await expect(row).toBeVisible()
  const height = (await row.boundingBox())?.height ?? 999
  expect(height).toBeLessThanOrEqual(140)
  await expect(row.getByRole('button', { name: 'Ações de Fone sem fio' })).toBeHidden()
  await expect(row.getByText('Disponível')).toBeHidden()
  await expect(row.getByText(/Alerta em/)).toBeHidden()
  const link = row.getByRole('link', { name: 'Ver detalhes de Fone sem fio' })
  const box = await link.boundingBox()
  expect(box?.width).toBeGreaterThanOrEqual(44)
  expect(box?.height).toBeGreaterThanOrEqual(44)
  const rowBox = await row.boundingBox()
  await page.mouse.click((rowBox?.x ?? 0) + 120, (rowBox?.y ?? 0) + 20)
  await expect(page).toHaveURL(/\/produtos\/tracking-1$/)
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Parar de monitorar' })).toBeVisible()
})
