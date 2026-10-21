import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { alertFixture, apiError, callsTo, dashboardFixture, deferred, notificationFixture, reply, unreadUrl, type Route } from '../test/fakeApi'
import { bellButton, linkField, product, productRow, renderArea, type User } from '../test/productsHarness'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const first = product('1', 'Fone sem fio')
const second = product('2', 'Cafeteira elétrica')
const itemUrl = '/api/tracked-products/tracking-1'

function counterRoute(base: Route, actionUrl: string, method: string, items: () => ReturnType<typeof product>[]) {
  let unread = 3
  let tracked = 2
  const route: Route = (url, init) => {
    if (url === unreadUrl) return reply(200, {
      items: Array.from({ length: unread }, (_, index) => notificationFixture(`n-${index}`)), next_cursor: null,
    })
    if (url === actionUrl && init?.method === method) { unread = 1; tracked = 7 }
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: items(), summary: { tracked_count: tracked } }))
    return base(url, init)
  }
  return route
}

function detailServer(items: ReturnType<typeof product>[], extra: Route = () => undefined) {
  let current = items
  let detail = items[0]
  const route: Route = (url, init) => {
    const response = extra(url, init)
    if (response !== undefined) return response
    if (url === itemUrl && init?.method === 'DELETE') {
      current = current.filter((item) => item.id !== first.id)
      return reply(204, null)
    }
    if (url === itemUrl) return reply(200, detail)
    if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current }))
    return undefined
  }
  return { route, setDetail: (next: ReturnType<typeof product>) => { detail = next; current = current.map((item) => item.id === next.id ? next : item) } }
}

async function openDetail(user: User) {
  const link = screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' })
  expect(link).toHaveAttribute('href', '/produtos/tracking-1')
  await user.click(link)
  const heading = await screen.findByRole('heading', { level: 1, name: 'Fone sem fio' })
  expect(window.location.pathname).toBe('/produtos/tracking-1')
  return heading.closest('section') as HTMLElement
}

describe('parar de monitorar no detalhe', () => {
  it('confirma a ação sem alterar a URL e cancela sem DELETE', async () => {
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Parar de monitorar' }))
    const confirm = within(screen.getByRole('alertdialog', { name: 'Parar de monitorar “Fone sem fio”?' }))
    expect(confirm.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.click(confirm.getByRole('button', { name: 'Cancelar' }))
    expect(window.location.pathname).toBe('/produtos/tracking-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Fone sem fio' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus())
    expect(callsTo(mockFetch, itemUrl, 'DELETE')).toHaveLength(0)
  })

  it.each(['{Escape}', 'outside'])('cancela por %s sem sair do detalhe', async (how) => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Parar de monitorar' }))
    if (how === 'outside') await user.click(screen.getByTestId('confirm-backdrop'))
    else await user.keyboard(how)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/produtos/tracking-1')
  })

  it('volta a Produtos e anuncia sucesso, com foco no título', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('products-status')).toHaveTextContent('Você parou de monitorar este produto.'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
  })

  it('foca o campo de link quando era o único produto', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first] }), detailServer([first]).route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    await waitFor(() => expect(linkField()).toHaveFocus())
    expect(screen.getByTestId('global-status')).toHaveTextContent('Você parou de monitorar este produto.')
  })

  it.each([
    ['HTTP', () => reply(500, apiError('internal_error', 'Não foi possível parar de monitorar agora.')), 'Não foi possível parar de monitorar agora.'],
    ['rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível conectar ao BestPrice. Tente novamente.'],
  ])('mantém o detalhe e anuncia erro de %s', async (_case, outcome, message) => {
    const server = detailServer([first, second], (url, init) => url === itemUrl && init?.method === 'DELETE' ? outcome() : undefined)
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(window.location.pathname).toBe('/produtos/tracking-1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus())
  })
})

describe('ações no detalhe', () => {
  it.each([
    ['Atualizar agora', `${itemUrl}/refresh`, 'POST'],
    ['Criar alerta', `${itemUrl}/alert`, 'POST'],
  ])('volta a Produtos se %s encontra monitoramento interrompido', async (action, url, method) => {
    const server = detailServer([first, second], (requested, init) =>
      requested === url && init?.method === method ? reply(409, apiError('tracking_inactive', 'Monitoramento interrompido.')) : undefined)
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    const detail = within(await openDetail(user))
    if (action === 'Criar alerta') await user.type(detail.getByLabelText('Avise quando chegar a'), '70.00')
    await user.click(detail.getByRole('button', { name: action }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    await waitFor(() => expect(screen.getByTestId('products-status')).toHaveTextContent('Monitoramento interrompido.'))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
  })

  it('cria alerta, recalcula sino, linha e indicadores', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: '85.00' }) })
    let current = first
    const server = detailServer([first, second], (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'POST') {
        server.setDetail(withAlert)
        current = withAlert
        return reply(201, alertFixture({ target_price: '85.00' }))
      }
      return undefined
    })
    const route = counterRoute(server.route, `${itemUrl}/alert`, 'POST', () => [current, second])
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), route)
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    const detail = within(await openDetail(user))
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    await user.type(detail.getByLabelText('Avise quando chegar a'), '85.00')
    await user.click(detail.getByRole('button', { name: 'Criar alerta' }))
    await waitFor(() => expect(screen.getByText(/Alvo:/)).toHaveTextContent(/R\$\s*85,00/))
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 1 não lida'))
    await waitFor(() => expect(callsTo(mockFetch, '/api/dashboard').length).toBeGreaterThan(dashboardCalls))
    expect(window.location.pathname).toBe('/produtos/tracking-1')
    await user.click(screen.getByRole('link', { name: 'Produtos', current: 'page' }))
    await waitFor(() => expect(within(productRow('Fone sem fio')).getByText(/Alerta em/)).toHaveTextContent(/R\$\s*85,00/))
    await user.click(screen.getByRole('link', { name: 'Início' }))
    expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('7')).toBeInTheDocument()
  })

  it.each([['Salvar alvo', '90.00'], ['Pausar alerta', null]])('recalcula sino, linha e indicadores após %s', async (buttonName, target) => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    let current = withAlert
    const changed = product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: target ? '90.00' : '99.90', enabled: Boolean(target) }) })
    const server = detailServer([withAlert, second], (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'PATCH') {
        current = changed
        server.setDetail(changed)
        return reply(200, changed.alert)
      }
      return undefined
    })
    const route = counterRoute(server.route, `${itemUrl}/alert`, 'PATCH', () => [current, second])
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [withAlert, second] }), route)
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    const detail = within(await openDetail(user))
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    if (target) await user.type(detail.getByLabelText('Novo valor desejado'), target, { initialSelectionStart: 0, initialSelectionEnd: 99 })
    await user.click(detail.getByRole('button', { name: buttonName }))
    await waitFor(() => expect(callsTo(mockFetch, `${itemUrl}/alert`, 'PATCH')).toHaveLength(1))
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 1 não lida'))
    await waitFor(() => expect(callsTo(mockFetch, '/api/dashboard').length).toBeGreaterThan(dashboardCalls))
    expect(window.location.pathname).toBe('/produtos/tracking-1')
    await user.click(screen.getByRole('link', { name: 'Produtos', current: 'page' }))
    if (target) expect(within(productRow('Fone sem fio')).getByText(/Alerta em/)).toHaveTextContent(/R\$\s*90,00/)
    else expect(within(productRow('Fone sem fio')).queryByText(/Alerta em/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Início' }))
    expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('7')).toBeInTheDocument()
  })

  it('atualiza o preço e recalcula sino, linha e indicadores', async () => {
    let current = first
    const server = detailServer([first, second], (url, init) => {
      if (url === `${itemUrl}/refresh` && init?.method === 'POST') {
        const updated = product('1', 'Fone sem fio', { current_price: '70.00' })
        current = updated
        server.setDetail(updated)
        return reply(200, updated)
      }
      return undefined
    })
    const route = counterRoute(server.route, `${itemUrl}/refresh`, 'POST', () => [current, second])
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), route)
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Atualizar agora' }))
    await waitFor(() => expect(screen.getByText(/R\$\s*70,00/)).toBeInTheDocument())
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 1 não lida'))
    await waitFor(() => expect(callsTo(mockFetch, '/api/dashboard').length).toBeGreaterThan(dashboardCalls))
    expect(window.location.pathname).toBe('/produtos/tracking-1')
    await user.click(screen.getByRole('link', { name: 'Produtos', current: 'page' }))
    expect(within(productRow('Fone sem fio')).getAllByRole('cell')[1]).toHaveTextContent(/R\$\s*70,00/)
    await user.click(screen.getByRole('link', { name: 'Início' }))
    expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('7')).toBeInTheDocument()
  })

  it('volta à lista por link explícito', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    await openDetail(user)
    await user.click(screen.getByRole('link', { name: 'Ir para Produtos' }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    expect(productRow('Fone sem fio')).toBeInTheDocument()
  })

  it('recarrega o alerta após 404 sem perder o produto', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    let latest = withAlert
    const server = detailServer([withAlert, second], (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'PATCH') {
        latest = first
        return reply(404, apiError('resource_not_found', 'Alerta não encontrado.'))
      }
      if (url === itemUrl) return reply(200, latest)
      return undefined
    })
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }), server.route)
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Pausar alerta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Alerta não encontrado.')
    expect(screen.getByRole('button', { name: 'Criar alerta' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/produtos/tracking-1')
  })

  it.each([
    ['Pausar alerta', 'PATCH', () => reply(200, alertFixture({ enabled: false }))],
    ['Salvar alvo', 'PATCH', () => reply(200, alertFixture({ target_price: '70.00' }))],
    ['Excluir alerta', 'DELETE', () => reply(204, null)],
  ])('volta a Produtos quando %s conclui e o detalhe recarregado está inativo', async (action, method, outcome) => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    const stopped = product('1', 'Fone sem fio', {}, { active: false, alert: alertFixture({ enabled: false }) })
    let latest = withAlert
    let current = [withAlert, second]
    const { user } = await renderArea(dashboardFixture({ items: current }), (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === method) {
        latest = stopped
        current = [second]
        return outcome()
      }
      if (url === itemUrl) return reply(200, latest)
      if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current }))
      return undefined
    })
    const detail = within(await openDetail(user))
    if (action === 'Salvar alvo') await user.type(detail.getByLabelText('Novo valor desejado'), '70.00', { initialSelectionStart: 0, initialSelectionEnd: 99 })
    await user.click(detail.getByRole('button', { name: action }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    await waitFor(() => expect(screen.getByTestId('products-status')).toHaveTextContent('Monitoramento interrompido.'))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(productRow('Cafeteira elétrica')).toBeInTheDocument()
  })

  it('remove o produto quando PATCH do alerta responde 404 e o detalhe também responde 404', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    let gone = false
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }), (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'PATCH') {
        gone = true
        return reply(404, apiError('resource_not_found', 'Alerta não encontrado.'))
      }
      if (url === itemUrl) return gone
        ? reply(404, apiError('resource_not_found', 'Produto monitorado não encontrado.')) : reply(200, withAlert)
      if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
      return undefined
    })
    await user.click(within(await openDetail(user)).getByRole('button', { name: 'Pausar alerta' }))
    await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
    await waitFor(() => expect(screen.getByTestId('products-status')).toHaveTextContent('Produto monitorado não encontrado.'))
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
  })

  it('acrescenta a página do histórico sem duplicar e remove o botão no cursor final', async () => {
    const page1 = { id: 'h-1', price: '80.00', currency: 'BRL', captured_at: '2026-10-11T16:00:00Z' }
    const page2 = { id: 'h-2', price: '75.00', currency: 'BRL', captured_at: '2026-10-10T16:00:00Z' }
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), (url) => {
      if (url === itemUrl) return reply(200, first)
      if (url === `${itemUrl}/history`) return reply(200, { items: [page1], next_cursor: 'page-2' })
      if (url === `${itemUrl}/history?cursor=page-2`) return reply(200, { items: [page1, page2], next_cursor: null })
      return undefined
    })
    const detail = within(await openDetail(user))
    await user.click(await detail.findByText('Ver registros de preço'))
    expect(detail.getAllByRole('row')[1]).toHaveTextContent(/R\$\s*80,00/)
    await user.click(detail.getByRole('button', { name: 'Carregar mais preços' }))
    await waitFor(() => expect(detail.getAllByRole('row')[1]).toHaveTextContent(/R\$\s*75,00/))
    expect(detail.getAllByRole('row')).toHaveLength(3)
    expect(detail.queryByRole('button', { name: 'Carregar mais preços' })).not.toBeInTheDocument()
    expect(callsTo(mockFetch, `${itemUrl}/history?cursor=page-2`)).toHaveLength(1)
    expect(window.location.pathname).toBe('/produtos/tracking-1')
  })

  it('descarta resposta atrasada de outra URL', async () => {
    const slow = deferred()
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), (url) => {
      if (url === itemUrl) return slow.promise
      if (url === `${itemUrl}/history` || url === '/api/tracked-products/tracking-2/history') return reply(200, { items: [], next_cursor: null })
      if (url === '/api/tracked-products/tracking-2') return reply(200, second)
      return undefined
    })
    await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
    await user.click(screen.getByRole('link', { name: 'Produtos', current: 'page' }))
    await user.click(screen.getByRole('link', { name: 'Ver detalhes de Cafeteira elétrica' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Cafeteira elétrica' })).toBeInTheDocument()
    slow.resolve(reply(200, first))
    expect(window.location.pathname).toBe('/produtos/tracking-2')
    expect(screen.getByRole('heading', { level: 1, name: 'Cafeteira elétrica' })).toBeInTheDocument()
  })
})

describe('alerta de preço no formato brasileiro (0028/AC02, AC06)', () => {
  function bodyOf(call: unknown[]) {
    const init = call[1] as RequestInit
    return JSON.parse(String(init.body)) as unknown
  }

  it('cria o alerta com vírgula enviando decimal com ponto', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: '99.90' }) })
    const server = detailServer([first, second], (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'POST') { server.setDetail(withAlert); return reply(201, withAlert.alert) }
      return undefined
    })
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    const detail = within(await openDetail(user))
    const field = detail.getByLabelText('Avise quando chegar a')
    expect(field).toHaveAttribute('placeholder', '99,90')
    await user.type(field, '99,90')
    await user.click(detail.getByRole('button', { name: 'Criar alerta' }))
    await waitFor(() => expect(callsTo(mockFetch, `${itemUrl}/alert`, 'POST')).toHaveLength(1))
    expect(bodyOf(callsTo(mockFetch, `${itemUrl}/alert`, 'POST')[0])).toEqual({ target_price: '99.90' })
  })

  it('recusa valor inválido localmente, sem chamar a API', async () => {
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    const detail = within(await openDetail(user))
    const field = detail.getByLabelText('Avise quando chegar a')
    await user.type(field, '99,999')
    await user.click(detail.getByRole('button', { name: 'Criar alerta' }))
    expect(await detail.findByText('Informe um valor em reais, como 99,90.')).toBeInTheDocument()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Informe um valor em reais, como 99,90.')
    expect(callsTo(mockFetch, `${itemUrl}/alert`, 'POST')).toHaveLength(0)
  })

  it('mostra o alvo atual com vírgula e salva novo alvo com milhar', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: '99.90' }) })
    const server = detailServer([withAlert, second], (url, init) => url === `${itemUrl}/alert` && init?.method === 'PATCH'
      ? reply(200, alertFixture({ target_price: '1899.90' })) : undefined)
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [withAlert, second] }), server.route)
    const detail = within(await openDetail(user))
    const field = detail.getByLabelText('Novo valor desejado')
    expect(field).toHaveValue('99,90')
    await user.clear(field)
    await user.type(field, '1.899,90')
    await user.click(detail.getByRole('button', { name: 'Salvar alvo' }))
    await waitFor(() => expect(callsTo(mockFetch, `${itemUrl}/alert`, 'PATCH')).toHaveLength(1))
    expect(bodyOf(callsTo(mockFetch, `${itemUrl}/alert`, 'PATCH')[0])).toEqual({ target_price: '1899.90' })
  })

  it('pausa o alerta sem depender do campo e separa as ações destrutivas', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    const server = detailServer([withAlert, second], (url, init) => url === `${itemUrl}/alert` && init?.method === 'PATCH'
      ? reply(200, alertFixture({ enabled: false })) : undefined)
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [withAlert, second] }), server.route)
    const detail = within(await openDetail(user))
    await user.type(detail.getByLabelText('Novo valor desejado'), '5')
    expect(detail.getByRole('button', { name: 'Pausar alerta' })).toBeInTheDocument()
    expect(detail.getByRole('button', { name: 'Excluir alerta' })).toHaveAttribute('data-variant', 'outline')
    expect(detail.getByRole('button', { name: 'Parar de monitorar' })).toHaveAttribute('data-variant', 'destructive')
    await user.click(detail.getByRole('button', { name: 'Pausar alerta' }))
    await waitFor(() => expect(callsTo(mockFetch, `${itemUrl}/alert`, 'PATCH')).toHaveLength(1))
    expect(bodyOf(callsTo(mockFetch, `${itemUrl}/alert`, 'PATCH')[0])).toEqual({ enabled: false })
  })

  it('agrupa metadados sem repetir "sem frete"', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    const section = await openDetail(user)
    expect(within(section).getAllByText(/sem frete/)).toHaveLength(1)
    const details = within(section).getByText('Detalhes da consulta').closest('details') as HTMLElement
    expect(details).not.toHaveAttribute('open')
    expect(within(details).getByText(/Resultado da última tentativa/)).toBeInTheDocument()
  })
})
