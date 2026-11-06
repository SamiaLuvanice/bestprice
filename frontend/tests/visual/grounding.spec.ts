import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Spec 0047 (AC07/AC09): bloco de pesquisa na web nas mensagens do assistente, com dados simulados
// na fronteira HTTP. O HTML do Google (iframe) fica fora do axe: não é nosso e não pode ser alterado.
// Sem baseline: verifica overflow, alvos, foco e a11y e guarda capturas nas 5 larguras.
const at = '2026-11-04T12:00:00Z'
const summary = { id: 'c1', title: 'Preço de notebook', kind: 'conversation', created_at: at, updated_at: at, expires_at: '2027-02-02T12:00:00Z' }
const suggestions = '<style>.c{font:14px sans-serif;display:flex;gap:8px;flex-wrap:wrap}.c a{padding:6px 12px;border:1px solid #ccc;border-radius:16px;color:#1f1f1f;text-decoration:none}</style><div class="c"><a href="https://www.google.com/search?q=notebook+pre%C3%A7o">notebook preço</a><a href="https://www.google.com/search?q=notebook+oferta">notebook oferta</a></div>'
const messages = [
  { id: 'u1', role: 'user', content: 'Quanto custa o notebook X hoje?', created_at: at, grounding: null },
  { id: 'a1', role: 'assistant', content: 'Encontrei referências entre R$ 3.199,00 e R$ 3.499,00. Confira na loja antes de comprar.', created_at: at,
    grounding: { status: 'searched', searched_at: at, sources: [
      { title: 'Loja Exemplo — Notebook X 16 GB 512 GB SSD com título bem longo para testar quebra de linha', url: 'https://loja.example/notebook-x' },
      { title: 'Outra Loja', url: 'https://outra.example/oferta' }], search_suggestions_html: suggestions } },
  { id: 'u2', role: 'user', content: 'E em outra loja?', created_at: at, grounding: null },
  { id: 'a2', role: 'assistant', content: 'Não consegui pesquisar agora.', created_at: at, grounding: { status: 'unavailable', searched_at: at, sources: [], search_suggestions_html: null } },
]

async function api(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let body: unknown = { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } }
    let status = 200
    if (path === '/api/auth/me') body = { id: 'u1', email: 'pessoa@example.com' }
    else if (path === '/api/ai/capabilities') body = { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20, web_search: true }
    else if (path === '/api/research') body = { items: [summary], next_offset: null }
    else if (path === '/api/ai/conversations/c1') body = { ...summary, messages }
    else status = 404
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

test('bloco de pesquisa na web cabe e é acessível em 320/390/768/1280/1440 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'viewport-1280', 'percorre as cinco larguras em um único projeto')
  test.setTimeout(120_000)
  await api(page)
  await page.goto('/app/assistant/c1')
  const block = page.getByRole('region', { name: 'Fontes da pesquisa na web' })
  await expect(block).toBeVisible()
  await expect(page.getByText(/pode ser pesquisada pelo Google/)).toBeVisible()
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow em ${width}px`).toBe(true)
    const frame = await block.locator('iframe').boundingBox()
    const area = await block.boundingBox()
    expect(frame!.x + frame!.width, `iframe excede o bloco em ${width}px`).toBeLessThanOrEqual(area!.x + area!.width + 0.5)
    const small = await block.getByRole('link').evaluateAll((links) => links.filter((link) => link.getBoundingClientRect().height < 44).map((link) => link.textContent))
    expect(small, `alvos < 44px em ${width}px`).toEqual([])
    await block.scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`grounding-${width}.png`), fullPage: true })
  }
  const first = block.getByRole('link', { name: /Loja Exemplo.*\(abre em nova aba\)/ })
  await first.focus()
  await expect(first).toBeFocused()
  expect(await first.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Tab')
  await expect(block.getByRole('link', { name: /Outra Loja/ })).toBeFocused()
  expect((await new AxeBuilder({ page }).exclude('.message-grounding-suggestions').analyze()).violations).toEqual([])
})

test('chip de sugestão do Google abre em nova página sem navegar o iframe nem enviar referrer', async ({ page }, info) => {
  test.skip(info.project.name !== 'viewport-1280', 'comportamento independente da largura')
  test.setTimeout(120_000)
  const google: { url: string; referer: string | undefined }[] = []
  // Nada sai da máquina: as navegações para o Google são atendidas localmente.
  await page.context().route('https://www.google.com/**', async (route) => {
    google.push({ url: route.request().url(), referer: route.request().headers()['referer'] })
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Google simulado</title>' })
  })
  await api(page)
  await page.goto('/app/assistant/c1')
  const frame = page.frameLocator('iframe[title="Sugestões de pesquisa do Google"]')
  const popupPromise = page.waitForEvent('popup', { timeout: 5_000 })
  await frame.getByRole('link', { name: 'notebook preço' }).click()
  const popup = await popupPromise
  await popup.waitForLoadState()
  expect(popup.url()).toBe('https://www.google.com/search?q=notebook+pre%C3%A7o')
  expect(google.map((entry) => entry.referer)).toEqual([undefined])
  const iframe = page.frames().find((item) => item !== page.mainFrame() && item.parentFrame() === page.mainFrame())!
  expect(iframe.url()).toBe('about:srcdoc')
})
