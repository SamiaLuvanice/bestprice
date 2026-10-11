import { vi } from 'vitest'

// Dublê da fronteira HTTP: fixtures no formato exato do contrato da 0013 (strings decimais, ISO 8601 com Z).
// Dados de exemplo existem somente aqui e nos testes (spec 0012, “Marca, dados e marketplace”).

export function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

export function apiError(code: string, message: string, extra: { tracked_product_id?: string; retry_after_seconds?: number } = {}) {
  return { error: { code, message, fields: [], tracked_product_id: extra.tracked_product_id ?? null, retry_after_seconds: extra.retry_after_seconds ?? null } }
}

export const productUrl = 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM'
export const sessionUser = { id: 'user-1', email: 'pessoa@example.com' }

export function productFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1', external_id: 'MLB1234567890', title: 'Fone sem fio', image_url: null,
    canonical_url: productUrl, currency: 'BRL', price_context: 'mlb_marketplace_unit',
    current_price: '80.00', previous_price: '100.00', min_price: '80.00', max_price: '100.00',
    absolute_change: '-20.00', percentage_change: '-20.00', availability: 'available', lookup_status: 'located',
    last_confirmed_availability: 'available', last_confirmed_availability_at: '2026-10-08T11:00:00Z',
    last_attempt_status: 'ok', last_attempt_at: '2026-10-08T11:00:00Z',
    last_success_at: '2026-10-08T11:00:00Z', last_price_observed_at: '2026-10-08T11:00:00Z',
    price_changed_at: '2026-10-08T11:00:00Z', stale: false, ...overrides,
  }
}

/** Vínculo monitorado; `productOverrides` altera o produto e `trackedOverrides` o vínculo (id, alerta…). */
export function trackedFixture(productOverrides: Record<string, unknown> = {}, trackedOverrides: Record<string, unknown> = {}) {
  return {
    id: 'tracking-1', active: true, active_since: '2026-10-08T10:00:00Z', alert: null,
    product: productFixture(productOverrides), ...trackedOverrides,
  }
}

export function alertFixture(overrides: Record<string, unknown> = {}) {
  return { id: 'alert-1', target_price: '99.90', enabled: true, condition: 'at_or_below', ...overrides }
}

export function notificationFixture(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, tracked_product_id: 'tracking-1', product_title: `Aviso ${id}`, observed_price: '80.00',
    target_price: '90.00', created_at: '2026-10-08T11:00:00Z', read_at: null as string | null, ...overrides,
  }
}

export const emptySummary = { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 }

export const emptyDashboard = {
  summary: emptySummary, opportunities: [], tracked_products: { items: [], next_cursor: null }, recent_updates: [],
}

export function dashboardFixture(options: {
  items?: unknown[]; nextCursor?: string | null; opportunities?: unknown[]; recentUpdates?: unknown[]
  summary?: Partial<typeof emptySummary>
} = {}) {
  const items = options.items ?? []
  return {
    summary: { ...emptySummary, tracked_count: items.length, ...options.summary },
    opportunities: options.opportunities ?? [],
    tracked_products: { items, next_cursor: options.nextCursor ?? null },
    recent_updates: options.recentUpdates ?? [],
  }
}

/** Mantido para os testes migrados da 0013: painel com a lista e eventos informados. */
export function dashboardWith(items: unknown[], recentUpdates: unknown[] = []) {
  return dashboardFixture({ items, recentUpdates })
}

export const unreadUrl = '/api/notifications?unread_only=true&limit=100'

export function emptyPage() {
  return reply(200, { items: [], next_cursor: null })
}

/** Promessa controlada pelo teste, para decidir quando (e em que ordem) uma resposta chega. */
export function deferred<T = unknown>() {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

export type Route = (url: string, init?: RequestInit) => unknown

const unexpectedCalls: string[] = []

/** Devolve e limpa as rotas não previstas chamadas desde a última verificação. */
export function takeUnexpectedCalls(): string[] {
  return unexpectedCalls.splice(0, unexpectedCalls.length)
}

/**
 * Substitui `fetch` por um roteador. A rota do teste tem prioridade; quando devolve `undefined`,
 * valem os padrões de pessoa autenticada: `me`, painel informado e notificações (todas e não lidas) vazias.
 * Rotas não previstas lançam erro com método e URL, para o teste não passar por acaso.
 */
export function fakeApi(route: Route = () => undefined, dashboard: unknown = emptyDashboard) {
  const mockFetch = vi.fn((url: string, init?: RequestInit) => {
    const custom = route(url, init)
    if (custom !== undefined) return Promise.resolve(custom)
    const method = init?.method ?? 'GET'
    if (method === 'GET') {
      if (url === '/api/auth/me') return Promise.resolve(reply(200, sessionUser))
      if (url === '/api/dashboard') return Promise.resolve(reply(200, dashboard))
      if (url === '/api/notifications' || url === unreadUrl) return Promise.resolve(emptyPage())
    }
    // O cliente traduziria o erro em “falha de rede” silenciosa; a rota fica registrada e o
    // afterEach global (src/test-setup.ts) reprova o teste.
    unexpectedCalls.push(`${method} ${url}`)
    throw new Error(`Rota inesperada: ${method} ${url}`)
  })
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

/** Chamadas registradas no dublê para um método e URL. */
export function callsTo(mockFetch: ReturnType<typeof fakeApi>, url: string, method = 'GET') {
  return mockFetch.mock.calls.filter(([calledUrl, init]) => calledUrl === url && (init?.method ?? 'GET') === method)
}
