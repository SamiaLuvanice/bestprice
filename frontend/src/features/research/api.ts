import { json, request, requestVoid } from '../../api'

export type Summary = { id: string; title: string; created_at: string; updated_at: string; expires_at: string }
export type Message = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }
export type Conversation = Summary & { messages: Message[] }
export type ChatResult = { conversation_id: string; request_id: string; user_message: Message; assistant_message: Message; expires_at: string }
export type ProductInput = { name: string; details: string; price: string | null; currency: 'BRL'; url: string | null }
export type ComparisonInput = { title: string; use_case: string; products: ProductInput[] }
export type Analysis = { version: number; content: string; created_at: string }
export type Comparison = Summary & ComparisonInput & { version: number; analysis: Analysis | null }
export type ResearchItem = Summary & { kind: 'conversation' | 'comparison' }
export type ResearchPage = { items: ResearchItem[]; next_offset: number | null }
export type Capabilities = { enabled: boolean; provider: string; model: string; retention_days: number; max_message_chars: number; user_daily_limit: number }
export type ResearchKind = 'all' | 'conversation' | 'comparison'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string'
const instant = (value: unknown): value is string => text(value) && /(?:Z|\+00:00)$/.test(value) && !Number.isNaN(Date.parse(value))
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

function summary(value: unknown): value is Summary & Record<string, unknown> {
  return record(value) && text(value.id) && text(value.title) && instant(value.created_at) && instant(value.updated_at) && instant(value.expires_at)
}
function message(value: unknown): value is Message {
  return record(value) && text(value.id) && (value.role === 'user' || value.role === 'assistant') && text(value.content) && instant(value.created_at)
}
function conversation(value: unknown): value is Conversation {
  return summary(value) && record(value) && Array.isArray(value.messages) && value.messages.every(message)
}
function product(value: unknown): value is ProductInput {
  return record(value) && text(value.name) && text(value.details) && value.currency === 'BRL' &&
    (value.price === null || (text(value.price) && /^\d+\.\d{2}$/.test(value.price))) &&
    (value.url === null || (text(value.url) && /^https?:\/\//.test(value.url)))
}
function analysis(value: unknown): value is Analysis {
  return record(value) && integer(value.version) && value.version > 0 && text(value.content) && instant(value.created_at)
}
function comparison(value: unknown): value is Comparison {
  return summary(value) && record(value) && text(value.use_case) && integer(value.version) && value.version > 0 &&
    Array.isArray(value.products) && value.products.length >= 2 && value.products.length <= 3 && value.products.every(product) &&
    (value.analysis === null || (analysis(value.analysis) && value.analysis.version === value.version))
}
function chatResult(value: unknown): value is ChatResult {
  return record(value) && text(value.conversation_id) && text(value.request_id) && message(value.user_message) &&
    value.user_message.role === 'user' && message(value.assistant_message) && value.assistant_message.role === 'assistant' && instant(value.expires_at)
}
function page(value: unknown): value is ResearchPage {
  return record(value) && Array.isArray(value.items) && value.items.every((item: unknown) => summary(item) && record(item) &&
    (item.kind === 'conversation' || item.kind === 'comparison')) && (value.next_offset === null || integer(value.next_offset))
}
function capabilities(value: unknown): value is Capabilities {
  return record(value) && typeof value.enabled === 'boolean' && text(value.provider) && text(value.model) &&
    value.retention_days === 90 && value.max_message_chars === 2000 && value.user_daily_limit === 20
}

export const researchApi = {
  capabilities: () => request('/ai/capabilities', capabilities),
  chat: (conversation_id: string | null, request_id: string, input: string) => request('/ai/chat', chatResult, json('POST', { conversation_id, request_id, message: input })),
  conversation: (id: string) => request(`/ai/conversations/${encodeURIComponent(id)}`, conversation),
  deleteConversation: (id: string) => requestVoid(`/ai/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  comparison: (id: string) => request(`/comparisons/${encodeURIComponent(id)}`, comparison),
  saveComparison: (input: ComparisonInput) => request('/comparisons', comparison, json('POST', input)),
  updateComparison: (id: string, version: number, input: ComparisonInput) => request(`/comparisons/${encodeURIComponent(id)}`, comparison, json('PUT', { ...input, version })),
  analyze: (id: string, version: number, request_id: string) => request(`/comparisons/${encodeURIComponent(id)}/analyze`, comparison, json('POST', { version, request_id })),
  deleteComparison: (id: string) => requestVoid(`/comparisons/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  list: (kind: ResearchKind = 'all', q = '', offset = 0, limit = 20) => request(`/research?${new URLSearchParams({ kind, q, offset: String(offset), limit: String(limit) })}`, page),
}

export function researchHref(item: ResearchItem): string {
  return `/app/${item.kind === 'conversation' ? 'assistant' : 'compare'}/${encodeURIComponent(item.id)}`
}
