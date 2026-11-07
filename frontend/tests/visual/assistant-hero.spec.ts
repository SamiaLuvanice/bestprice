import { expect, test } from '@playwright/test'

// 0049 (quadros 132:27 e 132:361): no início do assistente, o mascote fica à direita do título,
// dentro do halo rosa, sem cobrir o título nem o subtítulo, em todas as larguras.
test('assistente: mascote dentro do halo e sem cobrir título e subtítulo', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 'u1', email: 'pessoa@example.com' } })
    if (path === '/api/ai/capabilities') return route.fulfill({ json: { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 } })
    if (path === '/api/research') return route.fulfill({ json: { items: [], next_offset: null } })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'Recurso não encontrado.', fields: [] } } })
  })
  await page.goto('/app/assistant')
  const robot = page.getByRole('img', { name: 'Robô do assistente BestPrice IA' })
  await expect(robot).toBeVisible()
  await robot.evaluate((image: HTMLImageElement) => image.decode().catch(() => undefined))
  const layout = await page.evaluate(() => {
    const box = (element: Element | null) => {
      const rect = element!.getBoundingClientRect()
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
    }
    const welcome = document.querySelector('.assistant-welcome')!
    const halo = getComputedStyle(welcome, '::after')
    const area = welcome.getBoundingClientRect()
    const width = Number.parseFloat(halo.width)
    const height = Number.parseFloat(halo.height)
    const haloCenter = halo.content === 'none' ? null : {
      x: area.right - Number.parseFloat(halo.right) - width / 2,
      y: area.top + Number.parseFloat(halo.top) + height / 2,
    }
    return {
      robot: box(document.querySelector('.assistant-robot')),
      title: box(document.querySelector('.assistant-greeting h1')),
      subtitle: box(document.querySelector('.assistant-greeting p')),
      haloCenter,
    }
  })
  const overlaps = (a: typeof layout.robot, b: typeof layout.robot) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  expect(overlaps(layout.robot, layout.title), 'mascote cobre o título').toBe(false)
  expect(overlaps(layout.robot, layout.subtitle), 'mascote cobre o subtítulo').toBe(false)
  expect(layout.haloCenter, 'halo ausente').not.toBeNull()
  const { x, y } = layout.haloCenter!
  expect(x >= layout.robot.left && x <= layout.robot.right && y >= layout.robot.top && y <= layout.robot.bottom, 'centro do halo fora do mascote').toBe(true)
})
