import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { dashboardFixture, fakeApi, trackedFixture } from '../test/fakeApi'

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

async function renderOverview(dashboard: unknown) {
  window.history.replaceState(null, '', '/app/monitoring')
  fakeApi(() => undefined, dashboard)
  render(<App clock={clock} />)
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
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

// 0063: "Boas oportunidades" saiu da página única; seus testes foram removidos com a seção.
