import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { dashboardFixture, fakeApi, reply, trackedFixture } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

const withImage = trackedFixture({
  id: 'product-1', title: 'Fone sem fio', image_url: 'https://http2.mlstatic.com/fone.jpg',
  current_price: '1079.00', previous_price: '1499.00', min_price: '1049.00', percentage_change: '-28.02',
  last_price_observed_at: '2026-10-11T15:00:00Z',
}, { id: 'tracking-1' })
const withoutImage = trackedFixture({
  id: 'product-2', title: 'Cafeteira elétrica', image_url: null,
  current_price: '364.90', previous_price: '429.00', min_price: '329.00', percentage_change: '-14.94',
  last_price_observed_at: '2026-10-11T17:30:00Z',
}, { id: 'tracking-2' })

async function renderOverview(dashboard: unknown) {
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-2') return reply(200, withoutImage)
    if (url === '/api/tracked-products/tracking-2/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  }, dashboard)
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await screen.findByRole('heading', { name: 'Seus produtos' })
  await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
  return { user }
}

function plain(element: HTMLElement) {
  return element.textContent?.replace(/\s+/g, ' ').trim()
}

describe('indicadores', () => {
  it('mostra os quatro valores do resumo com os textos complementares exatos e sem deltas', async () => {
    await renderOverview(dashboardFixture({
      items: [withImage], summary: { tracked_count: 12, price_drop_count: 4, active_alert_count: 6, target_reached_count: 2 },
    }))
    const region = screen.getByRole('region', { name: 'Resumo do monitoramento' })
    const items = within(region).getAllByRole('listitem').map(plain)
    expect(items).toEqual([
      'Produtos monitorados 12',
      'Baixaram de preço 4 nas últimas 24h',
      'Alertas ativos 6',
      'Preço-alvo atingido 2 no alvo agora',
    ])
    expect(region).not.toHaveTextContent(/↑|↓|\+|neste mês|próximo|7 dias/)
  })
})

describe('boas oportunidades', () => {
  it('mostra cada card com os dados do contrato, na ordem da API, sem Ver todos', async () => {
    await renderOverview(dashboardFixture({ items: [withImage, withoutImage], opportunities: [withoutImage, withImage] }))
    const region = screen.getByRole('region', { name: 'Boas oportunidades' })
    const section = within(region)
    expect(section.getByText('Produtos monitorados que tiveram redução de preço recentemente.')).toBeInTheDocument()
    const cards = section.getAllByRole('listitem')
    expect(cards.map((card) => within(card).getByRole('button').textContent)).toEqual(['Cafeteira elétrica', 'Fone sem fio'])

    const first = within(cards[1])
    expect(cards[1].querySelector('img')).toHaveAttribute('src', 'https://http2.mlstatic.com/fone.jpg')
    expect(first.getByText(/R\$\s*1\.499,00/).closest('s')).not.toBeNull()
    expect(first.getByText(/^R\$\s*1\.079,00$/)).toBeInTheDocument()
    const badge = first.getByText(/28,02%/).closest('.drop-badge')
    expect(badge).toHaveTextContent('Queda de 28,02%')
    expect(badge?.querySelector('svg')).not.toBeNull()
    expect(plain(first.getByText(/Menor preço/).closest('p') as HTMLElement)).toMatch(/^Menor preço: R\$ 1\.049,00 desde o primeiro registro no BestPrice$/)
    expect(plain(first.getByText(/Preço observado:/).closest('p') as HTMLElement)).toBe('Preço observado: Há 3 h, 11/10/2026, 12:00:00')

    expect(cards[0].querySelector('img')).toBeNull()
    expect(cards[0].querySelector('.image-placeholder')).toHaveAttribute('aria-hidden', 'true')
    expect(within(cards[0]).getByText(/Preço observado:/).closest('p')).toHaveTextContent('Há 30 min')
    expect(section.queryByText(/Ver todos/)).not.toBeInTheDocument()
  })

  it('abre o detalhe ao ativar o card', async () => {
    const { user } = await renderOverview(dashboardFixture({ items: [withImage, withoutImage], opportunities: [withoutImage] }))
    const card = within(screen.getByRole('region', { name: 'Boas oportunidades' })).getByRole('button', { name: 'Cafeteira elétrica' })
    card.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'Detalhes de Cafeteira elétrica' })).toBeInTheDocument()
  })

  it('não mostra selo vazio sem percentual e identifica preço anterior desconhecido', async () => {
    const partial = trackedFixture({ id: 'product-3', title: 'Liquidificador', percentage_change: null, previous_price: null }, { id: 'tracking-3' })
    await renderOverview(dashboardFixture({ items: [withImage], opportunities: [partial] }))
    const [card] = within(screen.getByRole('region', { name: 'Boas oportunidades' })).getAllByRole('listitem')
    expect(card.querySelector('.drop-badge')).toBeNull()
    expect(card.querySelector('s')).toBeNull()
    expect(card).toHaveTextContent('Preço anterior: Desconhecido')
  })

  it('informa quando há produtos mas nenhuma oportunidade', async () => {
    await renderOverview(dashboardFixture({ items: [withImage], opportunities: [] }))
    expect(within(screen.getByRole('region', { name: 'Boas oportunidades' }))
      .getByText('Nenhuma oportunidade de queda nas últimas 24 horas.')).toBeInTheDocument()
  })
})
