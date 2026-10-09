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

function apiError(code: string, message: string, extra: { tracked_product_id?: string; retry_after_seconds?: number } = {}) {
  return { error: { code, message, fields: [], tracked_product_id: extra.tracked_product_id ?? null, retry_after_seconds: extra.retry_after_seconds ?? null } }
}

const emptyDashboard = {
  summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 },
  opportunities: [], tracked_products: { items: [], next_cursor: null }, recent_updates: [],
}

const productUrl = 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM'

function trackedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tracking-1', active: true, active_since: '2026-10-08T10:00:00Z', alert: null,
    product: {
      id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
      canonical_url: productUrl, currency: 'BRL', price_context: 'mlb_marketplace_unit',
      current_price: '80.00', previous_price: '100.00', min_price: '80.00', max_price: '100.00',
      absolute_change: '-20.00', percentage_change: '-20.00', availability: 'available', lookup_status: 'located',
      last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-08T11:00:00Z',
      last_attempt_status: 'ok', last_attempt_at: '2026-10-08T11:00:00Z',
      last_success_at: '2026-10-08T11:00:00Z', last_price_observed_at: '2026-10-08T11:00:00Z',
      price_changed_at: '2026-10-08T11:00:00Z', stale: false, ...overrides,
    },
  }
}

function dashboardWith(items: unknown[], recentUpdates: unknown[] = []) {
  return {
    ...emptyDashboard, summary: { ...emptyDashboard.summary, tracked_count: items.length },
    tracked_products: { items, next_cursor: null }, recent_updates: recentUpdates,
  }
}

function submitUrl() {
  fireEvent.change(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...'), { target: { value: productUrl } })
  fireEvent.click(screen.getByRole('button', { name: 'Monitorar preço' }))
}

type Route = (url: string) => Promise<unknown> | undefined

function signedIn(route: Route, dashboard: unknown = emptyDashboard) {
  const mockFetch = vi.fn((url: string) => {
    const custom = route(url)
    if (custom) return custom
    if (url === '/api/auth/me') return Promise.resolve(reply(200, { id: 'user-1', email: 'pessoa@example.com' }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, dashboard))
    if (url === '/api/notifications') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    throw new Error(`Rota inesperada: ${url}`)
  })
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
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

it('mostra bloqueio real da integração sem criar sucesso fictício nem encerrar a sessão', async () => {
  const backendMessage = 'Cadastro indisponível até a autorização da integração com o Mercado Livre.'
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(503, apiError('integration_not_configured', backendMessage))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  expect(screen.queryByText(/integração oficial autorizada/i)).not.toBeInTheDocument()
  submitUrl()
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(backendMessage))
  expect(screen.getByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
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

it('mostra erro com nova tentativa quando a sessão não pode ser verificada por falha de rede', async () => {
  const mockFetch = signedIn(() => undefined)
  mockFetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
  render(<App />)
  expect(await screen.findByText('Não foi possível conectar à API.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
})

it('não pede login quando a verificação de sessão recebe 503', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.'))))
  render(<App />)
  expect(await screen.findByText('Serviço temporariamente indisponível.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
})

it('volta ao login quando uma chamada autenticada recebe 401 no meio da sessão', async () => {
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.'))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
  expect(screen.queryByText('pessoa@example.com')).not.toBeInTheDocument()
  expect(screen.queryByText('Você ainda não monitora anúncios.')).not.toBeInTheDocument()
})

it('oferece Ver produto quando o anúncio já é monitorado', async () => {
  const item = trackedItem()
  signedIn((url) => {
    if (url === '/api/tracked-products') return Promise.resolve(reply(409, apiError('already_tracked', 'Você já monitora este anúncio.', { tracked_product_id: 'tracking-1' })))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByText('Você já monitora este anúncio.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver produto' }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
})

it('informa quando tentar novamente após limite de consultas', async () => {
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(429, apiError('integration_rate_limited', 'Limite de consultas ao Mercado Livre atingido.', { retry_after_seconds: 90 }))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  submitUrl()
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Limite de consultas ao Mercado Livre atingido.')
  expect(alert).toHaveTextContent('Tente novamente em 2 minutos.')
})

it('mostra erro na área de notificações quando elas não carregam', async () => {
  signedIn((url) => url === '/api/notifications'
    ? Promise.resolve(reply(500, apiError('internal_error', 'Não foi possível carregar as notificações.'))) : undefined)
  render(<App />)
  const section = within(await screen.findByRole('region', { name: 'Notificações' }))
  expect(await section.findByRole('alert')).toHaveTextContent('Não foi possível carregar as notificações.')
  expect(section.queryByText('Sem notificações por enquanto.')).not.toBeInTheDocument()
})

it('rejeita atualização recente com valor fora do contrato', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'price_changed', previous_value: '100.00', current_value: 80, currency: 'BRL', observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
  expect(screen.queryByText('As mudanças confirmadas aparecerão aqui.')).not.toBeInTheDocument()
})

it('rejeita atualização recente com tipo desconhecido', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'stock_guess', previous_value: 'available', current_value: 'unavailable', currency: null, observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('rejeita atualização recente sem produto, moeda ou instante válidos', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', type: 'price_changed', previous_value: '100.00', current_value: '80.00', currency: 7, observed_at: null },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('exibe atualização recente válida de disponibilidade sem moeda', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'availability_changed', previous_value: 'available', current_value: 'unavailable', currency: null, observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  expect(await screen.findByText(/Disponibilidade alterada/)).toBeInTheDocument()
})

it('mostra mensagem de rede quando o cadastro não alcança a API', async () => {
  signedIn((url) => url === '/api/tracked-products' ? Promise.reject(new TypeError('Failed to fetch')) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não monitora anúncios.')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.')
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
})

it('recarrega o vínculo e mostra o erro quando a atualização falha na fonte', async () => {
  const before = trackedItem()
  const after = trackedItem({ last_attempt_status: 'temporary_error', last_attempt_at: '2026-10-08T12:00:00Z' })
  let refreshed = false
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') {
      refreshed = true
      return Promise.resolve(reply(503, apiError('integration_unavailable', 'Mercado Livre indisponível no momento.')))
    }
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, refreshed ? after : before))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, dashboardWith([refreshed ? after : before])))
    return undefined
  })
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText('Resultado da última tentativa: Consulta concluída')).toBeInTheDocument()
  fireEvent.click(detail.getByRole('button', { name: 'Atualizar agora' }))
  expect(await detail.findByText('Resultado da última tentativa: Falha temporária na consulta')).toBeInTheDocument()
  expect(detail.getByRole('alert')).toHaveTextContent('Mercado Livre indisponível no momento.')
  const tracked = within(screen.getByRole('region', { name: 'Produtos monitorados' }))
  expect(await tracked.findByText('Última tentativa: Falha temporária na consulta')).toBeInTheDocument()
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
})

it('volta ao login quando a atualização recebe 401', async () => {
  const item = trackedItem()
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') return Promise.resolve(reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.')))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Atualizar agora' }))
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
})

it('mostra Preço indisponível e métricas desconhecidas para item sem preço observado', async () => {
  const item = trackedItem({
    current_price: null, previous_price: null, min_price: null, max_price: null, absolute_change: null,
    percentage_change: null, last_attempt_status: 'missing_price', availability: 'unknown',
    last_confirmed_availability: null, last_confirmed_availability_at: null,
    last_price_observed_at: null, price_changed_at: null, stale: true,
  })
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  expect(screen.getByText('Preço indisponível')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText('Preço indisponível')).toBeInTheDocument()
  expect(detail.getByText('Ainda não há preço válido registrado.')).toBeInTheDocument()
  expect(detail.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument()
  expect(detail.getByText('Anterior: Desconhecido · Diferença: Desconhecida · Variação: Desconhecida')).toBeInTheDocument()
  expect(detail.getByText('Menor: Desconhecido · Maior: Desconhecido')).toBeInTheDocument()
  expect(detail.getByText('Último preço observado: Desconhecido')).toBeInTheDocument()
  expect(detail.getByText('Última mudança de preço: Desconhecida')).toBeInTheDocument()
})
