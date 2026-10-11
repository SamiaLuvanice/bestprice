import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { alertFixture, apiError, callsTo, dashboardFixture, reply, type Route } from '../test/fakeApi'
import { product, productRow, renderArea as renderProducts } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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
    expect(missing.getAllByText(/Anúncio não localizado no Mercado Livre/)).toHaveLength(1)
    expect(missing.getByText('Último preço conhecido')).toBeInTheDocument()
    expect(within(productRow('Cafeteira elétrica')).getByText('Preço desatualizado')).toBeInTheDocument()
    const limited = within(productRow('Liquidificador'))
    expect(limited.getByText('Agora')).toBeInTheDocument()
    expect(limited.getByText('Última tentativa: Limite de consultas atingido')).toBeInTheDocument()
    expect(within(productRow('Cafeteira elétrica')).queryByText(/Última tentativa:/)).not.toBeInTheDocument()
  })

  it('carrega a página seguinte sozinho quando a lista carregada fica vazia mas há cursor', async () => {
    const second = product('2', 'Cafeteira elétrica')
    const { mockFetch } = await renderProducts(dashboardFixture({ items: [], nextCursor: 'page-2', summary: { tracked_count: 1 } }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(200, { items: [second], next_cursor: null }) : undefined)
    expect(await screen.findByRole('rowgroup', { name: 'Cafeteira elétrica' })).toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/tracked-products?cursor=page-2')).toHaveLength(1)
    expect(screen.queryByText('Você ainda não está acompanhando nenhum produto.')).not.toBeInTheDocument()
  })

  it('tenta a página seguinte automática uma vez só e mostra o erro com Carregar mais', async () => {
    const { mockFetch } = await renderProducts(dashboardFixture({ items: [], nextCursor: 'page-2', summary: { tracked_count: 1 } }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(500, apiError('internal_error', 'Não foi possível carregar mais produtos.')) : undefined)
    const section = within(screen.getByRole('region', { name: 'Seus produtos' }))
    expect(await section.findByRole('alert')).toHaveTextContent('Não foi possível carregar mais produtos.')
    expect(section.getByRole('button', { name: 'Carregar mais produtos' })).toBeEnabled()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(callsTo(mockFetch, '/api/tracked-products?cursor=page-2')).toHaveLength(1)
  })

  it('leva o foco ao primeiro produto novo numa página intermediária', async () => {
    const first = product('1', 'Fone sem fio')
    const second = product('2', 'Cafeteira elétrica')
    const { user } = await renderProducts(dashboardFixture({ items: [first], nextCursor: 'page-2' }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(200, { items: [second], next_cursor: 'page-3' }) : undefined)
    screen.getByRole('button', { name: 'Carregar mais produtos' }).focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver detalhes de Cafeteira elétrica' })).toHaveFocus())
    expect(screen.getByRole('button', { name: 'Carregar mais produtos' })).toBeInTheDocument()
  })

  it('acrescenta a página seguinte sem repetir IDs e esconde Carregar mais sem cursor', async () => {
    const first = product('1', 'Fone sem fio')
    const second = product('2', 'Cafeteira elétrica')
    const { user, mockFetch } = await renderProducts(dashboardFixture({ items: [first], nextCursor: 'page-2' }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(200, { items: [first, second], next_cursor: null }) : undefined)
    await user.click(screen.getByRole('button', { name: 'Carregar mais produtos' }))
    expect(await screen.findByRole('rowgroup', { name: 'Cafeteira elétrica' })).toBeInTheDocument()
    expect(screen.getAllByRole('rowgroup', { name: 'Fone sem fio' })).toHaveLength(1)
    // Na última página o botão some: o foco vai ao primeiro item recém-carregado, não ao body.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver detalhes de Cafeteira elétrica' })).toHaveFocus())
    expect(screen.queryByRole('button', { name: 'Carregar mais produtos' })).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/tracked-products?cursor=page-2')).toHaveLength(1)
  })
})

describe('ações da linha', () => {
  const item = product('1', 'Fone sem fio')
  const detailRoutes: Route = (url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, {
      items: [{ id: 'h-1', price: '80.00', currency: 'BRL', captured_at: '2026-10-11T16:00:00Z' }], next_cursor: null,
    })
    return undefined
  }

  it('abre o detalhe da 0013 por Ver detalhes, com histórico, instantes e alerta', async () => {
    const { user } = await renderProducts(dashboardFixture({ items: [item] }), detailRoutes)
    await user.click(screen.getByRole('button', { name: 'Ver detalhes de Fone sem fio' }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
    expect(dialog.getByRole('heading', { name: 'Histórico de preços' })).toBeInTheDocument()
    expect(dialog.getByText(/Última tentativa:/)).toBeInTheDocument()
    expect(dialog.getByRole('heading', { name: 'Alerta de preço' })).toBeInTheDocument()
    const external = dialog.getByRole('link', { name: 'Ver anúncio no Mercado Livre (abre em nova aba)' })
    expect(external).toHaveAttribute('href', item.product.canonical_url)
    expect(external).toHaveAttribute('target', '_blank')
  })

  it('oferece Atualizar agora, link externo e Parar de monitorar no menu da linha', async () => {
    const { user } = await renderProducts(dashboardFixture({ items: [item] }))
    const menuButton = screen.getByRole('button', { name: 'Ações de Fone sem fio' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await user.click(menuButton)
    const menu = within(screen.getByRole('group', { name: 'Ações de Fone sem fio' }))
    expect(menu.getByRole('button', { name: 'Atualizar agora' })).toBeInTheDocument()
    const external = menu.getByRole('link', { name: 'Ver anúncio no Mercado Livre (abre em nova aba)' })
    expect(external).toHaveAttribute('href', item.product.canonical_url)
    expect(external).toHaveAttribute('target', '_blank')
    expect(external.getAttribute('rel')).toMatch(/noopener/)
    expect(external.getAttribute('rel')).toMatch(/noreferrer/)
    expect(menu.getByRole('button', { name: 'Parar de monitorar' })).toBeInTheDocument()
  })

  it('opera o menu da linha só pelo teclado', async () => {
    const { user } = await renderProducts(dashboardFixture({ items: [item, product('2', 'Cafeteira elétrica')] }))
    const menuButton = screen.getByRole('button', { name: 'Ações de Fone sem fio' })
    menuButton.focus()
    await user.keyboard('{Enter}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Atualizar agora' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Atualizar agora' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /Ver anúncio no Mercado Livre/ })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus()
    await user.tab()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    menuButton.focus()
    await user.keyboard(' ')
    await user.tab()
    await user.keyboard('{Escape}')
    expect(menuButton).toHaveFocus()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{Enter}')
    await user.tab()
    await user.tab({ shift: true })
    expect(menuButton).toHaveFocus()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
