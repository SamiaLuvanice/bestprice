import { expect, test, type Page, type Route } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// 0049/F24 (AC08): capturas das telas da lista A nos mesmos estados e larguras dos quadros do
// Figma (specs/0049-design-system-2026-no-codigo/evidence/figma/). São evidência para comparação
// lado a lado, gravadas com o MESMO nome do PNG do Figma em evidence/app/; não são baselines
// (sem toHaveScreenshot). A API é simulada por interceptação de rede, como nos outros specs.
// Roda só no projeto viewport-1440; cada captura fixa o tamanho do quadro (1440 ou 390).

const OUT = fileURLToPath(new URL('../../../specs/0049-design-system-2026-no-codigo/evidence/app/', import.meta.url))
mkdirSync(OUT, { recursive: true })

const DESKTOP = { width: 1440, height: 1040 }
const MOBILE = { width: 390, height: 844 }
const user = { id: 'u1', email: 'samia@example.com' }
const fail = (code: string, message: string, extra: Record<string, unknown> = {}) =>
  ({ error: { code, message, fields: [], tracked_product_id: null, retry_after_seconds: null, ...extra } })

type Handler = (path: string, route: Route) => unknown | Promise<unknown>

/** Intercepta /api: o handler pode responder (route.fulfill), pausar (return 'hang') ou cair no padrão. */
async function api(page: Page, handler: Handler = () => undefined, session: 'guest' | 'user' = 'user') {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname + url.search
    const custom = await handler(path, route)
    if (custom === 'hang' || custom === 'done') return
    if (url.pathname === '/api/auth/me') return session === 'guest'
      ? route.fulfill({ status: 401, json: fail('unauthenticated', 'Entre para continuar.') })
      : route.fulfill({ json: user })
    if (url.pathname === '/api/auth/signup') return route.fulfill({ json: { enabled: true } })
    if (url.pathname === '/api/ai/capabilities') return route.fulfill({ json: capabilities() })
    if (url.pathname === '/api/research') return route.fulfill({ json: { items: conversations, next_offset: null } })
    if (url.pathname === '/api/ai/conversations/c1') return route.fulfill({ json: { ...conversations[0], messages } })
    if (url.pathname === '/api/dashboard') return route.fulfill({ json: dashboard(tracked) })
    if (url.pathname === '/api/tracked-products') return route.fulfill({ json: { items: tracked, next_cursor: null } })
    if (url.pathname.startsWith('/api/notifications')) return route.fulfill({ json: { items: [], next_cursor: null } })
    return route.fulfill({ status: 404, json: fail('not_found', 'Recurso não encontrado.') })
  })
}

const capabilities = (enabled = true) => ({ enabled, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 })
const day = (offset: number) => `2026-10-${String(31 - offset).padStart(2, '0')}T12:00:00Z`
const conversations = ['Notebook para programação', 'Escolha de smartphone', 'Monitor para trabalhar', 'Fone com cancelamento de ruído']
  .map((title, index) => ({ id: index === 0 ? 'c1' : `c${index + 1}`, title, kind: 'conversation', created_at: day(index + 4), updated_at: day(index), expires_at: '2027-01-24T12:00:00Z' }))
const messages = [
  { id: 'u1', role: 'user', content: 'Preciso de um notebook para estudar e programar, até R$ 3.500.', created_at: day(4) },
  { id: 'a1', role: 'assistant', content: 'Quais programas você pretende usar, além do navegador e das aulas on-line?', created_at: day(0) },
]

function product(id: string, title: string, price: string, previous: string, change: string, percent: string, availability = 'available') {
  return {
    id, external_id: `MLB${id.padStart(10, '1')}`, title, image_url: null, canonical_url: `https://produto.mercadolivre.com.br/MLB-${id}-x-_JM`,
    currency: 'BRL', price_context: 'mlb_marketplace_unit', current_price: price, previous_price: previous, min_price: price, max_price: previous,
    absolute_change: change, percentage_change: percent, availability, lookup_status: 'located', last_confirmed_availability: availability,
    last_confirmed_availability_at: '2026-10-29T17:30:00Z', last_attempt_status: 'ok', last_attempt_at: '2026-10-29T17:30:00Z',
    last_success_at: '2026-10-29T17:30:00Z', last_price_observed_at: '2026-10-29T17:30:00Z', price_changed_at: '2026-10-29T17:30:00Z', stale: false,
  }
}
const tracked = [
  ['1', 'Notebook Inspiron 15', '2879.00', '3139.00', '-260.00', '-8.28', '2700.00'],
  ['2', 'Smartphone 128 GB', '4299.00', '4389.00', '-90.00', '-2.05', '4000.00'],
  ['3', 'Monitor 27 polegadas', '1249.00', '1249.00', '0.00', '0.00', null],
  ['4', 'Fone Bluetooth', '329.00', '312.00', '17.00', '5.45', '300.00'],
].map(([id, title, price, previous, change, percent, target]) => ({
  id: `tracking-${id}`, active: true, active_since: '2026-10-01T12:00:00Z', product: product(id!, title!, price!, previous!, change!, percent!),
  alert: target ? { id: `alert-${id}`, target_price: target, enabled: true, condition: 'at_or_below' } : null,
}))
const dashboard = (items: unknown[]) => ({
  summary: { tracked_count: items.length, price_drop_count: items.length ? 2 : 0, active_alert_count: items.length ? 3 : 0, target_reached_count: 0 },
  tracked_products: { items, next_cursor: null }, opportunities: items.slice(0, 2), recent_updates: [],
})

async function settle(page: Page) {
  await page.evaluate(async () => {
    for (const image of document.images) { image.loading = 'eager'; await image.decode().catch(() => undefined) }
    await document.fonts.ready
    const visual = document.querySelector('.login-visual')
    const url = visual ? /url\("?(.*?)"?\)/.exec(getComputedStyle(visual).backgroundImage)?.[1] : undefined
    if (url) { const image = new Image(); image.src = url; await image.decode().catch(() => undefined) }
  })
  await blur(page)
  await page.mouse.move(0, 0)
}

/** Tira o foco sem esperar um elemento focado existir. */
async function blur(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

async function capture(page: Page, name: string) {
  const viewport = page.viewportSize()!
  if (viewport.width < 960) {
    // No mobile, a navegação inferior é fixa: em vez de fullPage (que a desenharia no meio da página),
    // a viewport cresce até a altura do documento, como um quadro alto do Figma.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    if (height > viewport.height) await page.setViewportSize({ width: viewport.width, height })
    await page.screenshot({ path: `${OUT}${name}.png`, animations: 'disabled', caret: 'hide' })
    return
  }
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: true, animations: 'disabled', caret: 'hide' })
}

const frames = [['desktop', DESKTOP], ['mobile', MOBILE]] as const

test.describe('evidência 0049 (lista A × Figma)', () => {
  test.use({ colorScheme: 'light' })
  // Grava arquivos versionados: só roda quando pedido (EVIDENCE_0049=1), para a rodada completa não os alterar.
  test.beforeEach(({ browserName }, info) => {
    test.skip(!process.env.EVIDENCE_0049, 'evidência da 0049: rode com EVIDENCE_0049=1')
    test.skip(info.project.name !== 'viewport-1440' || browserName !== 'chromium', 'capturas fixam o tamanho do quadro')
  })

  for (const [frame, size] of frames) {
    test(`entrar · ${frame}`, async ({ page }) => {
      await page.setViewportSize(size)
      await api(page, () => undefined, 'guest')
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Entrar na sua conta', level: 1 })).toBeVisible()
      await settle(page)
      await capture(page, `entrar-${frame}`)
    })

    const signupFrame = frame === 'desktop' ? DESKTOP : { width: 390, height: 899 }
    const fill = async (page: Page, email: string, password: string, confirmation: string) => {
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha', { exact: true }).fill(password)
      await page.getByLabel('Confirmar senha').fill(confirmation)
      await page.getByRole('button', { name: 'Criar conta' }).click()
    }
    const signupStates: [number, Handler, (page: Page) => Promise<void>][] = [
      [1, () => undefined, async () => undefined],
      [2, () => undefined, async () => undefined],
      [3, (path, route) => path === '/api/auth/signup' && route.request().method() === 'POST' ? 'hang' : undefined,
        async (page) => { await fill(page, 'ana@exemplo.com.br', 'senha-segura-123', 'senha-segura-123'); await expect(page.getByRole('button', { name: 'Criando conta…' })).toBeVisible() }],
      [4, () => undefined, async (page) => { await fill(page, 'ana@exemplo', 'curta', 'diferente'); await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true') }],
      [5, async (path, route) => {
        if (path !== '/api/auth/signup' || route.request().method() !== 'POST') return undefined
        await route.fulfill({ status: 409, json: fail('email_already_registered', 'Já existe uma conta com este e-mail.', { fields: [{ field: 'email', code: 'email_already_registered', message: 'Já existe uma conta com este e-mail.' }] }) })
        return 'done'
      }, async (page) => { await fill(page, 'ana@exemplo.com.br', 'senha-segura-123', 'senha-segura-123'); await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true') }],
      [6, async (path, route) => {
        if (path !== '/api/auth/signup' || route.request().method() !== 'POST') return undefined
        await route.fulfill({ status: 429, json: fail('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.', { retry_after_seconds: 900 }) })
        return 'done'
      }, async (page) => { await fill(page, 'ana@exemplo.com.br', 'senha-segura-123', 'senha-segura-123'); await expect(page.getByRole('alert')).toBeVisible() }],
      [7, async (path, route) => {
        if (path !== '/api/auth/signup' || route.request().method() !== 'POST') return undefined
        await route.abort('failed')
        return 'done'
      }, async (page) => { await fill(page, 'ana@exemplo.com.br', 'senha-segura-123', 'senha-segura-123'); await expect(page.getByRole('alert')).toBeVisible() }],
    ]
    for (const [index, handler, act] of signupStates) {
      test(`cadastro-${index} · ${frame}`, async ({ page }) => {
        await page.setViewportSize(signupFrame)
        await api(page, handler, 'guest')
        await page.goto('/cadastro')
        await expect(page.getByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeVisible()
        await settle(page)
        await act(page)
        if (index !== 2) await page.mouse.move(0, 0)
        if (index === 2) {
          // Quadros 220:382/220:900: e-mail e senha preenchidos, foco em Confirmar senha.
          await page.getByLabel('E-mail').fill('ana@exemplo.com.br')
          await page.getByLabel('Senha', { exact: true }).fill('senha-segura-123')
          await page.getByLabel('Confirmar senha').focus()
        }
        if (index !== 2) await blur(page)
        await capture(page, `cadastro-${index}-${frame}`)
      })
    }

    test(`assistente-inicio · ${frame}`, async ({ page }) => {
      await page.setViewportSize({ ...size, height: frame === 'desktop' ? 960 : 844 })
      await api(page)
      await page.goto('/app/assistant')
      await expect(page.getByRole('heading', { level: 1, name: 'O que você quer comprar?' })).toBeVisible()
      await settle(page)
      await capture(page, `assistente-inicio-${frame}`)
    })

    test(`assistente-conversa · ${frame}`, async ({ page }) => {
      await page.setViewportSize({ ...size, height: frame === 'desktop' ? 960 : 844 })
      await api(page)
      await page.goto('/app/assistant/c1')
      await expect(page.getByText('Quais programas você pretende usar', { exact: false })).toBeVisible()
      await settle(page)
      await capture(page, `assistente-conversa-${frame}`)
    })

    test(`historico · ${frame}`, async ({ page }) => {
      await page.setViewportSize(size)
      await api(page)
      await page.goto('/app/history')
      await expect(page.getByRole('heading', { level: 1, name: 'Suas conversas' })).toBeVisible()
      await expect(page.getByRole('listitem').first()).toBeVisible()
      await settle(page)
      await capture(page, `historico-${frame}`)
    })

    test(`monitoramento-vazio · ${frame}`, async ({ page }) => {
      await page.setViewportSize(size)
      await api(page, async (path, route) => {
        if (path === '/api/dashboard') { await route.fulfill({ json: dashboard([]) }); return 'done' }
        if (path.startsWith('/api/tracked-products')) { await route.fulfill({ json: { items: [], next_cursor: null } }); return 'done' }
        return undefined
      })
      await page.goto('/app/monitoring')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Você ainda não está acompanhando nenhum produto.')).toBeVisible()
      await settle(page)
      await capture(page, `monitoramento-vazio-${frame}`)
    })

    test(`monitoramento-produtos · ${frame}`, async ({ page }) => {
      await page.setViewportSize(frame === 'desktop' ? size : { width: 390, height: 1920 })
      await api(page)
      await page.goto('/app/monitoring')
      await expect(page.getByText('Notebook Inspiron 15').first()).toBeVisible()
      await settle(page)
      await capture(page, `monitoramento-produtos-${frame}`)
    })
  }

  // Quadro 137:43 (estados do assistente): uma captura por estado, em 1440.
  const assistantStates: [string, Handler, (page: Page) => Promise<void>][] = [
    ['carregando-conversas', (path) => path.startsWith('/api/research') ? 'hang' : undefined, async (page) => {
      await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
      await expect(page.getByText('Carregando conversas recentes…')).toBeVisible()
    }],
    ['historico-vazio', async (path, route) => {
      if (!path.startsWith('/api/research')) return undefined
      await route.fulfill({ json: { items: [], next_offset: null } }); return 'done'
    }, async (page) => {
      await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
      await expect(page.getByText(/Nenhuma conversa ainda/)).toBeVisible()
    }],
    ['falha-lista', async (path, route) => {
      if (!path.startsWith('/api/research')) return undefined
      await route.fulfill({ status: 503, json: fail('research_unavailable', 'Não foi possível carregar suas conversas.') }); return 'done'
    }, async (page) => {
      await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    }],
    ['envio-em-andamento', (path) => path === '/api/ai/chat' ? 'hang' : undefined, async (page) => {
      await page.getByLabel('Sua mensagem').fill('Preciso de um notebook para estudar.')
      await page.getByRole('button', { name: 'Enviar mensagem' }).click()
      await expect(page.getByText('Preparando uma resposta…')).toBeVisible()
    }],
    ['falha-envio', async (path, route) => {
      if (path !== '/api/ai/chat') return undefined
      await route.fulfill({ status: 503, json: fail('ai_unavailable', 'Não foi possível enviar. Tente novamente.') }); return 'done'
    }, async (page) => {
      await page.getByLabel('Sua mensagem').fill('Preciso de um notebook para estudar.')
      await page.getByRole('button', { name: 'Enviar mensagem' }).click()
      await expect(page.getByRole('alert').first()).toBeVisible()
    }],
    ['ia-indisponivel', async (path, route) => {
      if (path !== '/api/ai/capabilities') return undefined
      await route.fulfill({ json: capabilities(false) }); return 'done'
    }, async (page) => {
      await expect(page.getByText('O assistente está indisponível no momento.', { exact: false })).toBeVisible()
    }],
  ]
  for (const [name, handler, act] of assistantStates) {
    test(`estados-desktop-a · ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 780 })
      await api(page, handler)
      await page.goto('/app/assistant')
      await expect(page.getByRole('heading', { level: 1, name: 'O que você quer comprar?' })).toBeVisible()
      await act(page)
      await settle(page)
      await capture(page, `estados-desktop-a-${name}`)
    })
  }

  // Quadro 152:535 (estados do monitoramento): carregando, vazio, falha e preço desatualizado.
  const monitoringStates: [string, string, Handler, (page: Page) => Promise<void>][] = [
    ['carregando', '/app/monitoring/overview', (path) => path === '/api/dashboard' ? 'hang' : undefined,
      async (page) => { await expect(page.getByText('Carregando seu painel…')).toBeVisible() }],
    ['primeiro-preco', '/app/monitoring/overview', async (path, route) => {
      if (path !== '/api/dashboard') return undefined
      await route.fulfill({ json: dashboard([]) }); return 'done'
    }, async (page) => { await expect(page.getByText('Você ainda não está acompanhando nenhum produto.')).toBeVisible() }],
    ['falha', '/app/monitoring/overview', async (path, route) => {
      if (path !== '/api/dashboard') return undefined
      await route.fulfill({ status: 503, json: fail('unavailable', 'Não foi possível carregar o painel. Tente novamente.') }); return 'done'
    }, async (page) => { await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible() }],
    ['atualizacao-indisponivel', '/app/monitoring', async (path, route) => {
      const stale = { ...tracked[0], product: { ...tracked[0].product, stale: true, last_attempt_status: 'unavailable' } }
      if (path.startsWith('/api/tracked-products')) { await route.fulfill({ json: { items: [stale], next_cursor: null } }); return 'done' }
      if (path === '/api/dashboard') { await route.fulfill({ json: dashboard([stale]) }); return 'done' }
      return undefined
    }, async (page) => { await expect(page.getByText('Preço desatualizado').first()).toBeVisible() }],
  ]
  for (const [name, path, handler, act] of monitoringStates) {
    test(`estados-desktop-b · ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await api(page, handler)
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await act(page)
      await settle(page)
      await capture(page, `estados-desktop-b-${name}`)
    })
  }

  // Quadro 184:200 (assistente, conteúdo sob demanda no mobile): conversas recentes abertas e falha ao enviar.
  test('estados-mobile · conversas-recentes', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await api(page)
    await page.goto('/app/assistant')
    await page.getByRole('button', { name: 'Conversas recentes', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Conversas recentes' })).toBeVisible()
    await settle(page)
    await capture(page, 'estados-mobile-conversas-recentes')
  })

  test('estados-mobile · falha-envio', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await api(page, async (path, route) => {
      if (path !== '/api/ai/chat') return undefined
      await route.fulfill({ status: 503, json: fail('ai_unavailable', 'Não foi possível enviar sua mensagem.') }); return 'done'
    })
    await page.goto('/app/assistant')
    await page.getByLabel('Sua mensagem').fill('Preciso de um notebook para estudar.')
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await settle(page)
    await capture(page, 'estados-mobile-falha-envio')
  })
})
