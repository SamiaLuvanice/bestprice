import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { alertFixture, apiError, callsTo, dashboardFixture, deferred, notificationFixture, reply, unreadUrl, type Route } from '../test/fakeApi'
import { bellButton, linkField, product, productRow, renderArea, type User } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const first = product('1', 'Fone sem fio')
const second = product('2', 'Cafeteira elétrica')
const itemUrl = '/api/tracked-products/tracking-1'

function detailServer(items: ReturnType<typeof product>[], extra: Route = () => undefined) {
  let current = items
  let detail = items[0]
  const route: Route = (url, init) => {
    const custom = extra(url, init)
    if (custom !== undefined) return custom
    if (url === itemUrl && init?.method === 'DELETE') {
      current = current.filter((item) => item.id !== 'tracking-1')
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
  await user.click(screen.getByRole('button', { name: 'Ver detalhes de Fone sem fio' }))
  return screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })
}

describe('Parar de monitorar no detalhe', () => {
  it('substitui o conteúdo do próprio diálogo pela confirmação e move o foco para ela', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    const dialog = await openDetail(user)
    await user.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    const current = within(screen.getByRole('dialog'))
    expect(current.getByRole('heading', { name: 'Parar de monitorar “Fone sem fio”?' })).toBeInTheDocument()
    expect(current.queryByRole('heading', { name: 'Histórico de preços' })).not.toBeInTheDocument()
    expect(current.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it.each([
    ['Cancelar', (user: User) => user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))],
    ['Esc', (user: User) => user.keyboard('{Escape}')],
    // userEvent reproduz a ação padrão do mousedown (o navegador tira o foco para o body).
    ['clique fora', (user: User) => user.click(screen.getByTestId('detail-backdrop'))],
  ])('volta ao detalhe aberto ao cancelar por %s, com foco em Parar de monitorar', async (_how, cancel) => {
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    const dialog = await openDetail(user)
    await user.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
    await cancel(user)
    const detail = within(screen.getByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
    expect(detail.getByRole('heading', { name: 'Histórico de preços' })).toBeInTheDocument()
    await waitFor(() => expect(detail.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus())
    expect(callsTo(mockFetch, itemUrl, 'DELETE')).toHaveLength(0)
  })

  it('fecha o detalhe ao confirmar e segue a convenção de produto removido', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), detailServer([first, second]).route)
    const dialog = await openDetail(user)
    await user.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent('Você parou de monitorar este produto.')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
  })

  it('leva o foco ao campo de link quando o produto parado era o único', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first] }), detailServer([first]).route)
    const dialog = await openDetail(user)
    await user.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(linkField()).toHaveFocus())
    expect(screen.getByTestId('global-status')).toHaveTextContent('Você parou de monitorar este produto.')
  })

  it('volta ao detalhe com o erro anunciado quando parar falha', async () => {
    const server = detailServer([first, second], (url, init) =>
      url === itemUrl && init?.method === 'DELETE' ? reply(500, apiError('internal_error', 'Não foi possível parar de monitorar agora.')) : undefined)
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    const dialog = await openDetail(user)
    await user.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Parar de monitorar' }))
    const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
    expect(await detail.findByRole('alert')).toHaveTextContent('Não foi possível parar de monitorar agora.')
    await waitFor(() => expect(detail.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus())
    expect(productRow('Fone sem fio')).toBeInTheDocument()
  })
})

describe('recálculo após ações no detalhe', () => {
  function counterServer(extra: Route) {
    let unread = 3
    const server = detailServer([first, second], (url, init) => {
      if (url === unreadUrl) return reply(200, { items: Array.from({ length: unread }, (_, index) => notificationFixture(`n-${index}`)), next_cursor: null })
      const result = extra(url, init)
      if (result !== undefined) unread = 1
      return result
    })
    return server
  }

  async function expectCounterRecalculated(user: User, act: (dialog: HTMLElement) => Promise<void>, server: ReturnType<typeof counterServer>) {
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 3 não lidas'))
    const dialog = await openDetail(user)
    await act(dialog)
    await waitFor(() => expect(bellButton()).toHaveAccessibleName('Notificações, 1 não lida'))
    void server
  }

  it('recalcula o contador do sino e a linha após criar alerta', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: '85.00' }) })
    const server: ReturnType<typeof counterServer> = counterServer((url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'POST') {
        server.setDetail(withAlert)
        return reply(201, alertFixture({ target_price: '85.00' }))
      }
      return undefined
    })
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    await expectCounterRecalculated(user, async (dialog) => {
      await user.type(within(dialog).getByLabelText('Avise quando chegar a'), '85.00')
      await user.click(within(dialog).getByRole('button', { name: 'Criar alerta' }))
    }, server)
    await waitFor(() => expect(within(productRow('Fone sem fio')).getByText(/Alerta em/)).toHaveTextContent(/R\$\s*85,00/))
  })

  it.each([
    ['editar o alvo', 'Salvar alvo', '90.00'],
    ['pausar ou ativar', 'Pausar alerta', null],
  ])('recalcula o contador do sino após %s', async (_case, buttonName, typed) => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    const server = counterServer((url, init) => url === `${itemUrl}/alert` && init?.method === 'PATCH' ? reply(200, alertFixture()) : undefined)
    server.setDetail(withAlert)
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }), server.route)
    await expectCounterRecalculated(user, async (dialog) => {
      if (typed) await user.type(within(dialog).getByLabelText('Novo alvo (opcional)'), typed)
      await user.click(within(dialog).getByRole('button', { name: buttonName }))
    }, server)
  })

  it('recalcula o contador do sino, a linha e os indicadores após Atualizar agora no detalhe', async () => {
    const server: ReturnType<typeof counterServer> = counterServer((url, init) => {
      if (url === `${itemUrl}/refresh` && init?.method === 'POST') {
        const updated = product('1', 'Fone sem fio', { current_price: '70.00' })
        server.setDetail(updated)
        return reply(200, updated)
      }
      return undefined
    })
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    const dashboardCalls = callsTo(mockFetch, '/api/dashboard').length
    await expectCounterRecalculated(user, async (dialog) => {
      await user.click(within(dialog).getByRole('button', { name: 'Atualizar agora' }))
    }, server)
    await waitFor(() => expect(within(productRow('Fone sem fio')).getAllByRole('cell')[1]).toHaveTextContent(/R\$\s*70,00/))
    expect(callsTo(mockFetch, '/api/dashboard').length).toBeGreaterThan(dashboardCalls)
  })
})

describe('produto parado em outra aba', () => {
  it.each([
    ['Atualizar agora', `${itemUrl}/refresh`, 'POST'],
    ['Criar alerta', `${itemUrl}/alert`, 'POST'],
  ])('fecha o detalhe e remove o produto quando %s responde 409 tracking_inactive', async (action, url, method) => {
    const message = 'Monitoramento interrompido.'
    const server = detailServer([first, second], (requested, init) =>
      requested === url && init?.method === method ? reply(409, apiError('tracking_inactive', message)) : undefined)
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server.route)
    const dialog = within(await openDetail(user))
    if (action === 'Criar alerta') await user.type(dialog.getByLabelText('Avise quando chegar a'), '70.00')
    await user.click(dialog.getByRole('button', { name: action }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(productRow('Cafeteira elétrica')).toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent(message)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
  })

  // Resposta real do backend: parar é soft delete; PATCH/DELETE do alerta respondem 200/204 e o
  // detalhe recarregado volta com active=false.
  it.each([
    ['Pausar alerta', 'PATCH', () => reply(200, alertFixture({ enabled: false }))],
    ['Salvar alvo', 'PATCH', () => reply(200, alertFixture({ target_price: '70.00' }))],
    ['Excluir alerta', 'DELETE', () => reply(204, null)],
  ])('fecha o detalhe quando %s conclui e o detalhe recarregado está inativo', async (action, method, outcome) => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    const stopped = product('1', 'Fone sem fio', {}, { active: false, alert: alertFixture({ enabled: false }) })
    let current = [withAlert, second]
    let detail = withAlert
    const { user } = await renderArea(dashboardFixture({ items: current }), (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === method) {
        current = [second]
        detail = stopped
        return outcome()
      }
      if (url === itemUrl) return reply(200, detail)
      if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current }))
      return undefined
    })
    const dialog = within(await openDetail(user))
    if (action === 'Salvar alvo') await user.type(dialog.getByLabelText('Novo alvo (opcional)'), '70.00')
    await user.click(dialog.getByRole('button', { name: action }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent('Monitoramento interrompido.')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
  })

  it('mantém o detalhe aberto e atualizado quando só o alerta foi excluído em outra aba', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    let detail = withAlert
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }), (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'PATCH') {
        detail = first
        return reply(404, apiError('resource_not_found', 'Alerta não encontrado.'))
      }
      if (url === itemUrl) return reply(200, detail)
      if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: [detail, second] }))
      return undefined
    })
    const dialog = within(await openDetail(user))
    await user.click(dialog.getByRole('button', { name: 'Pausar alerta' }))
    const current = within(screen.getByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
    expect(await current.findByRole('alert')).toHaveTextContent('Alerta não encontrado.')
    expect(current.getByRole('button', { name: 'Criar alerta' })).toBeInTheDocument()
    expect(productRow('Fone sem fio')).toBeInTheDocument()
    expect(within(productRow('Fone sem fio')).queryByText(/Alerta em/)).not.toBeInTheDocument()
  })

  it('remove o produto quando o alerta some e o detalhe também responde 404', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    let gone = false
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }), (url, init) => {
      if (url === `${itemUrl}/alert` && init?.method === 'PATCH') {
        gone = true
        return reply(404, apiError('resource_not_found', 'Alerta não encontrado.'))
      }
      if (url === itemUrl) return gone ? reply(404, apiError('resource_not_found', 'Produto monitorado não encontrado.')) : reply(200, withAlert)
      if (url === `${itemUrl}/history`) return reply(200, { items: [], next_cursor: null })
      return undefined
    })
    const dialog = within(await openDetail(user))
    await user.click(dialog.getByRole('button', { name: 'Pausar alerta' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent('Produto monitorado não encontrado.')
  })
})

describe('aberturas concorrentes do detalhe', () => {
  it('mostra o detalhe da última abertura quando a anterior responde depois', async () => {
    const slow = deferred()
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), (url) => {
      if (url === itemUrl) return slow.promise
      if (url === `${itemUrl}/history` || url === '/api/tracked-products/tracking-2/history') return reply(200, { items: [], next_cursor: null })
      if (url === '/api/tracked-products/tracking-2') return reply(200, second)
      return undefined
    })
    await user.click(screen.getByRole('button', { name: 'Ver detalhes de Fone sem fio' }))
    await user.click(screen.getByRole('button', { name: 'Ver detalhes de Cafeteira elétrica' }))
    expect(await screen.findByRole('dialog', { name: 'Detalhes de Cafeteira elétrica' })).toBeInTheDocument()
    slow.resolve(reply(200, first))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByRole('dialog', { name: 'Detalhes de Cafeteira elétrica' })).toBeInTheDocument()
  })
})
