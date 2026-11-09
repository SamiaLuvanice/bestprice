import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 0050/AC02: tipografia da landing medida contra o Figma. Para cada nó de texto visível dos quadros
// 238:294 (1440 px) e 239:180 (390 px), registrado em designsystem/landing/figma-landing-metrics-2026-11.json,
// existe na seção correspondente um elemento visível com o mesmo texto, o mesmo font-size, line-height
// a ±1 px e o peso do design system para o estilo do Figma. Títulos com a SF Pro Expanded indisponível
// (fonte substituta, aceita na 0049) têm a mesma exigência de tamanho; só a família muda.

type Entry = {
  section: string; characters: string; truncated: boolean; fontSize: number; lineHeight: number
  cssFontWeight: number; check?: boolean
}
type Metrics = { texts: { desktop: Entry[]; mobile: Entry[] } }

const read = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../../designsystem/landing/${name}`, import.meta.url)), 'utf-8'))
const metrics = read('figma-landing-metrics-2026-11.json') as Metrics
// O selo ajustado pela spec 0050 ("Ajuste de texto aprovado") troca só o texto; as medidas são as do quadro.
const approved = new Map((read('figma-landing-texts-2026-11.json') as { approvedChanges: { figma: string; product: string }[] })
  .approvedChanges.map((change) => [change.figma, change.product]))
const removedHeroLead = 'Cole o link de um anúncio do Mercado Livre uma única vez.'

const frames = [
  { frame: 'desktop', width: 1440, height: 900, attribute: 'data-figma-desktop' },
  { frame: 'mobile', width: 390, height: 844, attribute: 'data-figma-mobile' },
] as const

for (const { frame, width, height, attribute } of frames) {
  test(`tipografia do quadro ${frame} (${width} px) igual à do Figma`, async ({ page }, info) => {
    test.skip(info.project.name !== 'viewport-1280', 'mede no tamanho do quadro: roda num só projeto')
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/**', (route) => new URL(route.request().url()).pathname === '/api/auth/me'
      ? route.fulfill({ status: 401, json: { error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } } })
      : route.fulfill({ json: { enabled: false } }))
    await page.goto('/')
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    const entries = metrics.texts[frame]
      .filter((entry) => entry.check !== false && !entry.characters.startsWith(removedHeroLead))
      .map((entry) => ({ ...entry, characters: approved.get(entry.characters) ?? entry.characters }))
    const failures = await page.evaluate(({ entries, attribute }) => {
      const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
      const visible = (element: Element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
      return entries.flatMap((entry) => {
        const expected = normalize(entry.characters)
        const roots = Array.from(document.querySelectorAll(`[${attribute}="${entry.section}"]`))
        const all = roots.flatMap((root) => [root, ...Array.from(root.querySelectorAll('*'))])
        const textOf = (element: Element) => element instanceof HTMLInputElement ? normalize(element.placeholder) : normalize(element.textContent ?? '')
        const matches = (element: Element) => {
          const text = textOf(element)
          return entry.truncated ? text.startsWith(expected) : text === expected
        }
        const candidates = all.filter((element) => visible(element) && matches(element)
          && !Array.from(element.children).some((child) => visible(child) && matches(child)))
        const measured = candidates.map((element) => {
          const style = getComputedStyle(element)
          return { size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight), weight: Number(style.fontWeight) }
        })
        const ok = measured.some((m) => Math.abs(m.size - entry.fontSize) < 0.02 && Math.abs(m.line - entry.lineHeight) <= 1 && m.weight === entry.cssFontWeight)
        return ok ? [] : [`${entry.section} "${expected.slice(0, 40)}": Figma ${entry.fontSize}/${entry.lineHeight}/${entry.cssFontWeight}; app ${measured.length
          ? measured.map((m) => `${m.size}/${Number.isNaN(m.line) ? 'normal' : m.line}/${m.weight}`).join(', ') : 'ausente'}`]
      })
    }, { entries, attribute })
    expect(failures).toEqual([])
  })
}
