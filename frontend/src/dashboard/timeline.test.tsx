import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dashboardFixture, reply } from '../test/fakeApi'
import { product, renderArea } from '../test/productsHarness'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const loaded = product('1', 'Fone sem fio')

function event(id: string, type: 'price_changed' | 'availability_changed', previous: string, current: string, overrides: Record<string, unknown> = {}) {
  return {
    id, tracked_product_id: 'tracking-1', type, previous_value: previous, current_value: current,
    currency: type === 'price_changed' ? 'BRL' : null, observed_at: '2026-10-11T17:15:00Z', ...overrides,
  }
}

function timeline() {
  return within(screen.getByRole('region', { name: 'Atualizações recentes' }))
}

function plain(element: HTMLElement) {
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

describe('Atualizações recentes', () => {
  it('descreve cada evento com direção decidida por comparação decimal exata', async () => {
    await renderArea(dashboardFixture({ items: [loaded], recentUpdates: [
      event('e1', 'price_changed', '99.90', '100.00', { observed_at: '2026-10-11T17:50:00Z' }),
      event('e2', 'price_changed', '100.10', '100.09'),
      event('e3', 'price_changed', '1079.00', '1079.0'),
      event('e4', 'price_changed', 'abc', '80.00'),
      event('e5', 'availability_changed', 'unavailable', 'available'),
      event('e6', 'availability_changed', 'available', 'unavailable', { observed_at: '2026-10-10T20:00:00Z' }),
    ] }), undefined, '/app/monitoring/overview')
    const items = timeline().getAllByRole('listitem')
    const texts = items.map((item) => plain(item.querySelector('p') as HTMLElement))
    expect(texts).toEqual([
      'Fone sem fio aumentou de R$ 99,90 para R$ 100,00.',
      'Fone sem fio caiu de R$ 100,10 para R$ 100,09.',
      'Fone sem fio teve o preço alterado.',
      'Fone sem fio teve o preço alterado.',
      'Fone sem fio voltou a ficar disponível.',
      'Fone sem fio ficou indisponível.',
    ])
    expect(items[0].querySelector('[data-direction="up"]')).not.toBeNull()
    expect(items[1].querySelector('[data-direction="down"]')).not.toBeNull()
    expect(items[2].querySelector('[data-direction]')).toBeNull()
    expect(items[3].querySelector('[data-direction]')).toBeNull()
    expect(items[2]).not.toHaveTextContent('R$')
    expect(items[3]).not.toHaveTextContent('R$')
    expect(within(items[0]).getByText('Há 10 min')).toBeInTheDocument()
    expect(within(items[1]).getByText('Há 45 min')).toBeInTheDocument()
    expect(within(items[5]).getByText('Há 22 h')).toBeInTheDocument()
    expect(timeline().queryByText(/Ver todas/)).not.toBeInTheDocument()
  })

  it('usa “Um produto monitorado” e oferece Ver produto quando o produto não está carregado', async () => {
    const other = product('9', 'Liquidificador')
    const { user } = await renderArea(dashboardFixture({ items: [loaded], recentUpdates: [
      event('e1', 'price_changed', '100.00', '90.00', { tracked_product_id: 'tracking-9' }),
    ] }), (url) => {
      if (url === '/api/tracked-products/tracking-9') return reply(200, other)
      if (url === '/api/tracked-products/tracking-9/history') return reply(200, { items: [], next_cursor: null })
      return undefined
    }, '/app/monitoring/overview')
    const [item] = timeline().getAllByRole('listitem')
    expect(plain(item.querySelector('p') as HTMLElement)).toBe('Um produto monitorado caiu de R$ 100,00 para R$ 90,00.')
    await user.click(within(item).getByRole('link', { name: 'Ver produto' }))
    expect(window.location.pathname).toBe('/produtos/tracking-9')
    expect(await screen.findByRole('heading', { name: 'Liquidificador' })).toBeInTheDocument()
  })

  it('mostra o texto de vazio sem entradas fictícias', async () => {
    await renderArea(dashboardFixture({ items: [loaded], recentUpdates: [] }), undefined, '/app/monitoring/overview')
    expect(timeline().getByText('As mudanças confirmadas de preço e disponibilidade aparecerão aqui.')).toBeInTheDocument()
    expect(timeline().queryAllByRole('listitem')).toHaveLength(0)
  })
})
