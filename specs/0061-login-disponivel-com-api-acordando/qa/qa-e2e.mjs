// QA 0061: fluxo no navegador (Chromium do Playwright) contra Vite dev + servidor falso.
// Uso: node qa-e2e.mjs <frontendDir> <outDir> [cenário...]
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const [frontendDir, outDir, ...only] = process.argv.slice(2)
const require = createRequire(path.join(frontendDir, 'package.json'))
const { chromium } = require('@playwright/test')
const BASE = 'http://127.0.0.1:5199'
const CONTROL = 'http://127.0.0.1:8799/__control'
const NOTICE = 'Não conseguimos falar com o servidor agora. Ele pode estar iniciando; isso leva alguns segundos.'
fs.mkdirSync(outDir, { recursive: true })
const results = []

async function control(query) { await fetch(`${CONTROL}?${query}`) }
function record(name, ok, detail) { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, '-', detail) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function withPage(viewport, fn) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport, locale: 'pt-BR' })
  const page = await context.newPage()
  const meCalls = []
  const consoleErrors = []
  const t0 = Date.now()
  page.on('request', (r) => { if (r.url().includes('/api/')) meCalls.push({ t: ((Date.now() - t0) / 1000).toFixed(1), url: new URL(r.url()).pathname, method: r.method() }) })
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  try { return await fn(page, { meCalls, consoleErrors, t0 }) } finally { await browser.close() }
}

const noticeVisible = (page) => page.getByText(NOTICE).isVisible()
const elapsed = (t0) => ((Date.now() - t0) / 1000).toFixed(1)

const scenarios = {
  // AC14: API rápida e sem sessão → login sem aviso.
  async fast_login() {
    await control('wakeAfter=0&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page) => {
      await page.goto(`${BASE}/login`)
      await page.getByRole('heading', { name: 'Entrar na sua conta' }).waitFor()
      await sleep(1500)
      record('AC14 login rápido sem aviso', !(await noticeVisible(page)), `aviso visível=${await noticeVisible(page)}`)
    })
  },

  // AC01, AC02, AC04, AC07: 429 de hibernação por 12 s, depois 401.
  async login_hibernate() {
    await control('wakeAfter=12&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { meCalls, t0, consoleErrors }) => {
      await page.goto(`${BASE}/login`)
      await page.getByLabel('E-mail').waitFor({ timeout: 4000 })
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      const status = await page.locator('[role="status"]', { hasText: NOTICE }).count()
      const retryBtn = await page.getByRole('button', { name: 'Tentar novamente' }).count()
      const focused = await page.evaluate(() => document.activeElement?.id)
      const signupLink = await page.getByRole('link', { name: 'Criar conta' }).count()
      await page.screenshot({ path: path.join(outDir, 'login-aviso-desktop.png') })
      record('AC01/AC02 formulário + aviso como status', status === 1 && retryBtn === 0 && focused === 'login-title',
        `t=${elapsed(t0)}s status=${status} tentarNovamente=${retryBtn} foco=${focused} linkCriarConta=${signupLink}`)
      fs.writeFileSync(path.join(outDir, 'login-aviso.txt'), await page.locator('body').innerText())
      await page.getByLabel('E-mail').fill('qa@example.com')
      await page.getByLabel('Senha', { exact: true }).fill('digitada')
      await page.getByText(NOTICE).waitFor({ state: 'detached', timeout: 30000 })
      const goneAt = elapsed(t0)
      const email = await page.getByLabel('E-mail').inputValue()
      const pwd = await page.getByLabel('Senha', { exact: true }).inputValue()
      const link = await page.getByRole('link', { name: 'Criar conta' }).count()
      record('AC04 aviso some com 401 e preserva digitação', email === 'qa@example.com' && pwd === 'digitada', `aviso sumiu em t=${goneAt}s email=${email} senhaPreservada=${pwd === 'digitada'}`)
      record('AC07 link Criar conta aparece sem recarregar', link === 1, `links=${link}`)
      const before = meCalls.filter((c) => c.url === '/api/auth/me').length
      await sleep(10000)
      const after = meCalls.filter((c) => c.url === '/api/auth/me').length
      record('AC04 tentativas param após 401', before === after, `me antes=${before} depois de 10 s=${after}; chamadas=${JSON.stringify(meCalls)}`)
      await page.screenshot({ path: path.join(outDir, 'login-acordado-desktop.png') })
      if (consoleErrors.length) console.log('console errors:', consoleErrors.slice(0, 5))
    })
  },

  // Visual a 390 px.
  async login_mobile() {
    await control('wakeAfter=-1&slowMs=0&session=none')
    await withPage({ width: 390, height: 844 }, async (page) => {
      await page.goto(`${BASE}/login`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      await page.screenshot({ path: path.join(outDir, 'login-aviso-390.png'), fullPage: true })
      record('Visual 390 px sem rolagem horizontal', scrollW <= 390, `scrollWidth=${scrollW}`)
    })
  },

  // AC03 + AC05 (login bem-sucedido durante o despertar, sessão encontrada depois).
  async login_success_while_waking() {
    await control('wakeAfter=6&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/login?returnTo=%2Falertas`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      await page.getByLabel('E-mail').fill('qa@example.com')
      await page.getByLabel('Senha', { exact: true }).fill('certa')
      await sleep(4000) // ainda hibernando: envio devolve 429 sem envelope
      await page.getByRole('button', { name: 'Entrar' }).click()
      await sleep(800)
      const alert1 = await page.getByRole('alert').allInnerTexts()
      const notice1 = await noticeVisible(page)
      record('AC05 envio durante hibernação mostra erro atual e mantém aviso', notice1 && alert1.length > 0, `t=${elapsed(t0)}s alerta=${JSON.stringify(alert1)} aviso=${notice1}`)
      await sleep(3000) // acordou
      await page.getByLabel('Senha', { exact: true }).fill('certa')
      await page.getByRole('button', { name: 'Entrar' }).click()
      await page.waitForURL('**/alertas', { timeout: 10000 })
      await page.getByRole('heading', { name: 'Alertas', level: 1 }).waitFor({ timeout: 10000 })
      await sleep(8000)
      const url = new URL(page.url()).pathname
      record('AC05 login bem-sucedido segue ao returnTo e não é desfeito', url === '/alertas', `url após 8 s=${url}; chamadas=${JSON.stringify(meCalls)}`)
    })
  },

  // AC03 puro: sessão existente encontrada numa nova tentativa enquanto a pessoa digita.
  async login_session_found() {
    await control('wakeAfter=5&slowMs=0&session=user')
    await withPage({ width: 1280, height: 800 }, async (page, { t0 }) => {
      await page.goto(`${BASE}/login?returnTo=%2Fprodutos`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      await page.getByLabel('E-mail').pressSequentially('qa@exa', { delay: 100 })
      await page.waitForURL('**/produtos', { timeout: 20000 })
      record('AC03 sessão encontrada depois leva ao returnTo', true, `t=${elapsed(t0)}s url=${new URL(page.url()).pathname}`)
    })
  },

  // AC08: cadastro com API hibernando 8 s.
  async signup_hibernate() {
    await control('wakeAfter=8&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/cadastro`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      const loading = await page.getByText(/^Carregando…$/).count()
      const retry = await page.getByRole('button', { name: 'Tentar novamente' }).count()
      await page.screenshot({ path: path.join(outDir, 'cadastro-aviso-desktop.png') })
      record('AC08 Carregando… + aviso sem Tentar novamente', loading === 1 && retry === 0, `t=${elapsed(t0)}s carregando=${loading} tentar=${retry}`)
      await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor({ timeout: 30000 })
      record('AC08 formulário aparece quando o cadastro é confirmado', !(await noticeVisible(page)), `t=${elapsed(t0)}s url=${new URL(page.url()).pathname}; chamadas=${JSON.stringify(meCalls)}`)
    })
  },

  // AC10: área logada, sessão válida, hibernando 10 s.
  async area_hibernate() {
    await control('wakeAfter=10&slowMs=0&session=user')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/alertas`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      const loading = await page.getByText('Carregando sua conta…').count()
      await page.screenshot({ path: path.join(outDir, 'alertas-aviso-desktop.png') })
      record('AC10 Carregando sua conta… + aviso', loading === 1, `t=${elapsed(t0)}s`)
      await page.getByRole('heading', { name: 'Alertas', level: 1 }).waitFor({ timeout: 30000 })
      record('AC10 área abre quando a API acorda', true, `t=${elapsed(t0)}s chamadas=${JSON.stringify(meCalls.filter((c) => c.url === '/api/auth/me'))}`)
    })
  },

  // AC01 (demora) + AC12 sem paralelo: cada resposta segura 8 s, acorda em 25 s.
  async login_slow() {
    await control('wakeAfter=25&slowMs=8000&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/login`)
      await sleep(2500)
      const loading = await page.getByText('Carregando sua conta…').count()
      const formEarly = await page.getByLabel('E-mail').count()
      await page.getByText(NOTICE).waitFor({ timeout: 6000 })
      const shownAt = elapsed(t0)
      record('AC01 demora > 5 s mostra formulário + aviso', loading === 1 && formEarly === 0, `aos 2,5 s carregando=${loading} form=${formEarly}; aviso em t=${shownAt}s`)
      await page.getByText(NOTICE).waitFor({ state: 'detached', timeout: 60000 })
      const me = meCalls.filter((c) => c.url === '/api/auth/me')
      record('Modo lento: sem requisições paralelas e aviso some ao acordar', true, `aviso sumiu em t=${elapsed(t0)}s; me=${JSON.stringify(me)}`)
    })
  },

  // AC06 + AC12: nunca acorda; login mantém formulário após 60 s e chamadas param em 7.
  async login_never() {
    await control('wakeAfter=-1&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/login`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      await sleep(75000)
      const form = await page.getByLabel('E-mail').count()
      const retry = await page.getByRole('button', { name: 'Tentar novamente' }).count()
      const me = meCalls.filter((c) => c.url === '/api/auth/me')
      const signup = meCalls.filter((c) => c.url === '/api/auth/signup')
      record('AC06 fim da janela mantém formulário + aviso', form === 1 && retry === 0 && await noticeVisible(page), `t=${elapsed(t0)}s form=${form} tentar=${retry}`)
      record('AC12 no máximo 1+6 consultas, nenhuma após 60 s', me.length <= 7 && signup.length <= 7, `me=${me.length} ${JSON.stringify(me.map((c) => c.t))} signup=${signup.length} ${JSON.stringify(signup.map((c) => c.t))}`)
    })
  },

  // AC11: área logada, nunca acorda; erro aos 60 s; Tentar novamente abre nova janela.
  async area_never() {
    await control('wakeAfter=-1&slowMs=0&session=user')
    await withPage({ width: 1280, height: 800 }, async (page, { t0, meCalls }) => {
      await page.goto(`${BASE}/alertas`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      await sleep(55000)
      const early = await page.getByRole('button', { name: 'Tentar novamente' }).count()
      await page.getByRole('button', { name: 'Tentar novamente' }).waitFor({ timeout: 10000 })
      const at = elapsed(t0)
      const alertText = await page.getByRole('alert').innerText()
      await page.screenshot({ path: path.join(outDir, 'alertas-esgotado-desktop.png') })
      record('AC11 erro só no fim da janela', early === 0, `botão aos 55 s=${early}; erro em t=${at}s texto="${alertText}"`)
      await control('wakeAfter=0')
      await page.getByRole('button', { name: 'Tentar novamente' }).click()
      await page.getByRole('heading', { name: 'Alertas', level: 1 }).waitFor({ timeout: 10000 })
      record('AC11 Tentar novamente abre nova janela e a área abre', true, `me=${meCalls.filter((c) => c.url === '/api/auth/me').length}`)
    })
  },

  // Falha de rede na interface: fetch abortado no navegador (network_error), depois liberado.
  async login_network() {
    await control('wakeAfter=0&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { t0 }) => {
      let block = true
      await page.route('**/api/auth/**', (route) => block ? route.abort('internetdisconnected') : route.continue())
      await page.goto(`${BASE}/login`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      const form = await page.getByLabel('E-mail').count()
      record('Falha de rede: formulário + aviso', form === 1, `t=${elapsed(t0)}s`)
      block = false
      await page.getByText(NOTICE).waitFor({ state: 'detached', timeout: 20000 })
      record('Falha de rede: aviso some quando a rede volta', true, `t=${elapsed(t0)}s`)
    })
  },

  // AC13: login → cadastro mantém janela; → landing para tentativas.
  async navigation() {
    await control('wakeAfter=-1&slowMs=0&session=none')
    await withPage({ width: 1280, height: 800 }, async (page, { meCalls }) => {
      await page.goto(`${BASE}/login`)
      await page.getByText(NOTICE).waitFor({ timeout: 4000 })
      await sleep(2500)
      // Navegação SPA pelo histórico (sem recarregar).
      await page.evaluate(() => { history.pushState({}, '', '/cadastro'); dispatchEvent(new PopStateEvent('popstate')) })
      await sleep(5000)
      const me1 = meCalls.filter((c) => c.url === '/api/auth/me').map((c) => c.t)
      await page.evaluate(() => { history.pushState({}, '', '/'); dispatchEvent(new PopStateEvent('popstate')) })
      const n = meCalls.length
      await sleep(20000)
      record('AC13 landing para as tentativas', meCalls.length === n, `chamadas /api na landing em 20 s=${meCalls.length - n}; me até sair=${JSON.stringify(me1)}`)
    })
  },
}

for (const [name, fn] of Object.entries(scenarios)) {
  if (only.length && !only.includes(name)) continue
  console.log(`--- ${name}`)
  try { await fn() } catch (error) { record(name, false, `exceção: ${error.message.split('\n')[0]}`) }
}
fs.writeFileSync(path.join(outDir, 'e2e-results.json'), JSON.stringify(results, null, 2))
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} verificações OK`)
