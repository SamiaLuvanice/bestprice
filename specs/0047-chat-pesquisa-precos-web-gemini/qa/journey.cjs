// QA 0047: jornada no navegador contra SPA (Vite) + API real + PostgreSQL descartável.
// Somente o transporte HTTP do Gemini é simulado (qa_app.py). Uso:
//   node journey.cjs on   -> AI_WEB_SEARCH_ENABLED=true
//   node journey.cjs off  -> AI_WEB_SEARCH_ENABLED=false
const path = require('node:path')
const fs = require('node:fs')
const FRONT = 'C:/Users/luvan/Learning/bestprice/.worktrees/feature-0047-issue-245-chat-pesquisa-precos-web/frontend'
const { chromium } = require(path.join(FRONT, 'node_modules/playwright'))
const { default: AxeBuilder } = require(path.join(FRONT, 'node_modules/@axe-core/playwright'))
const BASE = 'http://127.0.0.1:55473'
const mode = process.argv[2]
const out = path.join(__dirname, `shots-${mode}`)
fs.mkdirSync(out, { recursive: true })
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`) }
const notice = 'Sua pergunta pode ser pesquisada pelo Google'

async function send(page, text) {
  const box = page.getByLabel('Sua mensagem')
  await box.fill(text)
  const resp = page.waitForResponse((r) => r.url().endsWith('/api/ai/chat') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  return (await resp)
}

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  const external = []
  page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('about')) external.push(r.url()) })

  const pw = fs.readFileSync(path.join(__dirname, '.userpw'), 'utf8').trim()
  const login = await page.request.post(`${BASE}/api/auth/login`, { data: { email: 'qa0047@example.com', password: pw } })
  check('login sintético', login.status() === 200, `HTTP ${login.status()}`)
  const caps = await (await page.request.get(`${BASE}/api/ai/capabilities`)).json()
  check('capabilities.web_search', caps.web_search === (mode === 'on'), JSON.stringify({ enabled: caps.enabled, model: caps.model, web_search: caps.web_search }))
  check('capabilities.model 2.5-flash-lite', caps.model === 'gemini-2.5-flash-lite', caps.model)
  check('capabilities sem chave', !JSON.stringify(caps).includes('qa-fake-key'))

  await page.goto(`${BASE}/app/assistant`)
  await page.getByLabel('Sua mensagem').fill('x')
  await page.getByRole('button', { name: 'Enviar mensagem' }).and(page.locator(':enabled')).waitFor()
  await page.getByLabel('Sua mensagem').fill('')
  const composerNotice = await page.locator('.assistant-essential-notice').innerText()
  check(`aviso de privacidade extra ${mode === 'on' ? 'presente' : 'ausente'} antes do envio`, composerNotice.includes(notice) === (mode === 'on'), composerNotice)

  const r1 = await send(page, 'Quanto custa o notebook X hoje?')
  const b1 = await r1.json()
  check('POST /api/ai/chat 200', r1.status() === 200, `HTTP ${r1.status()}`)
  const g1 = b1.assistant_message?.grounding
  fs.writeFileSync(path.join(out, 'chat1.json'), JSON.stringify({ status: r1.status(), assistant_grounding: g1, user_grounding: b1.user_message?.grounding }, null, 2))
  await page.getByText(/Encontrei referências|Resposta sem pesquisa/).first().waitFor()
  const region = page.getByRole('region', { name: 'Fontes da pesquisa na web' })
  if (mode === 'on') {
    check('contrato: grounding.status searched', g1?.status === 'searched')
    check('contrato: searched_at UTC com Z', /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/.test(g1?.searched_at ?? ''), g1?.searched_at)
    check('contrato: só fontes https, sem duplicata, título do host', JSON.stringify(g1?.sources) === JSON.stringify([{ title: 'Loja QA — Notebook X', url: 'https://loja-qa.example/notebook-x' }, { title: 'outra-qa.example', url: 'https://outra-qa.example/oferta' }]), JSON.stringify(g1?.sources))
    check('contrato: user_message.grounding null', b1.user_message?.grounding === null)
    await region.waitFor()
    await region.getByText('Não verificado').waitFor({ state: 'visible' })
    check('UI: rótulo Não verificado', await region.getByText('Não verificado').isVisible(), await region.locator('strong').innerText())
    const time = region.locator('time')
    const dt = await time.getAttribute('datetime'); const shown = await time.innerText()
    const expected = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(dt))
    check('UI: data no fuso do usuário (America/Sao_Paulo)', dt === g1.searched_at && shown === expected, `datetime=${dt} exibido=${shown} esperado=${expected}`)
    const links = region.getByRole('link')
    check('UI: 2 links de fonte', (await links.count()) === 2)
    for (let i = 0; i < await links.count(); i++) {
      const a = links.nth(i)
      const [href, rel, target, name] = [await a.getAttribute('href'), await a.getAttribute('rel'), await a.getAttribute('target'), await a.evaluate((e) => e.textContent)]
      check(`UI: link ${i} https/noopener/_blank/nome`, href.startsWith('https://') && rel === 'noopener noreferrer' && target === '_blank' && name.includes('(abre em nova aba)'), `${href} rel=${rel} target=${target} nome="${name.trim()}"`)
    }
    const iframe = region.locator('iframe')
    const [sandbox, title, ref] = [await iframe.getAttribute('sandbox'), await iframe.getAttribute('title'), await iframe.getAttribute('referrerpolicy')]
    check('UI: iframe sandbox sem allow-scripts/allow-same-origin', sandbox === 'allow-popups allow-popups-to-escape-sandbox', sandbox)
    check('UI: iframe com nome acessível', title === 'Sugestões de pesquisa do Google', title)
    check('UI: iframe referrerpolicy no-referrer', ref === 'no-referrer', ref)
    const frame = await (await iframe.elementHandle()).contentFrame()
    await frame.waitForSelector('.c a')
    const ran = await frame.evaluate(() => document.body.getAttribute('data-qa-script-ran'))
    check('UI: script do HTML de sugestões não executou', ran === null, `data-qa-script-ran=${ran}`)
    check('UI: sugestões renderizadas intactas', (await frame.locator('.c a').count()) === 2)
    // Teclado e foco visível nas fontes.
    await page.getByLabel('Sua mensagem').focus()
    await links.first().focus()
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'))
    const outline = await links.first().evaluate((e) => getComputedStyle(e).outlineStyle)
    check('UI: foco por teclado e foco visível na fonte', focused === 'https://loja-qa.example/notebook-x' && outline !== 'none', `foco=${focused} outline=${outline}`)
  } else {
    check('contrato: grounding null com busca desligada', g1 === null, JSON.stringify(g1))
    check('UI: sem bloco de fontes', (await region.count()) === 0)
  }

  const conversationUrl = page.url()
  check('URL da conversa', /\/app\/assistant\/[0-9a-f-]{36}$/.test(conversationUrl), conversationUrl)

  if (mode === 'on') {
    const r2 = await send(page, '[qa-429] E em outra loja?')
    const g2 = (await r2.json()).assistant_message?.grounding
    check('429 no grounding: chat 200 com status unavailable', r2.status() === 200 && g2?.status === 'unavailable' && g2.sources.length === 0 && g2.search_suggestions_html === null, `HTTP ${r2.status()} ${JSON.stringify(g2)}`)
    await page.getByText('A pesquisa na web está indisponível agora; esta resposta não usou a web.').waitFor()
    check('UI: aviso de indisponibilidade', true)
    const r3 = await send(page, '[qa-sem-fonte] Quanto custa o produto Y?')
    const g3 = (await r3.json()).assistant_message?.grounding
    check('busca sem fontes: grounding null', r3.status() === 200 && g3 === null, JSON.stringify(g3))
    await page.getByText('Não encontrei preço confiável').waitFor()
    check('UI: um único bloco de fontes após 3 respostas', (await region.count()) === 1)

    // Persistência: recarregar mostra o mesmo bloco e o aviso.
    await page.reload()
    await region.waitFor()
    const after = await page.request.get(`${BASE}/api/ai/conversations/${conversationUrl.split('/').pop()}`)
    const conv = await after.json()
    const assistants = conv.messages.filter((m) => m.role === 'assistant').map((m) => m.grounding?.status ?? null)
    check('recarga: GET conversa devolve grounding persistido', JSON.stringify(assistants) === '["searched","unavailable",null]' && JSON.stringify(conv.messages.find((m) => m.grounding?.status === 'searched').grounding) === JSON.stringify(g1), JSON.stringify(assistants))
    check('recarga: bloco e aviso visíveis', (await region.count()) === 1 && await page.getByText('A pesquisa na web está indisponível agora').isVisible())

    // Viewports e axe (iframe do Google excluído, como na spec visual).
    for (const width of [320, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await region.scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const box = await region.boundingBox()
      const minLink = await region.getByRole('link').evaluateAll((els) => Math.min(...els.map((e) => e.getBoundingClientRect().height)))
      check(`viewport ${width}: sem overflow horizontal, bloco dentro, links >= 44px`, overflow <= 0 && box.x >= 0 && box.x + box.width <= width && minLink >= 44, `overflow=${overflow} bloco=[${Math.round(box.x)},${Math.round(box.x + box.width)}] menorLink=${minLink}`)
      await region.screenshot({ path: path.join(out, `bloco-${width}.png`) })
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    const axe = await new AxeBuilder({ page }).include('.message-grounding').exclude('.message-grounding iframe').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    check('axe no bloco de fontes: sem violações', axe.violations.length === 0, axe.violations.map((v) => v.id).join(','))

    // Falha de rede na UI: texto preservado, sem sucesso fictício.
    await page.route('**/api/ai/chat', (route) => route.abort('internetdisconnected'))
    await page.getByLabel('Sua mensagem').fill('Mensagem durante falha de rede')
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    const alert = page.getByRole('alert')
    await alert.first().waitFor()
    const alertText = await alert.first().innerText()
    const preserved = await page.getByLabel('Sua mensagem').inputValue()
    check('falha de rede: alerta e texto preservado', preserved === 'Mensagem durante falha de rede', `alerta="${alertText}" texto="${preserved}"`)
    await page.unroute('**/api/ai/chat')
    await page.screenshot({ path: path.join(out, 'falha-rede.png'), fullPage: true })

    // Análise de comparação: nunca envia tools.
    const comp = await page.request.post(`${BASE}/api/comparisons`, { data: { title: 'QA 0047', use_case: 'estudar', products: [
      { name: 'Notebook A', details: '16 GB', price: '3199.90', currency: 'BRL', url: null },
      { name: 'Notebook B', details: '8 GB', price: null, currency: 'BRL', url: null }] } })
    const cbody = await comp.json()
    const analyze = () => page.request.post(`${BASE}/api/comparisons/${cbody.id}/analyze`, { data: { request_id: crypto.randomUUID(), version: cbody.version } })
    let an = await analyze()
    if (an.status() === 429) {
      const wait = Number(an.headers()['retry-after'] ?? 60)
      check('cota local por minuto: análise recebe 429 com Retry-After após 3 chats', wait > 0, `Retry-After=${wait} corpo=${JSON.stringify(await an.json())}`)
      await page.waitForTimeout((wait + 1) * 1000)
      an = await analyze()
    }
    const abody = await an.json()
    fs.writeFileSync(path.join(out, 'analysis.json'), JSON.stringify({ create: comp.status(), analyze: an.status(), keys: Object.keys(abody), has_grounding: JSON.stringify(abody).includes('grounding') }, null, 2))
    check('comparação analisada (200) sem campo grounding', comp.status() === 201 && an.status() === 200 && !JSON.stringify(abody).includes('grounding'), `create=${comp.status()} analyze=${an.status()}`)
  } else {
    await page.reload()
    await page.getByText('Resposta sem pesquisa na web (QA).').waitFor()
    check('recarga: sem bloco de fontes com busca desligada', (await region.count()) === 0)
    await page.screenshot({ path: path.join(out, 'off.png'), fullPage: true })
  }
  check('nenhuma requisição do navegador fora de 127.0.0.1', external.length === 0, external.slice(0, 5).join(' '))
  const sandboxBlocks = consoleErrors.filter((e) => e.includes("Blocked script execution in 'about:srcdoc'"))
  if (mode === 'on') check('sandbox: navegador bloqueou o <script> do HTML de sugestões', sandboxBlocks.length > 0, `${sandboxBlocks.length} bloqueio(s)`)
  check('console sem outros erros (fora a falha de rede injetada e o bloqueio do sandbox)', consoleErrors.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|about:srcdoc/.test(e)).length === 0, consoleErrors.join(' | ').slice(0, 300))
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ mode, conversationUrl, results }, null, 2))
  await browser.close()
  const failed = results.filter((r) => !r.ok).length
  console.log(`\nRESUMO ${mode}: ${results.length - failed}/${results.length} passaram`)
  process.exit(failed ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })
