import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { alertFixture, apiError, callsTo, dashboardFixture, reply } from '../test/fakeApi'
import { chooseRowAction, linkField, product, productRow, renderArea, rowStatus } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const first = product('1', 'Fone sem fio')
const second = product('2', 'Cafeteira elétrica')
const third = product('3', 'Liquidificador')
const deleteUrl = '/api/tracked-products/tracking-1'

function server(items: ReturnType<typeof product>[], outcome: () => unknown, extra: Record<string, unknown> = {}, nextCursor: string | null = null) {
  let current = items
  return (url: string, init?: RequestInit) => {
    if (url === deleteUrl && init?.method === 'DELETE') {
      const result = outcome()
      if (result && typeof result === 'object' && 'status' in result && result.status === 204) current = current.filter((item) => item.id !== 'tracking-1')
      return result
    }
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current, nextCursor, summary: { tracked_count: current.length + 10 } }))
    if (url in extra) return extra[url]
    return undefined
  }
}

function confirmDialog() {
  return screen.getByRole('alertdialog', { name: 'Parar de monitorar “Fone sem fio”?' })
}

describe('Parar de monitorar pela linha', () => {
  it('pede confirmação com o título e só menciona o alerta quando ele está ativo', async () => {
    const withAlert = product('1', 'Fone sem fio', {}, { alert: alertFixture() })
    const { user } = await renderArea(dashboardFixture({ items: [withAlert, second] }))
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    const dialog = within(confirmDialog())
    expect(dialog.getByText('O histórico de preços é mantido. Você pode voltar a monitorar colando o link novamente.')).toBeInTheDocument()
    expect(dialog.getByText('O alerta deste produto será pausado.')).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    expect(dialog.getByRole('button', { name: 'Parar de monitorar' })).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Cancelar' }))
    await chooseRowAction(user, 'Cafeteira elétrica', 'Parar de monitorar')
    const other = within(screen.getByRole('alertdialog', { name: 'Parar de monitorar “Cafeteira elétrica”?' }))
    expect(other.queryByText('O alerta deste produto será pausado.')).not.toBeInTheDocument()
  })

  it.each([
    ['Cancelar', async (user: Awaited<ReturnType<typeof renderArea>>['user']) => user.click(within(confirmDialog()).getByRole('button', { name: 'Cancelar' }))],
    ['Esc', async (user: Awaited<ReturnType<typeof renderArea>>['user']) => user.keyboard('{Escape}')],
    // userEvent reproduz a ação padrão do mousedown (o navegador tira o foco para o body).
    ['clique fora', (user: Awaited<ReturnType<typeof renderArea>>['user']) => user.click(screen.getByTestId('confirm-backdrop'))],
  ])('cancela por %s sem requisição e devolve o foco ao menu da linha', async (_how, cancel) => {
    const { user, mockFetch } = await renderArea(dashboardFixture({ items: [first, second] }))
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    expect(confirmDialog()).toBeInTheDocument()
    await cancel(user)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(callsTo(mockFetch, deleteUrl, 'DELETE')).toHaveLength(0)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it('remove só o produto, preserva a página 2, anuncia e foca o título', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second], nextCursor: 'page-2' }), server([first, second], () => reply(204, null), {
      '/api/tracked-products?cursor=page-2': reply(200, { items: [third], next_cursor: null }),
    }, 'page-2'))
    await user.click(screen.getByRole('button', { name: 'Carregar mais produtos' }))
    await screen.findByRole('rowgroup', { name: 'Liquidificador' })
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(productRow('Cafeteira elétrica')).toBeInTheDocument()
    expect(productRow('Liquidificador')).toBeInTheDocument()
    expect(screen.getByTestId('products-status')).toHaveTextContent('Você parou de monitorar este produto.')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
    expect(window.location.pathname).toBe('/produtos')
  })

  it('leva o foco ao campo de link e anuncia globalmente quando era o único produto', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first] }), server([first], () => reply(204, null)))
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(linkField()).toHaveFocus())
    expect(screen.getByTestId('global-status')).toHaveTextContent('Você parou de monitorar este produto.')
    expect(screen.getByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  })

  it.each([
    ['500', () => reply(500, apiError('internal_error', 'Não foi possível parar de monitorar agora.')), 'Não foi possível parar de monitorar agora.'],
    ['rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível conectar ao BestPrice. Tente novamente.'],
  ])('mantém o produto e mostra o erro na linha quando parar falha (%s)', async (_case, outcome, message) => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }), server([first, second], outcome))
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(rowStatus('Fone sem fio')).toHaveTextContent(message))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ações de Fone sem fio' })).toHaveFocus())
  })

  it('trata 404 como produto já removido', async () => {
    const { user } = await renderArea(dashboardFixture({ items: [first, second] }),
      server([first, second], () => reply(404, apiError('resource_not_found', 'Produto monitorado não encontrado.'))))
    await chooseRowAction(user, 'Fone sem fio', 'Parar de monitorar')
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument())
    expect(screen.getByTestId('products-status')).toHaveTextContent('Produto monitorado não encontrado.')
  })
})
