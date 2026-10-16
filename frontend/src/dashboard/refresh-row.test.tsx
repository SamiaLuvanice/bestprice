import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, callsTo, dashboardFixture, deferred, notificationFixture, reply, unreadUrl } from '../test/fakeApi'
import { bellButton, chooseRowAction, linkField, product, productRow, renderArea, rowStatus } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const first = product('1', 'Fone sem fio')
const second = product('2', 'Cafeteira elétrica')
const third = product('3', 'Liquidificador')
const refreshUrl = '/api/tracked-products/tracking-1/refresh'

// Estado do servidor no dublê: depois de uma consulta, o painel recarregado devolve o produto atualizado.
function serverWith(items: ReturnType<typeof product>[]) {
  const state = { items }
  return {
    dashboard: () => dashboardFixture({ items: state.items }),
    update: (updated: ReturnType<typeof product>) => {
      state.items = state.items.map((item) => item.id === updated.id ? updated : item)
      return updated
    },
    route: (url: string) => url === '/api/dashboard' ? reply(200, dashboardFixture({ items: state.items })) : undefined,
  }
}

function refreshReturns(outcome: () => unknown, server = serverWith([first, second])) {
  return (url: string, init?: RequestInit) => url === refreshUrl && init?.method === 'POST' ? outcome() : server.route(url)
}

describe('Atualizar agora pela linha', () => {
  it('ocupa somente a linha afetada e mostra Consulta concluída com os dados novos', async () => {
    const response = deferred()
    const server = serverWith([first, second])
    const { user } = await renderArea(server.dashboard(), refreshReturns(() => response.promise, server))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    // Sem aria-busy no grupo: ele suprimiria o anúncio “Atualizando…” da região da própria linha.
    expect(productRow('Fone sem fio')).not.toHaveAttribute('aria-busy')
    expect(productRow('Fone sem fio')).toHaveAttribute('data-busy', 'true')
    expect(rowStatus('Fone sem fio')).toHaveTextContent('Atualizando…')
    expect(rowStatus('Fone sem fio')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' })).toHaveAttribute('href', '/produtos/tracking-1')
    expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toBeDisabled()
    expect(productRow('Cafeteira elétrica')).not.toHaveAttribute('data-busy')
    expect(screen.getByRole('link', { name: 'Ver detalhes de Cafeteira elétrica' })).toHaveAttribute('href', '/produtos/tracking-2')
    await user.click(screen.getByRole('button', { name: 'Ações de Cafeteira elétrica' }))
    expect(screen.getByRole('group', { name: 'Ações de Cafeteira elétrica' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeEnabled()

    response.resolve(reply(200, server.update(product('1', 'Fone sem fio', { current_price: '75.00' }))))
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent('Consulta concluída.'))
    expect(within(productRow('Fone sem fio')).getAllByRole('cell')[1]).toHaveTextContent(/R\$\s*75,00/)
    expect(productRow('Fone sem fio')).not.toHaveAttribute('data-busy')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it('mostra o rótulo do resultado quando o anúncio não é localizado', async () => {
    const server = serverWith([first, second])
    const { user } = await renderArea(server.dashboard(),
      refreshReturns(() => reply(200, server.update(product('1', 'Fone sem fio', { lookup_status: 'not_found', last_attempt_status: 'not_found' }))), server))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent('Anúncio não localizado no Mercado Livre'))
    expect(within(productRow('Fone sem fio')).getByText('Último preço conhecido')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it('mostra a mensagem do 429 com o prazo e mantém os dados', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }),
      refreshReturns(() => reply(429, apiError('refresh_not_due', 'Este produto foi consultado há pouco.', { retry_after_seconds: 30 }))))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent('Este produto foi consultado há pouco. Tente novamente em 30 segundos.'))
    expect(within(productRow('Fone sem fio')).getAllByRole('cell')[1]).toHaveTextContent(/R\$\s*80,00/)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it.each([502, 503])('em %i mostra a mensagem e recarrega a linha com a tentativa registrada', async (status) => {
    const server = serverWith([first, second])
    const { user, mockFetch } = await renderArea(server.dashboard(), (url, init) => {
      if (url === refreshUrl && init?.method === 'POST') {
        server.update(product('1', 'Fone sem fio', { last_attempt_status: 'temporary_error' }))
        return reply(status, apiError('integration_unavailable', 'Mercado Livre indisponível no momento.'))
      }
      if (url === '/api/tracked-products/tracking-1') return reply(200, product('1', 'Fone sem fio', { last_attempt_status: 'temporary_error' }))
      return server.route(url)
    })
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(within(productRow('Fone sem fio')).getByText('Última tentativa: Falha temporária na consulta')).toBeInTheDocument())
    expect(rowStatus('Fone sem fio')).toHaveTextContent('Mercado Livre indisponível no momento.')
    expect(callsTo(mockFetch, '/api/tracked-products/tracking-1')).toHaveLength(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it('mostra a mensagem de rede e recarrega a linha', async () => {
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), (url, init) => {
      if (url === refreshUrl && init?.method === 'POST') return Promise.reject(new TypeError('Failed to fetch'))
      if (url === '/api/tracked-products/tracking-1') return reply(200, first)
      return undefined
    })
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent('Não foi possível conectar ao BestPrice. Tente novamente.'))
    expect(callsTo(mockFetch, '/api/tracked-products/tracking-1')).toHaveLength(1)
  })

  it.each([
    [409, 'tracking_inactive', 'Você não monitora mais este produto.'],
    [404, 'resource_not_found', 'Produto monitorado não encontrado.'],
  ])('em %i remove só o produto, anuncia na seção e leva o foco ao título', async (status, code, message) => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), refreshReturns(() => reply(status, apiError(code, message))))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument())
    expect(productRow('Cafeteira elétrica')).toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent(message)
    expect(screen.getByTestId('products-status')).toHaveAttribute('role', 'status')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
  })

  it('leva o foco ao campo de link e anuncia globalmente quando o único produto sai', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first] }),
      refreshReturns(() => reply(409, apiError('tracking_inactive', 'Você não monitora mais este produto.')), serverWith([first])))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(linkField()).toHaveFocus())
    expect(screen.getByTestId('global-status')).toHaveTextContent('Você não monitora mais este produto.')
    expect(screen.getByTestId('global-status')).toHaveAttribute('role', 'status')
  })

  it('preserva as páginas carregadas e recalcula indicadores e contador do sino', async () => {
    let unread = 3
    let tracked = 3
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second], nextCursor: 'page-2' }), (url, init) => {
      if (url === '/api/tracked-products?cursor=page-2') return reply(200, { items: [third], next_cursor: null })
      if (url === refreshUrl && init?.method === 'POST') {
        unread = 1
        tracked = 7
        return reply(200, product('1', 'Fone sem fio', { current_price: '70.00' }))
      }
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: [first, second], nextCursor: 'page-2', summary: { tracked_count: tracked } }))
      if (url === unreadUrl) return reply(200, { items: Array.from({ length: unread }, (_, index) => notificationFixture(`n-${index}`)), next_cursor: null })
      return undefined
    })
    await user.click(screen.getByRole('button', { name: 'Carregar mais produtos' }))
    await screen.findByRole('rowgroup', { name: 'Liquidificador' })
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent('Consulta concluída.'))
    await waitFor(() => expect(callsTo(mockFetch, '/api/dashboard').length).toBeGreaterThan(dashboardCalls))
    expect(window.location.pathname).toBe('/produtos')
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 1 não lida'))
    expect(productRow('Cafeteira elétrica')).toBeInTheDocument()
    expect(productRow('Liquidificador')).toBeInTheDocument()
  })

  it('volta à entrada quando a atualização recebe 401', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first] }),
      refreshReturns(() => reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.'))))
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('não restaura a linha quando o produto sai durante a consulta', async () => {
    const response = deferred()
    let current = [first, second]
    const { user } = await renderArea(dashboardFixture({ items: current, opportunities: [first] }), (url, init) => {
      if (url === refreshUrl && init?.method === 'POST') return response.promise
      if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') { current = [second]; return reply(204, null) }
      if (url === '/api/tracked-products/tracking-1') return reply(200, first)
      if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
      if (url === '/api/tracked-products' && init?.method === 'POST') { current = [first, second]; return reply(200, first) }
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current, opportunities: current.includes(first) ? [first] : [] }))
      return undefined
    })
    await chooseRowAction(user, 'Fone sem fio', 'Atualizar agora')
    await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
    await screen.findByRole('heading', { level: 1, name: 'Fone sem fio' })
    await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
    response.resolve(reply(200, product('1', 'Fone sem fio', { current_price: '75.00' })))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Produtos' })).toHaveFocus()
    await user.click(linkField())
    await user.paste('https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM')
    await user.click(screen.getByRole('button', { name: 'Monitorar preço' }))
    await screen.findByText('Você voltou a monitorar este produto.')
    expect(productRow('Fone sem fio')).toBeInTheDocument()
  })
})
