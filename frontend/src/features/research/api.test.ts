import { afterEach, expect, it, vi } from 'vitest'
import { fakeApi, reply } from '../../test/fakeApi'
import { researchApi } from './api'

afterEach(() => vi.unstubAllGlobals())

it('recusa capabilities inválida em vez de habilitar geração', async () => {
  fakeApi(() => reply(200, { enabled: 'true', provider: 'google', model: 'gemini-3.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }))
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
