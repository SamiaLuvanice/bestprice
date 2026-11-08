import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test'
import { landingMotion } from '../../src/landing/motion'

// Spec 0050 (F19): landing pública nova. A página usa rolagem suave (scroll-behavior); os testes
// rolam com behavior 'instant' para medir a posição final.
// A API é simulada por interceptação de rede; nenhum
// backend é necessário. Testes de largura fixa rodam só no projeto viewport-1280 e ajustam o
// tamanho da janela; os de acessibilidade rodam em todas as larguras (320, 390, 768, 1280).

type Session = 'guest' | 'user' | 'loading' | 'error'
type Signup = 'enabled' | 'disabled' | 'loading' | 'error'
type Recorded = { method: string; url: string; body: string }

const user = { id: 'user-1', email: 'pessoa@example.com' }
const fail = (code: string, message: string) => ({ error: { code, message, fields: [], tracked_product_id: null, retry_after_seconds: null } })
const emptyDashboard = {
  summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
  tracked_products: { items: [], next_cursor: null }, opportunities: [], recent_updates: [],
}
const LINK = 'https://produto.mercadolivre.com.br/MLB-4012345678-smartphone-exemplo-_JM'
const LINK_MARK = 'MLB-4012345678'
const signupMonitoring = '/cadastro?returnTo=%2Fapp%2Fmonitoring'
const loginMonitoring = '/login?returnTo=%2Fapp%2Fmonitoring'
const STORAGE_KEY = 'bestprice.pendingTrackLink'

/** Simula /api para a página (ou o contexto) e registra cada requisição feita. */
async function api(target: Page | BrowserContext, { session = 'guest', signup = 'disabled' }: { session?: Session; signup?: Signup } = {}) {
  const requests: Recorded[] = []
  let loggedIn = session === 'user'
  await target.route('**/api/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? '' })
    const path = url.pathname
    if (path === '/api/auth/me') {
      if (session === 'loading' && !loggedIn) return
      if (session === 'error' && !loggedIn) return route.fulfill({ status: 503, json: fail('unavailable', 'Serviço indisponível.') })
      return loggedIn ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: fail('unauthenticated', 'Entre para continuar.') })
    }
    if (path === '/api/auth/signup' && request.method() === 'GET') {
      if (signup === 'loading') return
      if (signup === 'error') return route.fulfill({ status: 503, json: fail('unavailable', 'Serviço indisponível.') })
      return route.fulfill({ json: { enabled: signup === 'enabled' } })
    }
    if (path === '/api/auth/signup' || path === '/api/auth/login') {
      loggedIn = true
      return route.fulfill({ status: path === '/api/auth/signup' ? 201 : 200, json: user })
    }
    if (path === '/api/dashboard') return route.fulfill({ json: emptyDashboard })
    if (path === '/api/ai/capabilities') return route.fulfill({ json: { enabled: false, provider: 'google', model: 'x', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 } })
    if (path === '/api/research') return route.fulfill({ json: { items: [], next_offset: null } })
    return route.fulfill({ json: { items: [], next_cursor: null } })
  })
  return requests
}

const heroField = (page: Page) => page.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
const monitoringField = (page: Page) => page.getByLabel('Link do anúncio do Mercado Livre')

async function sendFromHero(page: Page, value: string) {
  await heroField(page).fill(value)
  await page.getByRole('button', { name: 'Monitorar preço' }).click()
}

async function login(page: Page) {
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill('senha-segura-123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

/** Dois quadros de animação: o rAF da página (progresso, observadores) já rodou depois disso. */
const frames = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

function onlyOn1280(projectName: string) {
  test.skip(projectName !== 'viewport-1280', 'comportamento independente da largura: roda num só projeto')
}

function expectNoLink(page: Page, requests: Recorded[]) {
  expect(page.url()).not.toContain(LINK_MARK)
  expect(requests.filter((request) => request.url.includes(LINK_MARK) || request.body.includes(LINK_MARK))).toEqual([])
}

// ---------- AC03: matriz de destinos ----------
test.describe('AC03 — destinos das ações', () => {
  const cases: [string, Session, Signup, string, string][] = [
    ['sem sessão, cadastro ligado', 'guest', 'enabled', signupMonitoring, '/login'],
    ['sem sessão, cadastro desligado', 'guest', 'disabled', loginMonitoring, '/login'],
    ['sem sessão, cadastro carregando', 'guest', 'loading', loginMonitoring, '/login'],
    ['sem sessão, cadastro com falha', 'guest', 'error', loginMonitoring, '/login'],
    ['sessão em verificação, cadastro ligado', 'loading', 'enabled', signupMonitoring, '/login'],
    ['sessão com falha na verificação, cadastro ligado', 'error', 'enabled', signupMonitoring, '/login'],
    ['com sessão', 'user', 'enabled', '/app/monitoring', '/app/dashboard'],
  ]
  for (const [name, session, signup, monitor, entry] of cases) {
    test(name, async ({ page }, info) => {
      onlyOn1280(info.project.name)
      await api(page, { session, signup })
      // Espera as respostas simuladas que existem (as de "carregando" nunca chegam) antes de conferir.
      const answered = [
        ...(session === 'loading' ? [] : [page.waitForResponse((response) => response.url().endsWith('/api/auth/me'))]),
        ...(signup === 'loading' ? [] : [page.waitForResponse((response) => response.url().endsWith('/api/auth/signup'))]),
      ]
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Pare de dar F5 no preço.' })).toBeVisible()
      await Promise.all(answered)
      await frames(page)
      const monitorLinks = page.getByRole('link', { name: /^(Começar a monitorar|Começar|Monitorar um anúncio)$/ })
      // "Começar" (barra fixa) só existe abaixo de 768 px; o Vitest confere os quatro.
      expect(await monitorLinks.count()).toBeGreaterThanOrEqual(3)
      for (const link of await monitorLinks.all()) await expect(link).toHaveAttribute('href', monitor)
      const entryLinks = page.getByRole('link', { name: /^(Entrar|Já tenho conta)$/ })
      expect(await entryLinks.count()).toBeGreaterThanOrEqual(3)
      for (const link of await entryLinks.all()) await expect(link).toHaveAttribute('href', entry)
    })
  }

  test('âncoras rolam até a seção sem sair da página', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Perguntas' }).click()
    await expect(page).toHaveURL(/\/#perguntas$/)
    await expect(page.getByRole('heading', { name: /antes de colar o primeiro link/ })).toBeInViewport()
  })

  test('depois de concluir Entrar, "Entrar" leva ao destino padrão', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    await page.getByRole('banner').getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
    await login(page)
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })
})

// ---------- AC04, AC05 e AC07: o link do hero ----------
test.describe('AC04/AC05/AC07 — link do hero até o monitoramento', () => {
  test('sem sessão: recarregar, alternar Entrar ↔ Criar conta e voltar não perdem o link; Entrar leva ao monitoramento', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    const requests = await api(page, { signup: 'enabled' })
    await page.goto('/')
    await sendFromHero(page, `   ${LINK}   `)
    await expect(page).toHaveURL(new RegExp(`${signupMonitoring.replace(/[?]/g, '\\?')}$`))
    await expect(page.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible()
    expectNoLink(page, requests)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible()
    expectNoLink(page, requests)
    await page.getByRole('link', { name: 'Entrar', exact: true }).last().click()
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    expectNoLink(page, requests)
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    expectNoLink(page, requests)
    await login(page)
    await expect(page).toHaveURL(/\/app\/monitoring$/)
    await expect(monitoringField(page)).toHaveValue(LINK)
    await expect(monitoringField(page)).toBeFocused()
    expectNoLink(page, requests)
    expect(requests.filter((request) => request.method === 'POST' && request.url.includes('/api/tracked-products'))).toEqual([])
    expect(await page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull()
  })

  test('sem sessão e cadastro ligado: concluir Criar conta leva ao monitoramento com o link', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    const requests = await api(page, { signup: 'enabled' })
    await page.goto('/')
    await sendFromHero(page, LINK)
    await page.getByLabel('E-mail').fill(user.email)
    await page.getByLabel('Senha', { exact: true }).fill('senha-segura-123')
    await page.getByLabel('Confirmar senha').fill('senha-segura-123')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/app\/monitoring$/)
    await expect(monitoringField(page)).toHaveValue(LINK)
    await expect(monitoringField(page)).toBeFocused()
    expectNoLink(page, requests)
  })

  test('com sessão: o hero leva direto ao monitoramento com o link, sem criar acompanhamento', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    const requests = await api(page, { session: 'user' })
    await page.goto('/')
    await expect(page.getByRole('banner').getByRole('link', { name: 'Começar a monitorar' })).toHaveAttribute('href', '/app/monitoring')
    await sendFromHero(page, LINK)
    await expect(page).toHaveURL(/\/app\/monitoring$/)
    await expect(monitoringField(page)).toHaveValue(LINK)
    await expect(monitoringField(page)).toBeFocused()
    expectNoLink(page, requests)
    // Uso único: um novo acesso ao monitoramento abre com o campo vazio.
    await page.reload()
    await expect(page).toHaveURL(/\/app\/monitoring$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (await monitoringField(page).count()) await expect(monitoringField(page)).toHaveValue('')
    expect(await page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull()
  })

  test('outra aba não recebe o link e um novo envio substitui o anterior', async ({ page, context }, info) => {
    onlyOn1280(info.project.name)
    const requests = await api(context)
    await page.goto('/')
    await sendFromHero(page, 'https://produto.mercadolivre.com.br/MLB-1111111111-primeiro-_JM')
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    const other = await context.newPage()
    await other.goto('/login')
    expect(await other.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull()
    await other.close()
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'Pare de dar F5 no preço.' })).toBeVisible()
    await sendFromHero(page, LINK)
    await login(page)
    await expect(page).toHaveURL(/\/app\/monitoring$/)
    await expect(monitoringField(page)).toHaveValue(LINK)
    expect(page.url()).not.toContain('MLB-1111111111')
    expectNoLink(page, requests)
  })

  test('campo vazio mostra a mensagem associada e não sai da página', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    await sendFromHero(page, '    ')
    await expect(page).toHaveURL(/\/$/)
    await expect(heroField(page)).toHaveAttribute('aria-invalid', 'true')
    await expect(heroField(page)).toHaveAccessibleDescription(/Informe o link completo de um anúncio do Mercado Livre Brasil\./)
  })
})

// ---------- AC08 e AC09: movimento ----------
test.describe('AC08/AC09 — movimento', () => {
  test('progresso ligado à rolagem acompanha os dois sentidos', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    const progress = (selector: string) => page.locator(selector).evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--progress')))
    for (const selector of ['.lp-steps', '.lp-demo__chart']) {
      const readings: number[] = []
      for (const fraction of [0.1, 0.5, 0.9, 0.5, 0.1]) {
        await page.locator(selector).evaluate((element, f) => {
          const top = element.getBoundingClientRect().top + scrollY
          scrollTo({ top: top - innerHeight * 0.85 + (element.getBoundingClientRect().height + innerHeight * 0.25) * f, behavior: 'instant' })
        }, fraction)
        await frames(page)
        readings.push(await progress(selector))
      }
      expect(readings[1], `${selector} ${readings}`).toBeGreaterThan(readings[0])
      expect(readings[2], `${selector} ${readings}`).toBeGreaterThan(readings[1])
      expect(readings[3], `${selector} ${readings}`).toBeLessThan(readings[2])
      expect(readings[4], `${selector} ${readings}`).toBeLessThan(readings[3])
    }
  })

  test('durações, atrasos e curvas declarados são os das notas do Figma', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    await expect(page.locator('.lp-toast')).toBeVisible()
    const timing = await page.evaluate(() => {
      const read = (selector: string) => {
        const style = getComputedStyle(document.querySelector(selector)!)
        return { name: style.animationName, duration: style.animationDuration, delay: style.animationDelay, easing: style.animationTimingFunction }
      }
      return {
        title: read('.lp-hero__title'), card: read('.lp-product-card'), robot: read('.lp-hero__robot'),
        float: read('.lp-hero__robot .lp-robot__art'), beam: read('.lp-hero__robot .lp-robot__beam'),
        line: read('.lp-hero .lp-chart__line'), toast: read('.lp-toast'), orbit: read('.lp-final__orbits span'),
        running: document.getAnimations().map((animation) => (animation as CSSAnimation).animationName),
      }
    })
    const ms = (value: number) => `${value / 1000}s`
    expect(timing.title).toMatchObject({ duration: ms(landingMotion.heroEnterMs), delay: '0s', easing: 'ease-out' })
    expect(timing.card).toMatchObject({ duration: ms(landingMotion.heroEnterMs), delay: ms(landingMotion.heroCardDelayMs), easing: 'ease-out' })
    expect(timing.robot).toMatchObject({ duration: ms(landingMotion.heroEnterMs), delay: ms(landingMotion.heroRobotDelayMs) })
    expect(timing.float).toMatchObject({ name: 'lp-float', duration: ms(landingMotion.robotFloatMs), easing: 'ease-in-out' })
    expect(timing.beam).toMatchObject({ name: 'lp-beam', duration: ms(landingMotion.beamPulseMs) })
    expect(timing.line).toMatchObject({ name: 'lp-draw', duration: ms(landingMotion.heroChartDrawMs) })
    expect(timing.toast).toMatchObject({ name: 'lp-toast', delay: ms(landingMotion.heroToastDelayMs) })
    expect(timing.orbit).toMatchObject({ name: 'lp-orbit', duration: ms(landingMotion.orbitTurnMs), easing: 'linear' })
    expect(timing.running).toEqual(expect.arrayContaining(['lp-float', 'lp-beam', 'lp-orbit']))
    // FAQ: abre e fecha com 250 ms (nota 238:767).
    await page.getByRole('button', { name: 'Preciso preencher os dados do produto?' }).click()
    expect(await page.locator('#perguntas [data-slot="accordion-content"][data-state="open"]').last()
      .evaluate((element) => getComputedStyle(element).animationDuration)).toBe(ms(landingMotion.faqToggleMs))
  })

  test('assistente: a mensagem aparece, "Preparando…" e a resposta 1,2 s depois', async ({ page }, info) => {
    onlyOn1280(info.project.name)
    await api(page)
    await page.goto('/')
    const chat = page.getByRole('group', { name: 'Conversa ilustrativa com o assistente' })
    await expect(chat).toHaveAttribute('data-phase', 'idle')
    await chat.scrollIntoViewIfNeeded()
    await expect(chat).toHaveAttribute('data-phase', 'typing')
    const started = Date.now()
    await expect(chat).toHaveAttribute('data-phase', 'done', { timeout: 5000 })
    // Completo em até 2 s depois de chegar à área visível (AC15).
    expect(Date.now() - started).toBeLessThan(2000)
  })

  test('movimento reduzido: nada roda e tudo aparece no estado final', async ({ browser }, info) => {
    onlyOn1280(info.project.name)
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    await api(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Conversa ilustrativa com o assistente' })).toHaveAttribute('data-phase', 'done')
    await expect(page.locator('.lp-scenes')).toHaveAttribute('data-shown', 'true')
    for (const selector of ['.lp-steps', '.lp-demo__chart']) {
      expect(await page.locator(selector).evaluate((element) => getComputedStyle(element).getPropertyValue('--progress').trim())).toBe('1')
    }
    for (const y of [0, 2000, 4000, 6000, 99999]) {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y)
      await frames(page)
      expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
    }
    await context.close()
  })
})

// ---------- AC10: companheiro de rolagem ----------
test.describe('AC10 — companheiro de rolagem', () => {
  const phrases: [string, string | null][] = [
    ['inicio', null], ['problema', 'Tô de olho'], ['como-funciona', 'Tô de olho'], ['demonstracao', 'Achei uma queda'],
    ['por-que', 'Achei uma queda'], ['assistente', 'Pode deixar'], ['perguntas', 'Pode deixar'], ['comecar', null],
  ]
  for (const width of [768, 1280, 1440]) {
    test(`em ${width} px mostra a frase da seção, some no hero e no CTA e não cobre ações`, async ({ page }, info) => {
      onlyOn1280(info.project.name)
      // Percorre oito seções e o Tab da página: sob a suíte paralela passa dos 30 s padrão.
      test.setTimeout(90_000)
      await page.setViewportSize({ width, height: 800 })
      await api(page)
      await page.goto('/')
      const companion = page.locator('.lp-companion')
      await expect(companion).toHaveAttribute('aria-hidden', 'true')
      expect(await companion.locator('a, button, input, [tabindex]').count()).toBe(0)
      for (const [section, phrase] of phrases) {
        await page.locator(`#${section}`).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
        // A troca de frase e o esconder dependem do IntersectionObserver: as asserções esperam o estado.
        if (phrase) {
          await expect(companion, section).not.toHaveAttribute('data-hidden', /.*/)
          await expect(companion.locator('.lp-companion__phrase'), section).toHaveText(phrase)
          await frames(page)
          const box = (await companion.boundingBox())!
          const overlaps = await page.locator('input:visible, [data-slot="button"]:visible').evaluateAll((elements, area) => elements.filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.bottom > 0 && rect.top < innerHeight && rect.left < area.x + area.width && rect.right > area.x && rect.top < area.y + area.height && rect.bottom > area.y
          }).map((element) => element.textContent), box)
          expect(overlaps, section).toEqual([])
        } else {
          await expect(companion, section).toHaveAttribute('data-hidden', 'true')
        }
      }
      // Fora da ordem de foco: percorrer a página com Tab nunca chega ao mini-robô.
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      for (let step = 0; step < 40; step += 1) {
        await page.keyboard.press('Tab')
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.lp-companion')))).toBe(false)
      }
    })
  }

  for (const width of [320, 390]) {
    test(`em ${width} px não aparece`, async ({ page }, info) => {
      onlyOn1280(info.project.name)
      await page.setViewportSize({ width, height: 800 })
      await api(page)
      await page.goto('/')
      await page.locator('#demonstracao').evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(page.locator('.lp-companion')).toBeHidden()
    })
  }
})

// ---------- AC11 e AC12: FAQ e menu ----------
test('AC11 — cada pergunta abre e fecha pelo teclado e anuncia o estado', async ({ page }, info) => {
  onlyOn1280(info.project.name)
  await api(page)
  await page.goto('/')
  const questions = page.locator('#perguntas').getByRole('button')
  await expect(questions).toHaveCount(5)
  for (const question of await questions.all()) {
    const before = await question.getAttribute('aria-expanded')
    await question.focus()
    await page.keyboard.press('Enter')
    await expect(question).toHaveAttribute('aria-expanded', before === 'true' ? 'false' : 'true')
    await page.keyboard.press('Space')
    await expect(question).toHaveAttribute('aria-expanded', before ?? 'false')
  }
})

test('AC12 — menu mobile: itens do quadro, foco preso, Esc, fechar e âncora devolvem o foco', async ({ page }) => {
  await api(page)
  await page.goto('/')
  const toggle = page.locator('.lp-header__menu')
  test.skip(!(await toggle.isVisible()), 'menu só existe sem espaço para as âncoras')
  const menu = page.getByRole('dialog', { name: 'Menu' })
  for (const close of ['Escape', 'button', 'anchor'] as const) {
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('navigation', { name: 'Menu' }).getByRole('link')).toHaveText(['Como funciona', 'Demonstração', 'Assistente', 'Perguntas'])
    await expect(menu.getByRole('link', { name: /^Começar a monitorar/ })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(menu.getByText('Cole um link e eu confiro por você.')).toBeVisible()
    for (let step = 0; step < 9; step += 1) {
      await page.keyboard.press('Tab')
      expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    if (close === 'Escape') await page.keyboard.press('Escape')
    else if (close === 'button') await menu.getByRole('button', { name: 'Fechar menu' }).click()
    else await menu.getByRole('link', { name: 'Demonstração' }).click()
    await expect(menu).toBeHidden()
    if (close === 'anchor') await expect(page).toHaveURL(/#demonstracao$/)
    else await expect(toggle).toBeFocused()
  }
})

// ---------- AC13: acessibilidade em todas as larguras ----------
test('AC13 — axe WCAG 2.2 AA, alvos de 44 px e sem rolagem lateral', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await api(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(async () => { for (const image of document.images) { image.loading = 'eager'; await image.decode().catch(() => undefined) } })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const small = await page.locator('a:visible, button:visible, input:visible').evaluateAll((controls) => controls.filter((control) => {
    const box = control.getBoundingClientRect()
    return box.width < 44 || box.height < 44
  }).map((control) => control.textContent?.trim() || control.getAttribute('aria-label') || control.tagName))
  expect(small).toEqual([])
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
  // Só o robô do hero é anunciado como imagem.
  const images = await page.getByRole('img').evaluateAll((elements) => elements.map((element) => element.getAttribute('alt') ?? element.getAttribute('aria-label')))
  expect(images.filter((name) => name?.startsWith('Robô'))).toEqual(['Robô do BestPrice vigiando o preço de um anúncio'])
  const toggle = page.locator('.lp-header__menu')
  if (await toggle.isVisible()) {
    await toggle.click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    const menuAxe = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(menuAxe.violations.map(({ id }) => id)).toEqual([])
    const menuSmall = await page.getByRole('dialog').locator('a, button').evaluateAll((controls) => controls.filter((control) => {
      const box = control.getBoundingClientRect()
      return box.width < 44 || box.height < 44
    }).map((control) => control.textContent?.trim() || control.getAttribute('aria-label')))
    expect(menuSmall).toEqual([])
  }
})

// ---------- AC15: carregamento estável ----------
test.describe('AC15 — carregamento estável', () => {
  for (const width of [1440, 390]) {
    test(`em ${width} px: hero utilizável antes das animações, CLS ≤ 0,1 e sem fontes externas`, async ({ page }, info) => {
      onlyOn1280(info.project.name)
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      const external: string[] = []
      page.on('request', (request) => {
        const url = new URL(request.url())
        if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol !== 'data:') external.push(request.url())
      })
      await page.addInitScript(() => {
        const state = window as unknown as { __cls: number }
        state.__cls = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) state.__cls += entry.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
      })
      const requests = await api(page)
      await page.goto('/', { waitUntil: 'commit' })
      const title = page.getByRole('heading', { level: 1, name: 'Pare de dar F5 no preço.' })
      await title.waitFor()
      // Antes de qualquer animação terminar (a entrada dura 400 ms), título, campo e ação já valem.
      const ready = await page.evaluate(() => ['.lp-hero__title', '.lp-link-form__input', '.lp-link-form__submit'].map((selector) => {
        const style = getComputedStyle(document.querySelector(selector)!)
        return { selector, opacity: style.opacity, visibility: style.visibility }
      }))
      for (const item of ready) expect(item).toMatchObject({ opacity: '1', visibility: 'visible' })
      await heroField(page).fill(LINK)
      await expect(heroField(page)).toHaveValue(LINK)
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y <= height; y += 400) {
        await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y)
        await frames(page)
      }
      // O conteúdo que entra com atraso (resposta do assistente) precisa ter entrado antes da medida.
      await expect(page.getByRole('group', { name: 'Conversa ilustrativa com o assistente' })).toHaveAttribute('data-phase', 'done')
      await frames(page)
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
      expect(cls).toBeLessThanOrEqual(0.1)
      expect(external).toEqual([])
      // A landing só consulta a sessão e o cadastro; nada de preço, anúncio ou assistente.
      expect([...new Set(requests.map((request) => new URL(request.url).pathname))].sort()).toEqual(['/api/auth/me', '/api/auth/signup'])
    })
  }
})

// Regressão (rodada 3): "Pular para o conteúdo" aparecia no meio das capturas por seção, porque a
// captura de elementos maiores que a janela reposiciona os elementos fixos. O link só pode ser visto
// quando focado, qualquer que seja a posição de rolagem ou o modo de captura.
test('o link "Pular para o conteúdo" só aparece quando focado', async ({ page }, info) => {
  onlyOn1280(info.project.name)
  await api(page)
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  const opacity = () => skip.evaluate((element) => getComputedStyle(element).opacity)
  expect(await opacity()).toBe('0')
  await page.locator('#assistente').evaluate((element) => element.scrollIntoView({ behavior: 'instant' }))
  expect(await opacity()).toBe('0')
  await skip.focus()
  expect(await opacity()).toBe('1')
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#lp-content$/)
})

// Rodada 3 (quadro 239:229): no mobile as cenas do Problema são um carrossel horizontal acessível.
test('mobile: cenas do Problema em carrossel rolável pelo teclado, com indicadores e sem rolagem da página', async ({ page }, info) => {
  onlyOn1280(info.project.name)
  await page.setViewportSize({ width: 390, height: 844 })
  await api(page)
  await page.goto('/')
  const track = page.getByRole('region', { name: 'Cenas do jeito antigo' })
  await expect(track.getByRole('listitem')).toHaveCount(3)
  await expect(track.getByRole('heading', { level: 3 })).toHaveText(['As abas se acumulam', 'A memória não ajuda', 'O momento passa'])
  const dots = page.locator('.lp-carousel__dots span')
  await expect(dots.nth(0)).toHaveAttribute('data-active', 'true')
  await track.focus()
  await expect(track).toBeFocused()
  // Setas rolam a faixa focada; o scroll-snap leva de cena em cena.
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  await expect(dots.nth(1)).toHaveAttribute('data-active', 'true')
  // Cada seta rola até a próxima cena (rolagem suave): repete até o indicador chegar à última.
  await expect(async () => {
    await page.keyboard.press('ArrowRight')
    await expect(dots.nth(2)).toHaveAttribute('data-active', 'true', { timeout: 1000 })
  }).toPass({ timeout: 10_000 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
