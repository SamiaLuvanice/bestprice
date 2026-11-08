import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const summary = { id: 'c1', title: 'Notebook para estudar', kind: 'conversation', created_at: '2026-10-26T12:00:00Z', updated_at: '2026-10-30T12:00:00Z', expires_at: '2027-01-24T12:00:00Z' }
const messages = [
  { id: 'u1', role: 'user', content: 'Quero um notebook para estudar e programar, até R$ 3.500.', created_at: summary.created_at },
  { id: 'a1', role: 'assistant', content: 'Quais programas você pretende usar, além do navegador e das aulas on-line?', created_at: summary.updated_at },
]

async function api(page: Page, state: 'ready' | 'empty' | 'error' | 'disabled' | 'loading' = 'ready') {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let body: unknown
    let status = 200
    if (path === '/api/auth/me') body = { id: 'u1', email: 'pessoa@example.com' }
    else if (path === '/api/ai/capabilities') body = { enabled: state !== 'disabled', provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
    else if (path === '/api/research') {
      if (state === 'loading') return
      status = state === 'error' ? 503 : 200
      body = state === 'error' ? { error: { code: 'research_unavailable', message: 'Não foi possível carregar suas conversas.', fields: [] } } : { items: state === 'empty' ? [] : [summary, ...['Escolha de smartphone', 'Monitor para trabalhar', 'Fone com cancelamento de ruído'].map((title, index) => ({ ...summary, id: `recent-${index}`, title }))], next_offset: null }
    } else if (path === '/api/ai/conversations/c1') body = { ...summary, messages }
    else { status = 404; body = { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

async function fit(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const small = await page.locator('main button, main a, .research-topbar button, .research-bottom-nav a').evaluateAll((elements) => elements.filter((element) => {
    const box = element.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44)
  }).map((element) => element.textContent))
  expect(small).toEqual([])
}

test('inicial: composição, imagem original, navegação e acessibilidade', async ({ page }, info) => {
  await api(page)
  await page.goto('/app/assistant')
  await expect(page.getByRole('heading', { name: 'O que você quer comprar?' })).toBeVisible()
  const recentToggle = page.getByRole('button', { name: 'Conversas recentes', exact: true })
  await expect(recentToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('region', { name: 'Conversas recentes' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ver exemplos' })).toHaveCount(0)
  await expect(page.getByText('Sobre a IA e seus dados', { exact: true })).toHaveCount(0)
  const robot = page.getByRole('img', { name: 'Robô do assistente BestPrice IA' })
  await expect(robot).toBeVisible()
  // Visível não garante decodificada: sob carga a imagem de 1,1 MB ainda carrega após o toBeVisible.
  await expect.poll(() => robot.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  const geometry = await robot.evaluate((element: HTMLImageElement) => ({ width: element.clientWidth, height: element.clientHeight, originalWidth: element.naturalWidth, originalHeight: element.naturalHeight }))
  expect(Math.abs(geometry.width / geometry.height - geometry.originalWidth / geometry.originalHeight)).toBeLessThan(0.01)
  await fit(page)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.locator('main').click({ position: { x: 4, y: 4 } })
  await page.screenshot({ path: info.outputPath('assistant-initial.png'), fullPage: true })
  const chatRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/ai/chat') chatRequests.push(request.method())
  })
  await page.getByLabel('Sua mensagem').fill('Meu rascunho')
  await recentToggle.click()
  const recent = page.getByRole('region', { name: 'Conversas recentes' })
  await expect(recent.getByRole('listitem')).toHaveCount(4)
  await fit(page)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await recent.getByRole('link', { name: /Notebook para estudar/ }).focus()
  await page.keyboard.press('Escape')
  await expect(recentToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(recentToggle).toBeFocused()
  await expect(page.getByLabel('Sua mensagem')).toHaveValue('Meu rascunho')
  expect(chatRequests).toEqual([])
  if (info.project.name === 'viewport-390') {
    await page.getByLabel('Sua mensagem').fill('')
    await page.setViewportSize({ width: 390, height: 844 })
    const notice = await page.getByText(/O Google processa suas mensagens/).boundingBox()
    const send = await page.getByRole('button', { name: 'Enviar mensagem' }).boundingBox()
    const navigation = await page.getByRole('navigation', { name: 'Atalhos móveis' }).boundingBox()
    expect(notice!.y).toBeGreaterThanOrEqual(0)
    expect(notice!.y + notice!.height).toBeLessThanOrEqual(navigation!.y)
    expect(send!.y + send!.height).toBeLessThanOrEqual(navigation!.y)
    await page.locator('main').click({ position: { x: 4, y: 4 } })
    await page.screenshot({ path: info.outputPath('assistant-initial-390x844.png'), fullPage: true })
  }
})

test('conversa: retomada, texto longo e escrita móvel alcançável', async ({ page }, info) => {
  await api(page)
  await page.goto('/app/assistant')
  await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
  await page.getByRole('region', { name: 'Conversas recentes' }).getByRole('link', { name: /Notebook para estudar/ }).click()
  await expect(page.getByText('Quais programas você pretende usar, além do navegador e das aulas on-line?', { exact: true })).toBeVisible()
  await expect(page.locator('.assistant-welcome')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Conversas recentes', exact: true })).toHaveAttribute('aria-expanded', 'false')
  await page.getByLabel('Sua mensagem').fill('Notebook '.repeat(220))
  await page.getByLabel('Sua mensagem').focus()
  await page.getByRole('button', { name: 'Enviar mensagem' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeInViewport()
  if ((page.viewportSize()?.width ?? 0) < 960) {
    const send = await page.getByRole('button', { name: 'Enviar mensagem' }).boundingBox()
    const navigation = await page.getByRole('navigation', { name: 'Atalhos móveis' }).boundingBox()
    expect(send!.y + send!.height).toBeLessThanOrEqual(navigation!.y)
  }
  await fit(page)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.locator('main').click({ position: { x: 4, y: 4 } })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('assistant-conversation.png'), fullPage: true })
})

for (const state of ['empty', 'error', 'disabled', 'loading'] as const) {
  test(`estado ${state}: escrita e lista independentes`, async ({ page }, info) => {
    await api(page, state)
    await page.goto('/app/assistant')
    await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
    if (state === 'empty') await expect(page.getByText(/Nenhuma conversa ainda/)).toBeVisible()
    if (state === 'error') await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    if (state === 'loading') await expect(page.getByText('Carregando conversas recentes…')).toBeVisible()
    if (state === 'disabled') await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled()
    else await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled()
    await fit(page)
    await page.screenshot({ path: info.outputPath(`assistant-${state}.png`), fullPage: true })
    await page.getByLabel('Sua mensagem').fill('Meu rascunho')
    await expect(page.getByLabel('Sua mensagem')).toHaveValue('Meu rascunho')
  })
}

test('títulos e mensagens sem espaços não criam rolagem horizontal', async ({ page }) => {
  await api(page)
  await page.route('**/api/research?**', (route) => route.fulfill({ json: { items: [{ ...summary, title: 'Notebook'.repeat(50) }], next_offset: null } }))
  await page.route('**/api/ai/conversations/c1', (route) => route.fulfill({ json: { ...summary, title: 'Notebook'.repeat(50), messages: [{ ...messages[1], content: 'Mensagem'.repeat(200) }] } }))
  await page.goto('/app/assistant/c1')
  await expect(page.locator('.assistant-messages article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Conversas recentes' }).getByRole('listitem')).toHaveCount(1)
  await fit(page)
})

test('shell: teclado desktop e subnavegação móvel do monitoramento', async ({ page }) => {
  await api(page)
  if ((page.viewportSize()?.width ?? 0) >= 960) {
    await page.goto('/app/assistant')
    const last = page.getByRole('navigation', { name: 'Espaço de compras' }).getByRole('link', { name: 'Monitoramento' })
    await last.focus()
    await last.press('Tab')
    await expect(page.getByRole('button', { name: 'Conta: pessoa@example.com' })).toBeFocused()
  }
  await page.route('**/api/dashboard', (route) => route.fulfill({ json: { summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 }, opportunities: [], tracked_products: { items: [], next_cursor: null }, recent_updates: [] } }))
  await page.route('**/api/tracked-products', (route) => route.fulfill({ json: { items: [], next_cursor: null } }))
  await page.route('**/api/notifications**', (route) => route.fulfill({ json: { items: [], next_cursor: null } }))
  await page.goto('/app/monitoring/overview')
  await expect(page.getByRole('heading', { name: 'Seu painel de preços' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conta: pessoa@example.com' })).toHaveCount(1)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(page.getByRole('navigation', { name: 'Principal' }).locator('[aria-current="page"]')).toHaveCount(1)
  if ((page.viewportSize()?.width ?? 0) < 960) {
    const subnav = await page.getByRole('navigation', { name: 'Principal' }).boundingBox()
    const bottom = await page.getByRole('navigation', { name: 'Atalhos móveis' }).boundingBox()
    expect(subnav!.y + subnav!.height).toBeLessThan(bottom!.y)
  }
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Produtos' }).click()
  await expect(page).toHaveURL(/\/app\/monitoring$/)
  await expect(page.getByRole('heading', { name: 'Seus produtos' })).toBeVisible()
})
