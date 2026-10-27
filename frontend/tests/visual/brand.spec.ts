import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFile } from 'node:fs/promises'

const user = { id: 'user-1', email: 'pessoa@example.com' }
const failure = { error: { code: 'unavailable', message: 'Serviço temporariamente indisponível.', fields: [] } }

async function session(page: Page, state: 'guest' | 'ready' | 'loading' | 'error') {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me' && state === 'loading') return
    const status = path === '/api/auth/me' ? state === 'guest' ? 401 : state === 'error' ? 503 : 200 : 200
    const body = path === '/api/auth/me' ? status === 200 ? user : failure : path === '/api/dashboard'
      ? { summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 }, tracked_products: { items: [], next_cursor: null }, opportunities: [], recent_updates: [] }
      : { items: [], next_cursor: null }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

async function observe(page: Page) {
  return page.locator('.brand, .masthead:not(:has(.brand))').evaluateAll((elements) => elements
    .filter((element) => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
    .map((element) => {
      const text = element.querySelector('span') ?? element
      const image = element.querySelector('img')
      const style = getComputedStyle(text)
      const box = element.getBoundingClientRect()
      const imageBox = image?.getBoundingClientRect()
      return { text: text.textContent, font: style.fontFamily, weight: style.fontWeight, tracking: style.letterSpacing, size: style.fontSize,
        x: box.x, y: box.y, width: box.width, height: box.height, image: image && { complete: image.complete, naturalWidth: image.naturalWidth,
          width: imageBox?.width, height: imageBox?.height, x: imageBox?.x, y: imageBox?.y,
          uncovered: imageBox && element.contains(document.elementFromPoint(imageBox.x + imageBox.width / 2, imageBox.y + imageBox.height / 2)) } }
    }))
}

const scenarios = [
  ['landing', '/', 'guest'], ['login', '/login', 'guest'], ['inicio', '/app/monitoring/overview', 'ready'],
  ['produtos', '/produtos', 'ready'], ['detalhe-erro', '/produtos/tracking-1', 'ready'],
  ['alertas', '/alertas', 'ready'], ['nao-encontrada', '/nao-existe', 'guest'],
  ['sessao-carregando', '/produtos', 'loading'], ['sessao-erro', '/produtos', 'error'],
] as const

for (const [name, path, state] of scenarios) {
  test(`marca ${name}: identidade e logo persistem`, async ({ page, context }, testInfo) => {
    const errors: string[] = []
    const consoleErrors: string[] = []
    const imageResponses: { url: string; status: number }[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('response', (response) => { if (response.url().includes('logo-bestprice')) imageResponses.push({ url: response.url(), status: response.status() }) })
    await session(page, state)
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    if (state === 'loading') await expect(page.getByRole('status')).toHaveText('Carregando sua conta…')
    else if (state === 'error') await expect(page.getByRole('alert')).toBeVisible()
    else await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.locator('img[src*="logo-bestprice"]').first().waitFor({ state: 'attached' })
    await page.waitForFunction(() => Array.from(document.images).filter((image) => image.src.includes('logo-bestprice')).every((image) => image.complete))
    const observations = [await observe(page)]
    const steps = ['abertura']
    if ((page.viewportSize()?.width ?? 0) <= 390) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      if (state === 'loading') await expect(page.getByRole('status')).toHaveText('Carregando sua conta…')
      else if (state === 'error') await expect(page.getByRole('alert')).toBeVisible()
      else await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForFunction(() => Array.from(document.images).filter((image) => image.src.includes('logo-bestprice')).every((image) => image.complete))
      observations.push(await observe(page))
      steps.push('recarregamento')
      if (state === 'ready') {
        await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: path === '/alertas' ? 'Produtos' : 'Alertas' }).click()
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        observations.push(await observe(page))
        steps.push('navegacao')
        await page.goBack()
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        observations.push(await observe(page))
        steps.push('retorno')
      } else if (name === 'landing') {
        await page.getByRole('button', { name: 'Abrir menu' }).click()
        observations.push(await observe(page))
        steps.push('menu-aberto')
        await page.getByRole('link', { name: 'Começar com IA', exact: true }).first().click()
        await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
        observations.push(await observe(page))
        steps.push('login')
        await page.goBack()
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        observations.push(await observe(page))
        steps.push('retorno')
      }
      const other = await context.newPage()
      await other.goto('about:blank')
      await other.bringToFront()
      await page.bringToFront()
      await other.close()
      observations.push(await observe(page))
      steps.push('troca-de-aba')
    }
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' })
    const evidence = JSON.stringify({ steps, observations, errors, consoleErrors, imageResponses }, null, 2)
    await writeFile(testInfo.outputPath('observations.json'), evidence)
    await testInfo.attach('observations', { body: evidence, contentType: 'application/json' })
    for (const observation of observations) {
      expect(observation).toHaveLength(1)
      const brand = observation[0]
      expect(brand.text).toBe('BestPrice')
      expect(brand.weight).toBe('600')
      expect(brand.font).toBe('"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif')
      expect(Number.parseFloat(brand.tracking)).toBeCloseTo(Number.parseFloat(brand.size) * -.011, 3)
      expect(brand.image?.naturalWidth).toBeGreaterThan(0)
      expect(brand.image?.width).toBeGreaterThanOrEqual(40)
      expect(brand.image?.height).toBe(brand.image?.width)
      expect(brand.image?.uncovered).toBe(true)
      expect(brand.x).toBeGreaterThanOrEqual(0)
      expect(brand.x + brand.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    }
    const brand = page.getByRole('img', { name: 'BestPrice', exact: true })
      .or(page.getByRole('link', { name: 'BestPrice — Início', exact: true }))
      .or(page.getByRole('link', { name: 'BestPrice AI — Início', exact: true }))
      .or(page.getByRole('link', { name: 'BestPrice AI — Dashboard', exact: true })).filter({ visible: true })
    await expect(brand).toHaveCount(1)
    await expect(brand).toBeVisible()
    expect(await brand.evaluate((element) => {
      const image = element instanceof HTMLImageElement ? element : element.querySelector('img')!
      const box = image.getBoundingClientRect()
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
    })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const collision = await page.locator('header').evaluateAll((headers) => headers.some((header) => {
      const brand = header.querySelector('.brand')?.getBoundingClientRect()
      if (!brand) return false
      return Array.from(header.querySelectorAll('button, nav, .header-actions')).some((control) => {
        const box = control.getBoundingClientRect()
        return box.width > 0 && box.height > 0 && box.left < brand.right && box.right > brand.left && box.top < brand.bottom && box.bottom > brand.top
      })
    }))
    expect(collision).toBe(false)
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(accessibility.violations.map(({ id }) => id)).toEqual([])
    expect(errors).toEqual([])
  })
}
