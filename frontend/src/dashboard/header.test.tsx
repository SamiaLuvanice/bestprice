import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, callsTo, dashboardWith, fakeApi, reply, trackedFixture } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

async function renderArea(route: Parameters<typeof fakeApi>[0] = () => undefined) {
  const mockFetch = fakeApi(route, dashboardWith([trackedFixture()]))
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await screen.findByRole('heading', { name: 'Seus produtos' })
  return { user, mockFetch }
}

function nav() {
  return within(screen.getByRole('navigation', { name: 'Principal' }))
}

describe('cabeçalho', () => {
  it('mostra marca, navegação e menu da conta identificado pelo e-mail', async () => {
    await renderArea()
    const banner = within(screen.getByRole('banner'))
    expect(banner.getByText('BestPrice')).toBeInTheDocument()
    const logos = banner.getAllByRole('img', { name: 'BestPrice' })
    expect(logos).toHaveLength(1)
    expect(logos[0].getAttribute('src')).toContain('logo-bestprice.png')
    expect(nav().getAllByRole('link').map((link) => link.textContent)).toEqual(['Início', 'Produtos', 'Alertas'])
    expect(banner.getByRole('button', { name: /pessoa@example\.com/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('leva o foco às seções e marca somente o item ativado como atual', async () => {
    const { user } = await renderArea()
    const [home, products, alerts] = ['Início', 'Produtos', 'Alertas'].map((name) => nav().getByRole('link', { name }))

    await user.click(products)
    expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus()
    expect(products).toHaveAttribute('aria-current', 'location')
    expect(home).not.toHaveAttribute('aria-current')
    expect(alerts).not.toHaveAttribute('aria-current')

    await user.click(alerts)
    expect(screen.getByRole('heading', { name: 'Alertas' })).toHaveFocus()
    expect(alerts).toHaveAttribute('aria-current', 'location')
    expect(products).not.toHaveAttribute('aria-current')

    await user.click(home)
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    expect(home).toHaveAttribute('aria-current', 'location')
    expect(alerts).not.toHaveAttribute('aria-current')
  })

  it('sai da conta e mostra a entrada quando o encerramento tem sucesso', async () => {
    const { user, mockFetch } = await renderArea((url, init) => url === '/api/auth/logout' && init?.method === 'POST' ? reply(204, null) : undefined)
    await user.click(screen.getByRole('button', { name: /pessoa@example\.com/ }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/auth/logout', 'POST')).toHaveLength(1)
  })

  it.each([
    ['500', () => reply(500, apiError('internal_error', 'Não foi possível encerrar a sessão.')), 'Não foi possível encerrar a sessão.'],
    ['rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível conectar ao BestPrice. Tente novamente.'],
  ])('mantém a área e mostra o erro no cabeçalho quando sair falha (%s)', async (_case, outcome, text) => {
    const { user } = await renderArea((url, init) => url === '/api/auth/logout' && init?.method === 'POST' ? outcome() : undefined)
    await user.click(screen.getByRole('button', { name: /pessoa@example\.com/ }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await within(screen.getByRole('banner')).findByRole('alert')).toHaveTextContent(text)
    expect(screen.getByRole('heading', { name: 'Seus produtos' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('opera o menu da conta pelo teclado', async () => {
    const { user } = await renderArea()
    const account = screen.getByRole('button', { name: /pessoa@example\.com/ })
    account.focus()
    await user.keyboard('{Enter}')
    expect(account).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(account).toHaveFocus()
    expect(account).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard(' ')
    expect(account).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    await user.tab()
    expect(account).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
  })
})
