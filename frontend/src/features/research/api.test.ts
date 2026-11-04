import { afterEach, expect, it, vi } from 'vitest'
import { fakeApi, reply } from '../../test/fakeApi'
import { researchApi } from './api'

afterEach(() => vi.unstubAllGlobals())

it('recusa capabilities inválida em vez de habilitar geração', async () => {
  fakeApi(() => reply(200, { enabled: 'true', provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }))
  await expect(researchApi.capabilities()).rejects.toMatchObject({ code: 'invalid_response' })
})

it('recusa mensagem com papel fora do contrato', async () => {
  fakeApi(() => reply(200, { id: 'conversation-1', title: 'Pesquisa', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z', expires_at: '2027-01-24T00:00:00Z', messages: [{ id: 'm1', role: 'system', content: 'Texto', created_at: '2026-10-26T00:00:00Z' }] }))
  await expect(researchApi.conversation('conversation-1')).rejects.toMatchObject({ code: 'invalid_response' })
})

it('recusa análise de outra versão da comparação', async () => {
  fakeApi(() => reply(200, { id: 'comparison-1', title: 'Pesquisa', use_case: '', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z', expires_at: '2027-01-24T00:00:00Z', version: 2,
    products: [{ name: 'A', details: '', price: null, currency: 'BRL', url: null }, { name: 'B', details: '', price: null, currency: 'BRL', url: null }],
    analysis: { version: 1, content: 'Resultado antigo', created_at: '2026-10-26T00:00:00Z' } }))
  await expect(researchApi.comparison('comparison-1')).rejects.toMatchObject({ code: 'invalid_response' })
})

const at = '2026-11-04T12:00:00Z'
const searched = { status: 'searched', searched_at: at, sources: [{ title: 'Loja X', url: 'https://loja.example/produto' }], search_suggestions_html: '<div>Sugestões</div>' }
const unavailable = { status: 'unavailable', searched_at: at, sources: [], search_suggestions_html: null }
function conversationWith(assistant: Record<string, unknown>) {
  return { id: 'c1', title: 'Pesquisa', created_at: at, updated_at: at, expires_at: '2027-02-02T12:00:00Z',
    messages: [{ id: 'u1', role: 'user', content: 'Quanto custa?', created_at: at, grounding: null }, { id: 'a1', role: 'assistant', content: 'Cerca de R$ 100,00.', created_at: at, ...assistant }] }
}

it('aceita grounding pesquisado, indisponível e nulo no contrato da mensagem', async () => {
  fakeApi(() => reply(200, conversationWith({ grounding: searched })))
  expect((await researchApi.conversation('c1')).messages[1].grounding).toEqual(searched)
  fakeApi(() => reply(200, conversationWith({ grounding: unavailable })))
  expect((await researchApi.conversation('c1')).messages[1].grounding).toEqual(unavailable)
  fakeApi(() => reply(200, conversationWith({ grounding: null })))
  expect((await researchApi.conversation('c1')).messages[1].grounding).toBeNull()
})

it('trata ausência de grounding em respostas antigas como nulo', async () => {
  const old = conversationWith({})
  for (const item of old.messages) delete (item as Record<string, unknown>).grounding
  fakeApi(() => reply(200, old))
  const result = await researchApi.conversation('c1')
  expect(result.messages.map((item) => item.grounding)).toEqual([null, null])
})

it.each([
  ['fonte sem https', { ...searched, sources: [{ title: 'Loja', url: 'http://loja.example' }] }],
  ['fonte javascript', { ...searched, sources: [{ title: 'Loja', url: 'javascript:alert(1)' }] }],
  ['pesquisado sem fontes', { ...searched, sources: [] }],
  ['pesquisado sem sugestões', { ...searched, search_suggestions_html: null }],
  ['instante inválido', { ...searched, searched_at: '2026-11-04 12:00' }],
  ['indisponível com fontes', { ...unavailable, sources: searched.sources }],
  ['indisponível com sugestões', { ...unavailable, search_suggestions_html: '<div></div>' }],
  ['status desconhecido', { ...searched, status: 'cached' }],
])('recusa grounding fora do contrato: %s', async (_name, grounding) => {
  fakeApi(() => reply(200, conversationWith({ grounding })))
  await expect(researchApi.conversation('c1')).rejects.toMatchObject({ code: 'invalid_response' })
})

it('lê web_search das capabilities e assume falso quando ausente', async () => {
  const base = { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
  fakeApi(() => reply(200, { ...base, web_search: true }))
  expect((await researchApi.capabilities()).web_search).toBe(true)
  fakeApi(() => reply(200, base))
  expect((await researchApi.capabilities()).web_search).toBe(false)
  fakeApi(() => reply(200, { ...base, web_search: 'sim' }))
  await expect(researchApi.capabilities()).rejects.toMatchObject({ code: 'invalid_response' })
})
