import { expect, test, type Page } from '@playwright/test'

// 0049/AC12: títulos usam `font-stretch: expanded`; onde a SF Pro Expanded existe (Apple/WebKit),
// eles ficam mais largos. O WebKit do Playwright não está instalado neste ambiente (instalar é baixar
// um binário, fora do escopo), então a largura extra é simulada: h1/h2 recebem +0,14em de tracking,
// cerca de 25% a mais de largura média por caractere, acima da diferença entre SF Pro e SF Pro Expanded.
// Em 320 px, nenhuma tela das listas A e B pode ganhar rolagem horizontal.

const user = { id: 'u1', email: 'pessoa@example.com' }
const fail = (code: string, message: string) => ({ error: { code, message, fields: [], tracked_product_id: null, retry_after_seconds: null } })
const conversation = { id: 'c1', title: 'Notebook para programação e estudos avançados', kind: 'conversation', created_at: '2026-10-26T12:00:00Z', updated_at: '2026-10-30T12:00:00Z', expires_at: '2027-01-24T12:00:00Z' }
const product = {
  id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio com cancelamento de ruído', image_url: null,
  canonical_url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM', currency: 'BRL', price_context: 'mlb_marketplace_unit',
  current_price: '299.90', previous_price: '349.90', min_price: '279.90', max_price: '369.90', absolute_change: '-50.00', percentage_change: '-14.29',
  availability: 'available', lookup_status: 'located', last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-21T12:00:00Z',
  last_attempt_status: 'ok', last_attempt_at: '2026-10-21T12:00:00Z', last_success_at: '2026-10-21T12:00:00Z',
  last_price_observed_at: '2026-10-21T12:00:00Z', price_changed_at: '2026-10-21T12:00:00Z', stale: false,
}
const tracked = { id: 'tracking-1', active: true, active_since: '2026-10-01T12:00:00Z', product, alert: { id: 'a1', target_price: '279.90', enabled: true, condition: 'at_or_below' } }

async function api(page: Page, guest: boolean) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return guest ? route.fulfill({ status: 401, json: fail('unauthenticated', 'Entre para continuar.') }) : route.fulfill({ json: user })
    if (path === '/api/auth/signup') return route.fulfill({ json: { enabled: true } })
    if (path === '/api/ai/capabilities') return route.fulfill({ json: { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 } })
    if (path === '/api/research') return route.fulfill({ json: { items: [conversation], next_offset: null } })
    if (path === '/api/ai/conversations/c1') return route.fulfill({ json: { ...conversation, messages: [{ id: 'm1', role: 'assistant', content: 'Quais programas você pretende usar?', created_at: conversation.created_at }] } })
    if (path === '/api/dashboard') return route.fulfill({ json: { summary: { tracked_count: 1, price_drop_count: 1, active_alert_count: 1, target_reached_count: 0 }, tracked_products: { items: [tracked], next_cursor: null }, opportunities: [tracked], recent_updates: [] } })
    if (path === '/api/tracked-products') return route.fulfill({ json: { items: [tracked], next_cursor: null } })
    if (path === '/api/tracked-products/tracking-1') return route.fulfill({ json: tracked })
    if (path.endsWith('/history')) return route.fulfill({ json: { items: [], next_cursor: null } })
    if (path.startsWith('/api/notifications')) return route.fulfill({ json: { items: [], next_cursor: null } })
    return route.fulfill({ status: 404, json: fail('not_found', 'Recurso não encontrado.') })
  })
}

const pages: [string, string, boolean][] = [
  ['A · Entrar', '/login', true], ['A · Criar conta', '/cadastro', true], ['A · Assistente', '/app/assistant', false],
  ['A · Conversa', '/app/assistant/c1', false], ['A · Histórico', '/app/history', false], ['A · Monitoramento', '/app/monitoring', false],
  ['B · Produtos', '/produtos', false], ['B · Detalhe', '/produtos/tracking-1', false], ['B · Alertas', '/alertas', false],
  ['B · Comparador', '/app/compare', false], ['B · Landing', '/', true], ['B · Não encontrada', '/nao-existe', true],
]

for (const [name, path, guest] of pages) {
  test(`títulos largos não criam rolagem horizontal a 320 px: ${name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-320', 'verificação a 320 px')
    await api(page, guest)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await page.addStyleTag({ content: 'h1, h2 { letter-spacing: .14em !important; }' })
    await page.evaluate(() => document.fonts.ready)
    const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth,
      wide: Array.from(document.querySelectorAll('h1, h2')).filter((element) => element.getBoundingClientRect().right > innerWidth + 0.5).map((element) => element.textContent) }))
    expect(widths.wide).toEqual([])
    expect(widths.page).toBeLessThanOrEqual(widths.viewport)
  })
}
