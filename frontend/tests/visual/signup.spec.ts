import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

// Cadastro self-service (spec 0048, F8–F10): quadros Figma aprovados em D1
// (specs/0048-cadastro-self-service-usuarios/design/figma-frames.md). A API é simulada por
// interceptação de rede; nenhum backend é necessário. Baselines só no tema claro, como os quadros.

const FRAMES = { desktop: { width: 1440, height: 1040 }, mobile: { width: 390, height: 899 } } as const
type Frame = keyof typeof FRAMES

const EMAIL = 'ana@exemplo.com.br'
const PASSWORD = 'senha-segura-123'

function envelope(code: string, message: string, extra: Record<string, unknown> = {}) {
  return JSON.stringify({ error: { code, message, fields: [], tracked_product_id: null, retry_after_seconds: null, ...extra } })
}

type SignupReply = (route: Route) => Promise<void>

/** Visitante sem sessão, cadastro ligado; `post` decide a resposta do envio. */
async function mockApi(page: Page, post: SignupReply = (route) => route.abort('failed')) {
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: envelope('unauthenticated', 'Entre para continuar.') }))
  await page.route('**/api/auth/signup', (route) => route.request().method() === 'GET'
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: true }) })
    : post(route))
}

/** Fontes e arte lateral (fundo CSS, só acima de 840 px) prontas antes da captura. */
async function waitForArt(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const visual = document.querySelector('.login-visual')
    const url = visual ? /url\("?(.*?)"?\)/.exec(getComputedStyle(visual).backgroundImage)?.[1] : undefined
    if (!url) return
    const image = new Image()
    image.src = url
    await image.decode()
  })
}

async function openSignup(page: Page, frame: Frame, post?: SignupReply) {
  await page.setViewportSize(FRAMES[frame])
  await mockApi(page, post)
  await page.goto('/cadastro')
  await expect(page.getByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeVisible()
  await waitForArt(page)
}

async function fill(page: Page, email: string, password: string, confirmation: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(confirmation)
}

/** Tira foco e ponteiro do botão para a captura não registrar hover nem anel de foco. */
async function settle(page: Page) {
  await page.locator(':focus').evaluate((element) => (element as HTMLElement).blur())
  await page.mouse.move(0, 0)
}

const submit = (page: Page) => page.getByRole('button', { name: /^(Criar conta|Criando conta…)$/ }).click()

const states: { name: string; run: (page: Page, frame: Frame) => Promise<void> }[] = [
  { name: 'padrao', run: (page, frame) => openSignup(page, frame) },
  {
    name: 'foco', run: async (page, frame) => {
      await openSignup(page, frame)
      await page.getByLabel('Confirmar senha').focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
    },
  },
  {
    name: 'enviando', run: async (page, frame) => {
      await openSignup(page, frame, () => new Promise(() => undefined))
      await fill(page, EMAIL, PASSWORD, PASSWORD)
      await submit(page)
      await expect(page.getByRole('button', { name: 'Criando conta…' })).toHaveAttribute('aria-busy', 'true')
      await settle(page)
    },
  },
  {
    name: 'erros-campos', run: async (page, frame) => {
      await openSignup(page, frame)
      await fill(page, 'ana@exemplo', 'curta', 'diferente')
      await submit(page)
      await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
      await settle(page)
    },
  },
  {
    name: 'email-ja-cadastrado', run: async (page, frame) => {
      await openSignup(page, frame, (route) => route.fulfill({ status: 409, contentType: 'application/json', body: envelope('email_already_registered', 'Já existe uma conta com este e-mail.', {
        fields: [{ field: 'email', code: 'email_already_registered', message: 'Já existe uma conta com este e-mail.' }],
      }) }))
      await fill(page, EMAIL, PASSWORD, PASSWORD)
      await submit(page)
      await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
      await settle(page)
    },
  },
  {
    name: 'limite', run: async (page, frame) => {
      await openSignup(page, frame, (route) => route.fulfill({ status: 429, contentType: 'application/json', body: envelope('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.', { retry_after_seconds: 900 }) }))
      await fill(page, EMAIL, PASSWORD, PASSWORD)
      await submit(page)
      await expect(page.getByRole('alert')).toHaveText('Muitas tentativas de cadastro. Tente novamente em 15 minutos.')
      await settle(page)
    },
  },
  {
    name: 'falha-de-rede', run: async (page, frame) => {
      await openSignup(page, frame)
      await fill(page, EMAIL, PASSWORD, PASSWORD)
      await submit(page)
      await expect(page.getByRole('alert')).toHaveText('Não foi possível criar a conta agora. Tente novamente.')
      await settle(page)
    },
  },
]

test.describe('quadros do cadastro (1440 e 390 px)', () => {
  test.use({ colorScheme: 'light' })
  // Os quadros fixam a largura; um projeto basta para não duplicar baselines.
  const onlyOnce = (project: string) => test.skip(project !== 'viewport-1280', 'quadros com viewport próprio')

  for (const frame of ['desktop', 'mobile'] as const) {
    for (const state of states) {
      test(`${state.name} · ${frame}`, async ({ page }, info) => {
        onlyOnce(info.project.name)
        await state.run(page, frame)
        // Quadros 220:871/220:965: a marca começa em y ≈ 130 no mobile, como no login.
        if (frame === 'mobile') expect(Math.round((await page.locator('.login-brand').boundingBox())!.y)).toBeGreaterThanOrEqual(120)
        if (frame === 'mobile') expect(Math.round((await page.locator('.login-brand').boundingBox())!.y)).toBeLessThanOrEqual(140)
        await expect(page).toHaveScreenshot(`signup-${state.name}-${frame}.png`, { fullPage: true })
      })
    }
  }

  test('login com Criar conta · desktop e mobile', async ({ page }, info) => {
    onlyOnce(info.project.name)
    for (const frame of ['desktop', 'mobile'] as const) {
      await page.setViewportSize(FRAMES[frame])
      await mockApi(page)
      await page.goto('/login')
      await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible()
      await waitForArt(page)
      await expect(page).toHaveScreenshot(`login-signup-${frame}.png`, { fullPage: true })
    }
  })

  // 0050: "Criar conta" saiu do cabeçalho da landing (spec 0050, Figma 238:295); com o cadastro
  // ligado, "Começar a monitorar" leva ao cadastro com retorno ao monitoramento.
  test('landing com cadastro ligado · desktop e menu mobile', async ({ page }, info) => {
    onlyOnce(info.project.name)
    await page.setViewportSize({ width: 1440, height: 1040 })
    await mockApi(page)
    await page.goto('/')
    const header = page.locator('.lp-header')
    const start = header.getByRole('link', { name: 'Começar a monitorar' })
    await expect(start).toBeVisible()
    await expect(start).toHaveAttribute('href', '/cadastro?returnTo=%2Fapp%2Fmonitoring')
    await expect(header).toHaveScreenshot('landing-header-desktop.png')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu.getByRole('link', { name: /^Começar a monitorar/ })).toHaveAttribute('href', '/cadastro?returnTo=%2Fapp%2Fmonitoring')
    await menu.evaluate((dialog) => Promise.all(dialog.getAnimations({ subtree: true }).map((animation) => animation.finished)))
    await expect(menu).toHaveScreenshot('landing-menu-mobile.png')
  })
})

test.describe('cadastro em todas as larguras', () => {
  test.use({ colorScheme: 'light' })

  test('sem rolagem horizontal, alvos de 44 px, foco visível e axe sem violações', async ({ page }) => {
    await mockApi(page, (route) => route.fulfill({ status: 429, contentType: 'application/json', body: envelope('signup_rate_limited', 'Muitas tentativas.', { retry_after_seconds: 900 }) }))
    await page.goto('/cadastro')
    await expect(page.getByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toHaveCount(0)

    // Estado com mais conteúdo: erros de campo; depois o alerta do servidor.
    await submit(page)
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(accessibility.violations).toEqual([])
    }
    await page.emulateMedia({ colorScheme: 'light' })

    const targets = page.locator('.login-form-side').locator('input, button, a')
    for (const target of await targets.all()) {
      const box = await target.boundingBox()
      expect(box, await target.evaluate((element) => element.outerHTML.slice(0, 80))).not.toBeNull()
      expect(box!.height, await target.evaluate((element) => element.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44)
    }

    // Foco visível: anel de 2 px em cada controle percorrido por Tab.
    await page.getByLabel('E-mail').focus()
    for (let step = 0; step < 6; step += 1) {
      const outline = await page.locator(':focus').evaluate((element) => {
        const style = getComputedStyle(element)
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
      })
      expect(outline).toBe(true)
      await page.keyboard.press('Tab')
    }

    await fill(page, EMAIL, PASSWORD, PASSWORD)
    await submit(page)
    await expect(page.getByRole('alert')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([])
  })
})

test.describe('Criar conta no login e na landing em todas as larguras', () => {
  test('sem rolagem horizontal e com alvos de 44 px', async ({ page }) => {
    await mockApi(page)
    for (const path of ['/login', '/']) {
      await page.goto(path)
      // 0050: na landing, o caminho para o cadastro é "Começar a monitorar" (cabeçalho ou menu).
      const menu = page.getByRole('button', { name: 'Abrir menu' })
      if (path === '/' && await menu.isVisible()) await menu.click()
      const link = path === '/'
        ? page.getByRole('link', { name: /^Começar a monitorar/ }).filter({ visible: true }).first()
        : page.getByRole('link', { name: 'Criar conta' })
      await expect(link).toBeVisible()
      if (path === '/') await expect(link).toHaveAttribute('href', '/cadastro?returnTo=%2Fapp%2Fmonitoring')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true)
      expect((await link.boundingBox())!.height, path).toBeGreaterThanOrEqual(44)
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([])
    }
  })
})
