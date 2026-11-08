import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFile } from 'node:fs/promises'

// 0049 — medições automáticas pedidas pela QA:
//  AC04: estilos calculados (raio, sombra, anel de foco, duração) de Button, Input, Card e Alert Dialog.
//  AC09: cor do item ativo da barra lateral e da navegação inferior = token rosa.
//  AC12: contraste ≥ 3:1 (WCAG 1.4.11) da borda dos campos e do anel de foco; comparador com axe e alvos de 44 px.
// O resultado medido vai para test-results (ac04-medidas.json), de onde a tabela de verification.md é copiada.

const user = { id: 'u1', email: 'pessoa@example.com' }
async function api(page: Page) {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ json: user })
    if (path === '/api/ai/capabilities') return route.fulfill({ json: { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 } })
    if (path === '/api/research') return route.fulfill({ json: { items: [], next_offset: null } })
    if (path.startsWith('/api/notifications')) return route.fulfill({ json: { items: [], next_cursor: null } })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } })
  })
}

/** Contraste WCAG entre duas cores rgb()/rgba() já calculadas pelo navegador (alfa composto sobre o fundo). */
function contrast(foreground: string, background: string): number {
  const parse = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number)
  const [br, bg, bb] = parse(background)
  const [fr, fg, fb, fa = 1] = parse(foreground)
  const mix = [fr * fa + br * (1 - fa), fg * fa + bg * (1 - fa), fb * fa + bb * (1 - fa)]
  const luminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map((value) => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [light, dark] = [luminance(mix), luminance([br, bg, bb])].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

test('AC04/AC12: estilos calculados e contraste de borda e foco no catálogo', async ({ page }, info) => {
  test.skip(info.project.name !== 'viewport-1280', 'medição única')
  await api(page)
  await page.goto('/dev/design-system')
  await expect(page.getByRole('heading', { level: 1, name: 'Design system BestPrice 2026' })).toBeVisible()
  const style = (selector: string, pseudo?: string) => page.locator(selector).first().evaluate((element, pseudoElement) => {
    const computed = getComputedStyle(element, pseudoElement ?? undefined)
    return { radius: computed.borderTopLeftRadius, shadow: computed.boxShadow, duration: computed.transitionDuration, outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor, borderColor: computed.borderTopColor, focusVisible: element.matches(':focus-visible') }
  }, pseudo)
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  const button = '[data-catalog-section="button"] [data-slot="button"][data-variant="default"]:not([data-state])'
  const buttonRest = await style(button)
  const inputRestEarly = await style('[data-catalog-section="input"] input[type="email"]')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.keyboard.press('Tab')
  await page.locator(button).first().focus()
  const buttonFocus = await style(button)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  const input = '[data-catalog-section="input"] input[type="email"]'
  const inputRest = inputRestEarly
  // Estados de foco medidos sem transição em curso (movimento reduzido zera as durações).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator(input).focus()
  const inputFocus = await style(input)

  const card = await style('[data-catalog-section="card"] [data-slot="card"]')
  await page.getByRole('button', { name: 'Parar de monitorar' }).first().click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  const dialog = await style('[data-slot="alert-dialog-content"]')

  const measures = {
    button: { radius: buttonRest.radius, duration: buttonRest.duration, focusOutline: `${buttonFocus.outlineWidth} ${buttonFocus.outlineColor}` },
    input: { radius: inputRest.radius, duration: inputRest.duration, border: inputRest.borderColor, focusBorder: inputFocus.borderColor, focusOutline: `${inputFocus.outlineWidth} ${inputFocus.outlineColor}` },
    card: { radius: card.radius, shadow: card.shadow },
    dialog: { radius: dialog.radius, shadow: dialog.shadow },
    contrast: {
      inputBorder: contrast(inputRest.borderColor, background),
      inputFocusBorder: contrast(inputFocus.borderColor, background),
      buttonFocusRing: contrast(buttonFocus.outlineColor, background),
    },
  }
  await writeFile(info.outputPath('ac04-medidas.json'), JSON.stringify(measures, null, 2))

  // AC04: valores do quadro "Espaço, raio, elevação e movimento".
  expect(Number.parseFloat(buttonRest.radius)).toBeGreaterThanOrEqual(9999) // pílula (rounded-full)
  expect(new Set(buttonRest.duration.split(', '))).toEqual(new Set(['0.16s'])) // --motion-fast em todas as propriedades
  expect(buttonFocus.outlineWidth).toBe('3px') // --ring-width
  expect(buttonFocus.outlineColor).toBe('rgb(199, 0, 94)') // --ring
  expect(inputRest.radius).toBe('12px') // --radius-md
  expect(new Set(inputRest.duration.split(', '))).toEqual(new Set(['0.16s']))
  expect(inputFocus.borderColor).toBe('rgb(199, 0, 94)')
  // O anel de foco do DS é o contorno global :focus-visible (--ring-width, --ring), além da borda rosa.
  expect(inputFocus.outlineWidth).toBe('3px')
  expect(inputFocus.outlineColor).toBe('rgb(199, 0, 94)')
  expect(card.radius).toBe('18px') // --radius-lg
  expect(card.shadow).toBe('none') // --shadow-0
  expect(dialog.radius).toBe('24px') // --radius-xl
  expect(dialog.shadow.endsWith('rgba(0, 0, 0, 0.14) 0px 30px 60px 0px')).toBe(true) // --shadow-3 (camadas de anel do Tailwind antes)
  // AC12 (WCAG 1.4.11): borda de campo e indicador de foco com 3:1 contra o fundo.
  expect(measures.contrast.inputBorder).toBeGreaterThanOrEqual(3)
  expect(measures.contrast.inputFocusBorder).toBeGreaterThanOrEqual(3)
  expect(measures.contrast.buttonFocusRing).toBeGreaterThanOrEqual(3)
})

for (const [width, selector, token] of [
  [1280, '.research-sidebar nav a[aria-current="page"]', '--sidebar-accent-foreground'],
  [390, '.research-bottom-nav a[aria-current="page"]', '--primary'],
] as const) {
  test(`AC09: destino ativo usa o rosa do token (${width} px)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo teste')
    await page.setViewportSize({ width, height: 800 })
    await api(page)
    await page.goto('/app/assistant')
    const active = page.locator(selector)
    await expect(active).toBeVisible()
    const colors = await active.evaluate((element, name) => {
      const probe = document.createElement('span')
      probe.style.color = `var(${name})`
      document.body.append(probe)
      const expected = getComputedStyle(probe).color
      probe.remove()
      return { actual: getComputedStyle(element).color, expected }
    }, token)
    expect(colors.actual).toBe(colors.expected)
    expect(colors.actual).toMatch(/^rgb\((255, 62, 165|199, 0, 94)\)$/) // rosa da marca (Noite na barra escura)
  })
}

for (const width of [320, 390, 768, 1280]) {
  test(`AC12: comparador com axe e alvos de 44 px (${width} px)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'a largura é fixada pelo teste')
    await page.setViewportSize({ width, height: 800 })
    await api(page)
    await page.goto('/app/compare')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const small = await page.locator('main button:visible, main a:visible, main input:visible, main textarea:visible, .research-bottom-nav a:visible').evaluateAll((elements) => elements
      .filter((element) => { const box = element.getBoundingClientRect(); return box.width < 44 || box.height < 44 })
      .map((element) => element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName))
    expect(small).toEqual([])
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
  })
}
