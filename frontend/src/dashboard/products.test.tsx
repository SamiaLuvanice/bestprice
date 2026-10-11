import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { alertFixture, callsTo, dashboardFixture, fakeApi, reply, trackedFixture, type Route } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

const recentTimes = {
  last_price_observed_at: '2026-10-11T16:00:00Z', last_attempt_at: '2026-10-11T17:30:00Z', price_changed_at: '2026-10-11T15:00:00Z',
}

export function product(id: string, title: string, overrides: Record<string, unknown> = {}, tracked: Record<string, unknown> = {}) {
  return trackedFixture({ id: `product-${id}`, title, ...recentTimes, ...overrides }, { id: `tracking-${id}`, ...tracked })
}

export async function renderProducts(dashboard: unknown, route: Route = () => undefined) {
  const mockFetch = fakeApi(route, dashboard)
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await screen.findByRole('heading', { name: 'Seus produtos' })
  await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
  return { user, mockFetch }
}

export function productRow(title: string) {
  return screen.getByRole('rowgroup', { name: title })
}

function cellsOf(row: HTMLElement) {
  return within(row).getAllByRole('cell').map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
}

describe('tabela Seus produtos', () => {
  it('mostra colunas principais e informação secundária de cada produto', async () => {
    await renderProducts(dashboardFixture({ items: [
      product('1', 'Fone sem fio', {}, { alert: alertFixture({ target_price: '99.90' }) }),
      product('2', 'Cafeteira elétrica', { current_price: '105.00', previous_price: '100.00', percentage_change: '5.00', min_price: '90.00', max_price: '120.00' }),
    ] }))
    const section = within(screen.getByRole('region', { name: 'Seus produtos' }))
    expect(section.getByText('Todos os produtos que você está monitorando.')).toBeInTheDocument()
    expect(section.getByText('Ordem: mais recentes primeiro')).toBeInTheDocument()
    expect(section.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Produto', 'Preço atual', 'Variação', 'Menor preço', 'Disponibilidade', 'Preço observado', 'Ações',
    ])
    const [main, secondary] = within(productRow('Fone sem fio')).getAllByRole('row')
    const cells = cellsOf(main)
    expect(cells[0]).toBe('Fone sem fio')
    expect(cells[1]).toMatch(/^R\$ 80,00$/)
    expect(cells[2]).toBe('queda -20,00% vs. preço anterior')
    expect(main.querySelectorAll('td')[2].querySelector('svg')).not.toBeNull()
    expect(cells[3]).toMatch(/^R\$ 80,00$/)
    expect(cells[4]).toBe('Disponível')
    expect(cells[5]).toMatch(/^Há 2 h/)
    const details = within(secondary)
    expect(details.getByText('Preço anterior').closest('div')).toHaveTextContent(/Preço anterior\s*R\$\s*100,00/)
    expect(details.getByText('Maior preço').closest('div')).toHaveTextContent(/Maior preço\s*R\$\s*100,00/)
    expect(details.getByText('Última consulta').closest('div')).toHaveTextContent(/Última consulta\s*Há 30 min/)
    expect(details.getByText('Última alteração').closest('div')).toHaveTextContent(/Última alteração\s*Há 3 h/)
    expect(details.getByText(/Alerta em/)).toHaveTextContent(/Alerta em R\$\s*99,90/)
    expect(section.getByText('Menor e maior preço desde o primeiro registro no BestPrice.')).toBeInTheDocument()

    const other = productRow('Cafeteira elétrica')
    expect(cellsOf(within(other).getAllByRole('row')[0])[2]).toBe('alta +5,00% vs. preço anterior')
    expect(within(other).queryByText(/Alerta em/)).not.toBeInTheDocument()
  })

  it('não mostra selo de alerta pausado', async () => {
    await renderProducts(dashboardFixture({ items: [product('1', 'Fone sem fio', {}, { alert: alertFixture({ enabled: false }) })] }))
    expect(within(productRow('Fone sem fio')).queryByText(/Alerta em/)).not.toBeInTheDocument()
  })

  it('identifica valores ausentes sem transformá-los em zero', async () => {
    await renderProducts(dashboardFixture({ items: [product('1', 'Fone sem fio', {
      current_price: null, previous_price: null, min_price: null, max_price: null, absolute_change: null,
      percentage_change: null, last_attempt_at: null, price_changed_at: null, last_price_observed_at: null,
    })] }))
    const row = productRow('Fone sem fio')
    const [main, secondary] = within(row).getAllByRole('row')
    const cells = cellsOf(main)
    expect(cells[1]).toBe('Preço indisponível')
    expect(cells[2]).toBe('Desconhecida')
    expect(cells[3]).toBe('Desconhecido')
    expect(cells[5]).toBe('Desconhecida')
    const details = within(secondary)
    expect(details.getByText('Preço anterior').closest('div')).toHaveTextContent(/Preço anterior\s*Desconhecido/)
    expect(details.getByText('Maior preço').closest('div')).toHaveTextContent(/Maior preço\s*Desconhecido/)
    expect(details.getByText('Última consulta').closest('div')).toHaveTextContent(/Última consulta\s*Desconhecida/)
    expect(details.getByText('Última alteração').closest('div')).toHaveTextContent(/Última alteração\s*Desconhecida/)
    expect(row).not.toHaveTextContent(/R\$\s*0,00|\b0%/)
  })

  it.each([
    ['available', 'Disponível'],
    ['unavailable', 'Indisponível'],
    ['unknown', 'Não confirmada'],
  ])('mostra disponibilidade %s como %s', async (availability, label) => {
    await renderProducts(dashboardFixture({ items: [product('1', 'Fone sem fio', { availability })] }))
    expect(cellsOf(within(productRow('Fone sem fio')).getAllByRole('row')[0])[4]).toBe(label)
  })

  it('mostra anúncio não localizado, preço desatualizado e aviso da última tentativa', async () => {
    await renderProducts(dashboardFixture({ items: [
      product('1', 'Fone sem fio', { lookup_status: 'not_found', last_attempt_status: 'not_found' }),
      product('2', 'Cafeteira elétrica', { stale: true }),
      product('3', 'Liquidificador', { last_attempt_status: 'rate_limited', last_price_observed_at: '2026-10-11T17:59:30Z' }),
    ] }))
    const missing = within(productRow('Fone sem fio'))
    expect(missing.getByText('Anúncio não localizado no Mercado Livre')).toBeInTheDocument()
    expect(missing.getByText('Último preço conhecido')).toBeInTheDocument()
    expect(within(productRow('Cafeteira elétrica')).getByText('Preço desatualizado')).toBeInTheDocument()
    const limited = within(productRow('Liquidificador'))
    expect(limited.getByText('Agora')).toBeInTheDocument()
    expect(limited.getByText('Última tentativa: Limite de consultas atingido')).toBeInTheDocument()
    expect(within(productRow('Cafeteira elétrica')).queryByText(/Última tentativa:/)).not.toBeInTheDocument()
  })

  it('acrescenta a página seguinte sem repetir IDs e esconde Carregar mais sem cursor', async () => {
    const first = product('1', 'Fone sem fio')
    const second = product('2', 'Cafeteira elétrica')
    const { user, mockFetch } = await renderProducts(dashboardFixture({ items: [first], nextCursor: 'page-2' }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(200, { items: [first, second], next_cursor: null }) : undefined)
    await user.click(screen.getByRole('button', { name: 'Carregar mais produtos' }))
    expect(await screen.findByRole('rowgroup', { name: 'Cafeteira elétrica' })).toBeInTheDocument()
    expect(screen.getAllByRole('rowgroup', { name: 'Fone sem fio' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Carregar mais produtos' })).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/tracked-products?cursor=page-2')).toHaveLength(1)
  })
})
