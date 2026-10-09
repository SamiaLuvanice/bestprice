import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

it('exibe a proposta do BestPrice e pede sessão antes de monitorar', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, {
    error: { code: 'unauthenticated', message: 'Entre para continuar.' },
  })))
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Acompanhe o preço. Compre na hora certa.' })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...')).toBeInTheDocument()
})

it('mostra bloqueio real da integração sem criar sucesso fictício', async () => {
  const mockFetch = vi.fn((url: string) => {
    if (url === '/api/auth/me') return Promise.resolve(reply(200, { id: 'user-1', email: 'pessoa@example.com' }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, {
      summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
      opportunities: [], tracked_products: { items: [], next_cursor: null }, recent_updates: [],
    }))
    if (url === '/api/tracked-products') return Promise.resolve(reply(503, {
      error: { code: 'integration_not_configured', message: 'Integração indisponível no momento.' },
    }))
    throw new Error(`Rota inesperada: ${url}`)
  })
  vi.stubGlobal('fetch', mockFetch)
  render(<App />)
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...'), {
    target: { value: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Monitorar preço' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Integração indisponível no momento.'))
  expect(screen.getByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
})

it('mostra anúncio persistido, detalhe e histórico recebidos da API', async () => {
  const item = {
    id: 'tracking-1', active: true, active_since: '2026-10-08T10:00:00Z', alert: null,
    product: {
      id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
      canonical_url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM', currency: 'BRL', price_context: 'mlb_marketplace_unit',
      current_price: '80.00', previous_price: '100.00', min_price: '80.00', max_price: '100.00',
      absolute_change: '-20.00', percentage_change: '-20.00', availability: 'available', lookup_status: 'located',
      last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-08T11:00:00Z',
      last_attempt_status: 'ok', last_attempt_at: '2026-10-08T11:00:00Z',
      last_success_at: '2026-10-08T11:00:00Z', last_price_observed_at: '2026-10-08T11:00:00Z',
      price_changed_at: '2026-10-08T11:00:00Z', stale: false,
    },
  }
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url === '/api/auth/me') return Promise.resolve(reply(200, { id: 'user-1', email: 'pessoa@example.com' }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, {
      summary: { tracked_count: 1, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
      opportunities: [], tracked_products: { items: [item], next_cursor: null }, recent_updates: [],
    }))
    if (url === '/api/notifications') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, {
      items: [
        { id: 'event-1', price: '100.00', currency: 'BRL', captured_at: '2026-10-08T10:00:00Z' },
        { id: 'event-2', price: '80.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' },
      ], next_cursor: null,
    }))
    throw new Error(`Rota inesperada: ${url}`)
  }))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver anúncio no Mercado Livre/ })).toHaveAttribute('href', item.product.canonical_url)
  expect(screen.getByText(/Menor: R\$\s*80,00/)).toBeInTheDocument()
})

it('carrega páginas adicionais de histórico e notificações sem repetir entradas', async () => {
  const item = {
    id: 'tracking-1', active: true, active_since: '2026-10-08T10:00:00Z', alert: null,
    product: {
      id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
      canonical_url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM', currency: 'BRL', price_context: 'mlb_marketplace_unit',
      current_price: '80.00', previous_price: null, min_price: '80.00', max_price: '80.00',
      absolute_change: null, percentage_change: null, availability: 'available', lookup_status: 'located',
      last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-08T11:00:00Z',
      last_attempt_status: 'ok', last_attempt_at: '2026-10-08T11:00:00Z',
      last_success_at: '2026-10-08T11:00:00Z', last_price_observed_at: '2026-10-08T11:00:00Z',
      price_changed_at: null, stale: false,
    },
  }
  const notification = (id: string) => ({
    id, tracked_product_id: item.id, product_title: `Aviso ${id}`, observed_price: '80.00',
    target_price: '90.00', created_at: '2026-10-08T11:00:00Z', read_at: null,
  })
  const history = (id: string) => ({ id, price: '80.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' })
  const mockFetch = vi.fn((url: string) => {
    if (url === '/api/auth/me') return Promise.resolve(reply(200, { id: 'user-1', email: 'pessoa@example.com' }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, {
      summary: { tracked_count: 1, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
      opportunities: [], tracked_products: { items: [item], next_cursor: null }, recent_updates: [],
    }))
    if (url === '/api/notifications') return Promise.resolve(reply(200, { items: [notification('notice-1')], next_cursor: 'notice-page-2' }))
    if (url === '/api/notifications?cursor=notice-page-2') return Promise.resolve(reply(200, { items: [notification('notice-2')], next_cursor: null }))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [history('price-1')], next_cursor: 'price-page-2' }))
    if (url === '/api/tracked-products/tracking-1/history?cursor=price-page-2') return Promise.resolve(reply(200, { items: [history('price-2')], next_cursor: null }))
    throw new Error(`Rota inesperada: ${url}`)
  })
  vi.stubGlobal('fetch', mockFetch)
  render(<App />)
  expect(await screen.findByText(/Aviso notice-1 chegou/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar mais notificações' }))
  expect(await screen.findByText(/Aviso notice-2 chegou/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Carregar mais notificações' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar mais preços' }))
  await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/tracked-products/tracking-1/history?cursor=price-page-2', expect.anything()))
  expect(screen.queryByRole('button', { name: 'Carregar mais preços' })).not.toBeInTheDocument()
  expect(screen.getAllByText(/R\$\s*80,00/).length).toBeGreaterThan(1)
})

it('distingue tentativa falha, leitura válida, preço observado e mudança no detalhe', async () => {
  const item = {
    id: 'tracking-1', active: true, active_since: '2026-10-08T10:00:00Z', alert: null,
    product: {
      id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
      canonical_url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM', currency: 'BRL',
      price_context: 'mlb_marketplace_unit', current_price: '80.00', previous_price: '100.00',
      min_price: '80.00', max_price: '100.00', absolute_change: '-20.00', percentage_change: '-20.00',
      lookup_status: 'located', availability: 'available', last_confirmed_availability: 'available',
      last_confirmed_availability_at: '2026-10-08T11:00:00Z', last_attempt_status: 'rate_limited',
      last_attempt_at: '2026-10-08T12:00:00Z', last_success_at: '2026-10-08T11:00:00Z',
      last_price_observed_at: '2026-10-08T11:00:00Z', price_changed_at: '2026-10-08T10:00:00Z', stale: true,
    },
  }
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url === '/api/auth/me') return Promise.resolve(reply(200, { id: 'user-1', email: 'pessoa@example.com' }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, {
      summary: { tracked_count: 1, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
      opportunities: [], tracked_products: { items: [item], next_cursor: null }, recent_updates: [],
    }))
    if (url === '/api/notifications') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    throw new Error(`Rota inesperada: ${url}`)
  }))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  expect(screen.getByText(/Último preço conhecido · preço desatualizado/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText(/Última tentativa:/)).toBeInTheDocument()
  expect(detail.getByText(/Última leitura válida:/)).toBeInTheDocument()
  expect(detail.getByText(/Último preço observado:/)).toBeInTheDocument()
  expect(detail.getByText(/Última mudança de preço:/)).toBeInTheDocument()
  expect(detail.getByText(/Limite de consultas atingido/)).toBeInTheDocument()
  expect(detail.getByText(/Anterior: R\$\s*100,00/)).toBeInTheDocument()
  expect(detail.getByText(/Variação: -20,00%/)).toBeInTheDocument()
})
