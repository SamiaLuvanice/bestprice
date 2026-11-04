import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const summary = { id: 'c1', title: 'Notebook para programação', kind: 'conversation', created_at: '2026-10-26T12:00:00Z', updated_at: '2026-10-31T12:00:00Z', expires_at: '2027-01-24T12:00:00Z' }

async function api(page: Page, state: 'ready' | 'empty' | 'error' | 'loading' = 'ready', longTitle = false) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/auth/me') return route.fulfill({ json: { id: 'u1', email: 'pessoa@example.com' } })
    if (url.pathname === '/api/research') {
      expect(url.searchParams.get('kind')).toBe('conversation')
      if (state === 'loading') return
      if (state === 'error') return route.fulfill({ status: 503, json: { error: { code: 'research_unavailable', message: 'Conversas indisponíveis.', fields: [] } } })
      return route.fulfill({ json: { items: state === 'empty' || url.searchParams.get('q') ? [] : [summary, ...['Três notebooks para estudar', 'Monitor para home office'].map((title, index) => ({ ...summary, id: `c${index + 2}`, title: longTitle ? 'Notebook'.repeat(50) : title }))], next_offset: null } })
    }
    if (route.request().method() === 'DELETE') return route.fulfill({ status: 503, json: { error: { code: 'research_unavailable', message: 'Não foi possível excluir.', fields: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } })
  })
}

async function fit(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const small = await page.locator('main button, main a, main input, .research-topbar button, .research-bottom-nav a').evaluateAll((elements) => elements.filter((element) => {
    const box = element.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44)
  }).map((element) => element.outerHTML.slice(0, 160)))
  expect(small).toEqual([])
}

test('histórico: cards, ações, busca por teclado e acessibilidade', async ({ page }, info) => {
  await api(page)
  await page.goto('/app/history')
  await expect(page.getByRole('heading', { level: 1, name: 'Suas conversas' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('combobox')).toHaveCount(0)
  await expect(page.getByRole('link', { name: `Continuar ${summary.title}` })).toHaveAttribute('href', '/app/assistant/c1')
  await expect(page.getByRole('navigation', { name: 'Páginas de conversas' })).toHaveCount(0)
  await fit(page)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.locator('main').click({ position: { x: 2, y: 2 } })
  await page.screenshot({ path: info.outputPath('history-ready.png'), fullPage: true })
  if (info.project.name === 'viewport-1280' || info.project.name === 'viewport-390') {
    const desktop = info.project.name === 'viewport-1280'
    await page.setViewportSize(desktop ? { width: 1440, height: 1040 } : { width: 390, height: 844 })
    await fit(page)
    await page.screenshot({ path: info.outputPath(desktop ? 'history-1440x1040.png' : 'history-390x844.png'), fullPage: true })
  }
  const search = page.getByRole('searchbox', { name: 'Buscar pelo título' })
  await search.focus()
  await page.keyboard.type('inexistente')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Nenhuma conversa encontrada.' })).toBeVisible()
  await search.fill('')
  await page.getByRole('button', { name: 'Buscar conversas' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
  const remove = page.getByRole('button', { name: `Excluir ${summary.title}` })
  await remove.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(remove).toBeFocused()
  await remove.click()
  await dialog.getByRole('button', { name: 'Excluir pesquisa' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Não foi possível excluir.')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

for (const state of ['empty', 'error', 'loading'] as const) {
  test(`estado ${state} preserva busca e prazo de guarda`, async ({ page }, info) => {
    await api(page, state)
    await page.goto('/app/history')
    if (state === 'empty') await expect(page.getByRole('heading', { name: 'Seu histórico começa com a primeira ideia.' })).toBeVisible()
    if (state === 'error') await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    if (state === 'loading') await expect(page.getByRole('status')).toHaveText('Carregando histórico…')
    await expect(page.getByText('Conversas guardadas por até 90 dias da criação.')).toBeVisible()
    await fit(page)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.locator('main').click({ position: { x: 2, y: 2 } })
    await page.screenshot({ path: info.outputPath(`history-${state}.png`), fullPage: true })
  })
}

test('títulos sem espaços não criam overflow', async ({ page }) => {
  await api(page, 'ready', true)
  await page.goto('/app/history')
  await expect(page.getByRole('listitem')).toHaveCount(3)
  await fit(page)
})
