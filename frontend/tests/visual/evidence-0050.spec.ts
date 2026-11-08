import { test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// 0050/F20 (AC02): capturas da landing por seção, nos tamanhos dos quadros do Figma (desktop 238:294
// em 1440 px; mobile 239:180 em 390 px) e o menu aberto (239:856). São evidência para comparação lado
// a lado com specs/0050-landing-publica-nova/evidence/figma/, gravadas com o MESMO nome; não são
// baselines (sem toHaveScreenshot). Movimento reduzido: tudo no estado final, sem variação.
// Grava arquivos versionados: só roda com EVIDENCE_0050=1, num só projeto.

const OUT = fileURLToPath(new URL('../../../specs/0050-landing-publica-nova/evidence/app/', import.meta.url))

const sections: [string, string][] = [
  ['01-hero', '#inicio'], ['02-problema', '#problema'], ['03-como-funciona', '#como-funciona'],
  ['04-demonstracao', '#demonstracao'], ['05-por-que', '#por-que'], ['06-assistente', '#assistente'],
  ['07-perguntas', '#perguntas'], ['08-cta-final', '#comecar'], ['09-rodape', '.lp-footer'],
]

async function open(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } } })
    return route.fulfill({ json: { enabled: false } })
  })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.evaluate(async () => {
    for (const image of document.images) { image.loading = 'eager'; await image.decode().catch(() => undefined) }
    await document.fonts.ready
  })
}

test.describe('evidência 0050', () => {
  test.beforeEach(({ browserName }, info) => {
    test.skip(!process.env.EVIDENCE_0050, 'evidência da 0050: rode com EVIDENCE_0050=1')
    test.skip(info.project.name !== 'viewport-1280' || browserName !== 'chromium', 'capturas fixam o tamanho do quadro')
    mkdirSync(OUT, { recursive: true })
  })

  for (const [frame, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]] as const) {
    test(`seções · ${frame}`, async ({ page }) => {
      await open(page, width, height)
      // Peças fixas (mini-robô e barra mobile) ficam fora dos recortes por seção.
      await page.addStyleTag({ content: '.lp-companion, .lp-mobile-bar { visibility: hidden !important; }' })
      for (const [name, selector] of sections) {
        await page.locator(selector).screenshot({ path: `${OUT}${frame}-${name}.png`, animations: 'disabled' })
      }
      await page.screenshot({ path: `${OUT}${frame}-pagina-inteira.png`, fullPage: true, animations: 'disabled' })
    })
  }

  test('barra fixa e menu aberto · mobile', async ({ page }) => {
    await open(page, 390, 844)
    await page.locator('.lp-mobile-bar').screenshot({ path: `${OUT}mobile-10-barra-fixa.png`, animations: 'disabled' })
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).waitFor()
    await page.screenshot({ path: `${OUT}mobile-menu-aberto.png`, animations: 'disabled' })
  })
})
