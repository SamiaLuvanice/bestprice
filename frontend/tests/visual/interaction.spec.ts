import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthenticated', message: 'Entre para continuar.', fields: [] } }),
  }))
})

// 0050/AC12: no mobile o menu é um diálogo (sheet) — abre por teclado, prende o foco, fecha com Esc,
// com o botão de fechar e ao escolher uma âncora, e devolve o foco ao botão que o abriu.
test('navegação pública recupera o foco por teclado', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Abrir menu' })
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  if (await navigation.isVisible()) {
    await expect(toggle).toBeHidden()
    await navigation.getByRole('link', { name: 'Como funciona' }).focus()
    await expect(navigation.getByRole('link', { name: 'Como funciona' })).toBeFocused()
    return
  }
  await toggle.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu).toBeVisible()
  // Com o diálogo aberto, o resto da página sai da árvore de acessibilidade; o botão é lido pelo seletor.
  await expect(page.locator('.lp-header__menu')).toHaveAttribute('aria-expanded', 'true')
  for (let step = 0; step < 10; step += 1) {
    await page.keyboard.press('Tab')
    expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await page.keyboard.press('Enter')
  await expect(menu).toBeVisible()
  await menu.getByRole('button', { name: 'Fechar menu' }).focus()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()

  await page.keyboard.press('Enter')
  await menu.getByRole('link', { name: 'Como funciona' }).focus()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(page).toHaveURL(/#como-funciona$/)
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
