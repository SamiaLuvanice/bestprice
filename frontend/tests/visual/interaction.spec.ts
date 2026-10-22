import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }),
  }))
})

test('navegação pública recupera o foco por teclado', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Abrir menu' })
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  if ((page.viewportSize()?.width ?? 0) >= 960) {
    await expect(toggle).toBeHidden()
    await navigation.getByRole('link', { name: 'Como funciona' }).focus()
    await expect(navigation.getByRole('link', { name: 'Como funciona' })).toBeFocused()
    return
  }
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(navigation.getByRole('link', { name: 'Início', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(navigation).toBeHidden()
  await page.keyboard.press('Enter')
  await navigation.getByRole('link', { name: 'Entrar e monitorar' }).focus()
  await page.keyboard.press('Tab')
  await expect(navigation).toBeHidden()
  await expect(page.locator('main').getByRole('link', { name: 'Entrar e monitorar' }).first()).toBeFocused()
})

test('movimento reduzido mantém o controle de senha e foco visível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  const password = page.getByLabel('Senha', { exact: true })
  await password.fill('senha-ilustrativa')
  await password.focus()
  await page.keyboard.press('Tab')
  const toggle = page.getByRole('button', { name: 'Mostrar senha' })
  await expect(toggle).toBeFocused()
  expect(await toggle.evaluate((element) => ({
    outline: getComputedStyle(element).outlineStyle,
    transition: getComputedStyle(element).transitionDuration,
  }))).toEqual({ outline: 'solid', transition: '0s' })
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(toggle).toBeFocused()
})
