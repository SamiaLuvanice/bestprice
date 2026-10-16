import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, callsTo, dashboardFixture, emptyDashboard, notificationFixture, reply, unreadUrl, type Route } from '../test/fakeApi'
import { bellButton, product, renderArea } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const loaded = dashboardFixture({ items: [product('1', 'Fone sem fio')] })

function notice(id: string, title: string, overrides: Record<string, unknown> = {}) {
  return notificationFixture(id, { product_title: title, created_at: '2026-10-11T17:50:00Z', ...overrides })
}

function section() {
  return within(screen.getByRole('region', { name: 'Notificações recebidas' }))
}

/** Dublê com estado: marcar como lida altera a página da seção e a lista de não lidas. */
function notificationsServer(initial: ReturnType<typeof notice>[], extra: Route = () => undefined) {
  let items = initial
  const route: Route = (url, init) => {
    const custom = extra(url, init)
    if (custom !== undefined) return custom
    const match = /^\/api\/notifications\/([\w-]+)$/.exec(url)
    if (match && init?.method === 'PATCH') {
      items = items.map((item) => item.id === match[1] ? { ...item, read_at: '2026-10-11T18:00:00Z' } : item)
      return reply(200, items.find((item) => item.id === match[1]))
    }
    if (url === '/api/notifications') return reply(200, { items, next_cursor: null })
    if (url === unreadUrl) return reply(200, { items: items.filter((item) => !item.read_at), next_cursor: null })
    return undefined
  }
  return route
}

describe('seção Alertas', () => {
  it('lista produto, preço observado, alvo, criação relativa e estado de leitura', async () => {
    await renderArea(loaded, notificationsServer([
      notice('n-1', 'Fone sem fio'),
      notice('n-2', 'Cafeteira elétrica', { read_at: '2026-10-11T12:00:00Z', created_at: '2026-10-11T15:00:00Z', observed_price: '350.00', target_price: '360.00' }),
    ]), '/alertas')
    const items = await section().findAllByRole('listitem')
    expect(items).toHaveLength(2)
    const first = within(items[0])
    expect(first.getByText('Fone sem fio')).toBeInTheDocument()
    expect(items[0]).toHaveTextContent(/Preço observado: R\$\s*80,00/)
    expect(items[0]).toHaveTextContent(/Alvo: R\$\s*90,00/)
    expect(first.getByText('Há 10 min')).toBeInTheDocument()
    expect(first.getByText('Não lida')).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Marcar como lida: Fone sem fio' })).toBeInTheDocument()
    const second = within(items[1])
    expect(second.getByText('Lida')).toBeInTheDocument()
    expect(second.getByText('Há 3 h')).toBeInTheDocument()
    expect(second.queryByRole('button', { name: /Marcar como lida/ })).not.toBeInTheDocument()
  })

  it('move o foco ao item seguinte, recalcula o sino e tira o item do painel', async () => {
    const { user } = await renderArea(loaded, notificationsServer([
      notice('n-1', 'Fone sem fio'), notice('n-2', 'Cafeteira elétrica'), notice('n-3', 'Liquidificador'),
    ]), '/alertas')
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    await user.click(await section().findByRole('button', { name: 'Marcar como lida: Cafeteira elétrica' }))
    await waitFor(() => expect(section().getByRole('button', { name: 'Marcar como lida: Liquidificador' })).toHaveFocus())
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 2 não lidas'))
    await user.click(bellButton())
    const panel = within(screen.getByRole('region', { name: 'Notificações não lidas' }))
    expect(panel.queryByText('Cafeteira elétrica')).not.toBeInTheDocument()
    expect(panel.getByText('Fone sem fio')).toBeInTheDocument()
  })

  it('leva o foco ao título da seção quando não resta item a marcar', async () => {
    const { user } = await renderArea(loaded, notificationsServer([notice('n-1', 'Fone sem fio')]), '/alertas')
    await user.click(await section().findByRole('button', { name: 'Marcar como lida: Fone sem fio' }))
    await waitFor(() => expect(section().getByRole('heading', { name: 'Notificações recebidas' })).toHaveFocus())
    expect(section().getByText('Lida')).toBeInTheDocument()
  })

  it('leva o foco ao primeiro item novo numa página intermediária', async () => {
    const { user } = await renderArea(loaded, (url) => {
      if (url === '/api/notifications') return reply(200, { items: [notice('n-1', 'Fone sem fio')], next_cursor: 'page-2' })
      if (url === '/api/notifications?cursor=page-2') return reply(200, { items: [notice('n-2', 'Cafeteira elétrica')], next_cursor: 'page-3' })
      return undefined
    }, '/alertas')
    const button = await section().findByRole('button', { name: 'Carregar mais notificações' })
    button.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(section().getByRole('button', { name: 'Marcar como lida: Cafeteira elétrica' })).toHaveFocus())
    expect(section().getByRole('button', { name: 'Carregar mais notificações' })).toBeInTheDocument()
  })

  it('carrega mais notificações sem repetir itens', async () => {
    const { user, mockFetch } = await renderArea(loaded, (url) => {
      if (url === '/api/notifications') return reply(200, { items: [notice('n-1', 'Fone sem fio')], next_cursor: 'page-2' })
      if (url === '/api/notifications?cursor=page-2') return reply(200, { items: [notice('n-1', 'Fone sem fio'), notice('n-2', 'Cafeteira elétrica')], next_cursor: null })
      return undefined
    }, '/alertas')
    await user.click(await section().findByRole('button', { name: 'Carregar mais notificações' }))
    expect(await section().findByText('Cafeteira elétrica')).toBeInTheDocument()
    // Última página: o botão some e o foco vai ao primeiro item novo que pode ser acionado.
    await waitFor(() => expect(section().getByRole('button', { name: 'Marcar como lida: Cafeteira elétrica' })).toHaveFocus())
    expect(section().getAllByRole('listitem')).toHaveLength(2)
    expect(section().queryByRole('button', { name: 'Carregar mais notificações' })).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/notifications?cursor=page-2')).toHaveLength(1)
  })

  it('mostra o texto de vazio quando não há notificações', async () => {
    await renderArea(loaded, undefined, '/alertas')
    expect(await section().findByText('Nenhuma notificação por enquanto.')).toBeInTheDocument()
  })

  it('mostra erro com Tentar novamente que recarrega só a seção', async () => {
    let fail = true
    const { user, mockFetch } = await renderArea(loaded, (url) => {
      if (url === '/api/notifications') return fail ? reply(500, apiError('internal_error', 'Não foi possível carregar as notificações.')) : reply(200, { items: [notice('n-1', 'Fone sem fio')], next_cursor: null })
      return undefined
    }, '/alertas')
    expect(await section().findByRole('alert')).toHaveTextContent('Não foi possível carregar as notificações.')
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    fail = false
    await user.click(section().getByRole('button', { name: 'Tentar novamente' }))
    expect(await section().findByText('Fone sem fio')).toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/dashboard')).toHaveLength(dashboardCalls)
  })

  it('continua visível no estado vazio, com as notificações existentes ou o texto de vazio', async () => {
    await renderArea(emptyDashboard, notificationsServer([notice('n-1', 'Fone sem fio')]), '/alertas')
    expect(await section().findByText('Fone sem fio')).toBeInTheDocument()
    cleanup()
    vi.unstubAllGlobals()
    await renderArea(emptyDashboard, undefined, '/alertas')
    expect(await section().findByText('Nenhuma notificação por enquanto.')).toBeInTheDocument()
  })
})
