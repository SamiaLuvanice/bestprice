export type User = { id: string; email: string }
export type Product = {
  id: string
  external_id: string
  title: string
  image_url: string | null
  canonical_url: string
  currency: string
  price_context: string
  current_price: string | null
  previous_price: string | null
  min_price: string | null
  max_price: string | null
  absolute_change: string | null
  percentage_change: string | null
  availability: string
  last_confirmed_availability: string | null
  last_confirmed_availability_at: string | null
  lookup_status: string
  last_attempt_status: string
  last_attempt_at: string | null
  last_success_at: string | null
  last_price_observed_at: string | null
  price_changed_at: string | null
  stale: boolean
}
export type Alert = { id: string; target_price: string; enabled: boolean; condition: string }
export type TrackedProduct = { id: string; active: boolean; active_since: string; product: Product; alert: Alert | null }
export type Dashboard = {
  summary: { tracked_count: number; price_drop_count: number; active_alert_count: number; target_reached_count: number }
  opportunities: TrackedProduct[]
  tracked_products: { items: TrackedProduct[]; next_cursor: string | null }
  recent_updates: { id: string; tracked_product_id: string; type: string; previous_value: string; current_value: string; observed_at: string }[]
}
export type HistoryEntry = { id: string; price: string; currency: string; captured_at: string }
export type Notification = { id: string; tracked_product_id: string; product_title: string; observed_price: string; target_price: string; created_at: string; read_at: string | null }

export class ApiFailure extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message) }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function string(value: unknown): value is string { return typeof value === 'string' }
function nullableString(value: unknown): value is string | null { return value === null || string(value) }

function user(value: unknown): value is User {
  return record(value) && string(value.id) && string(value.email)
}

function product(value: unknown): value is Product {
  return record(value) && string(value.id) && string(value.external_id) && string(value.title) &&
    nullableString(value.image_url) && string(value.canonical_url) && string(value.currency) && string(value.price_context) &&
    nullableString(value.current_price) && nullableString(value.previous_price) &&
    nullableString(value.min_price) && nullableString(value.max_price) && nullableString(value.absolute_change) &&
    nullableString(value.percentage_change) && string(value.availability) &&
    nullableString(value.last_confirmed_availability) && nullableString(value.last_confirmed_availability_at) &&
    string(value.lookup_status) && string(value.last_attempt_status) &&
    nullableString(value.last_attempt_at) && nullableString(value.last_success_at) &&
    nullableString(value.last_price_observed_at) && nullableString(value.price_changed_at) && typeof value.stale === 'boolean'
}

function alert(value: unknown): value is Alert {
  return record(value) && string(value.id) && string(value.target_price) && typeof value.enabled === 'boolean' && string(value.condition)
}

function tracked(value: unknown): value is TrackedProduct {
  return record(value) && string(value.id) && typeof value.active === 'boolean' && string(value.active_since) &&
    product(value.product) && (value.alert === null || alert(value.alert))
}

function trackedPage(value: unknown): value is { items: TrackedProduct[]; next_cursor: string | null } {
  return record(value) && Array.isArray(value.items) && value.items.every(tracked) && nullableString(value.next_cursor)
}

function dashboard(value: unknown): value is Dashboard {
  if (!record(value) || !record(value.summary) || !record(value.tracked_products)) return false
  const summary = value.summary
  const list = value.tracked_products
  return ['tracked_count', 'price_drop_count', 'active_alert_count', 'target_reached_count'].every((key) => typeof summary[key] === 'number') &&
    Array.isArray(value.opportunities) && value.opportunities.every(tracked) &&
    Array.isArray(list.items) && list.items.every(tracked) && nullableString(list.next_cursor) &&
    Array.isArray(value.recent_updates) && value.recent_updates.every((entry: unknown) => record(entry) && string(entry.id) && string(entry.type))
}

async function request<T>(path: string, valid: (value: unknown) => value is T, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin', ...init })
  } catch {
    throw new ApiFailure(0, 'network_error', 'Não foi possível conectar à API.')
  }
  let body: unknown
  try { body = await response.json() } catch { body = null }
  if (!response.ok) {
    const error = record(body) && record(body.error) ? body.error : null
    throw new ApiFailure(response.status, error && string(error.code) ? error.code : 'api_error',
      error && string(error.message) ? error.message : 'Não foi possível concluir a operação.')
  }
  if (!valid(body)) throw new ApiFailure(response.status, 'invalid_response', 'A API respondeu com dados inválidos.')
  return body
}

async function requestVoid(path: string, init: RequestInit): Promise<void> {
  let response: Response
  try { response = await fetch(`/api${path}`, { credentials: 'same-origin', ...init }) }
  catch { throw new ApiFailure(0, 'network_error', 'Não foi possível conectar à API.') }
  if (response.status === 204) return
  let body: unknown
  try { body = await response.json() } catch { body = null }
  const error = record(body) && record(body.error) ? body.error : null
  throw new ApiFailure(response.status, error && string(error.code) ? error.code : 'api_error',
    error && string(error.message) ? error.message : 'Não foi possível concluir a operação.')
}

function json(method: string, body: object): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const api = {
  me: () => request('/auth/me', user),
  login: (email: string, password: string) => request('/auth/login', user, json('POST', { email, password })),
  logout: () => requestVoid('/auth/logout', { method: 'POST' }),
  dashboard: () => request('/dashboard', dashboard),
  tracked: (cursor?: string) => request(`/tracked-products${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, trackedPage),
  track: (url: string) => request('/tracked-products', tracked, json('POST', { url })),
  detail: (id: string) => request(`/tracked-products/${encodeURIComponent(id)}`, tracked),
  refresh: (id: string) => request(`/tracked-products/${encodeURIComponent(id)}/refresh`, tracked, { method: 'POST' }),
  stop: (id: string) => requestVoid(`/tracked-products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  history: (id: string, cursor?: string) => request(`/tracked-products/${encodeURIComponent(id)}/history${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    (value): value is { items: HistoryEntry[]; next_cursor: string | null } => record(value) && Array.isArray(value.items) &&
      value.items.every((entry: unknown) => record(entry) && string(entry.id) && string(entry.price) && string(entry.currency) && string(entry.captured_at)) && nullableString(value.next_cursor)),
  createAlert: (id: string, target_price: string) => request(`/tracked-products/${encodeURIComponent(id)}/alert`, alert, json('POST', { target_price })),
  updateAlert: (id: string, update: { target_price?: string; enabled?: boolean }) => request(`/tracked-products/${encodeURIComponent(id)}/alert`, alert, json('PATCH', update)),
  deleteAlert: (id: string) => requestVoid(`/tracked-products/${encodeURIComponent(id)}/alert`, { method: 'DELETE' }),
  readNotification: (id: string) => request(`/notifications/${encodeURIComponent(id)}`,
    (value): value is Notification => record(value) && string(value.id) && string(value.product_title) && string(value.observed_price) &&
      string(value.target_price) && string(value.created_at) && nullableString(value.read_at), json('PATCH', { read: true })),
  notifications: (cursor?: string) => request(`/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    (value): value is { items: Notification[]; next_cursor: string | null } => record(value) && Array.isArray(value.items) &&
      value.items.every((entry: unknown) => record(entry) && string(entry.id) && string(entry.product_title) && string(entry.observed_price) && string(entry.target_price) && string(entry.created_at) && nullableString(entry.read_at)) && nullableString(value.next_cursor)),
}
