import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiFailure } from './api'
import { notificationFixture, reply, trackedFixture } from './test/fakeApi'

afterEach(() => { vi.unstubAllGlobals() })

function stubFetch(response: unknown) {
  const mockFetch = vi.fn(() => Promise.resolve(response))
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

async function failureOf(promise: Promise<unknown>): Promise<ApiFailure> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiFailure) return error
    throw error
  }
  throw new Error('A chamada deveria ter falhado.')
}

describe('track', () => {
  it('informa novo monitoramento quando a API responde 201', async () => {
    stubFetch(reply(201, trackedFixture()))
    const result = await api.track('https://produto.mercadolivre.com.br/MLB-1-x-_JM')
    expect(result.outcome).toBe('created')
    expect(result.tracked.id).toBe('tracking-1')
  })

  it('informa retomada quando a API responde 200', async () => {
    stubFetch(reply(200, trackedFixture()))
    expect((await api.track('https://produto.mercadolivre.com.br/MLB-1-x-_JM')).outcome).toBe('resumed')
  })

  it('não considera sucesso outro status 2xx', async () => {
    stubFetch(reply(202, trackedFixture()))
    const failure = await failureOf(api.track('https://produto.mercadolivre.com.br/MLB-1-x-_JM'))
    expect(failure.code).toBe('invalid_response')
    expect(failure.message).toBe('A API respondeu com dados inválidos.')
  })
})

describe('mensagens locais de erro', () => {
  it('traduz falha de rede para a mensagem da spec', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const failure = await failureOf(api.dashboard())
    expect(failure.status).toBe(0)
    expect(failure.code).toBe('network_error')
    expect(failure.message).toBe('Não foi possível conectar ao BestPrice. Tente novamente.')
  })

  it('usa mensagem genérica quando o erro não tem corpo estável', async () => {
    stubFetch(reply(500, { detail: 'Internal Server Error' }))
    const failure = await failureOf(api.dashboard())
    expect(failure.status).toBe(500)
    expect(failure.code).toBe('api_error')
    expect(failure.message).toBe('Não foi possível concluir a operação. Tente novamente.')
  })

  it('preserva a mensagem e o código do corpo de erro da API', async () => {
    stubFetch(reply(409, { error: { code: 'already_tracked', message: 'Você já monitora este anúncio.', fields: [], tracked_product_id: 'tracking-9', retry_after_seconds: null } }))
    const failure = await failureOf(api.track('x'))
    expect(failure.code).toBe('already_tracked')
    expect(failure.message).toBe('Você já monitora este anúncio.')
    expect(failure.trackedProductId).toBe('tracking-9')
  })
})

describe('validação decimal na fronteira', () => {
  it.each([
    ['current_price', '1.079,00'],
    ['previous_price', 'abc'],
    ['min_price', '1e3'],
    ['percentage_change', ' 5.00'],
  ])('rejeita %s fora do formato decimal (%s)', async (field, value) => {
    stubFetch(reply(200, trackedFixture({ [field]: value })))
    expect((await failureOf(api.detail('tracking-1'))).code).toBe('invalid_response')
  })

  it('aceita preços nulos e decimais negativos', async () => {
    stubFetch(reply(200, trackedFixture({ current_price: null, absolute_change: '-20.00', percentage_change: '-20.00' })))
    expect((await api.detail('tracking-1')).product.current_price).toBeNull()
  })

  it('rejeita alvo de alerta fora do formato decimal', async () => {
    stubFetch(reply(200, { ...trackedFixture(), alert: { id: 'alert-1', target_price: 'R$ 99,90', enabled: true, condition: 'at_or_below' } }))
    expect((await failureOf(api.detail('tracking-1'))).code).toBe('invalid_response')
  })

  it('rejeita notificação sem produto vinculado ou com preço fora do formato', async () => {
    const { tracked_product_id: _omitted, ...withoutProduct } = notificationFixture('n-1')
    void _omitted
    stubFetch(reply(200, { items: [withoutProduct], next_cursor: null }))
    expect((await failureOf(api.notifications())).code).toBe('invalid_response')
    stubFetch(reply(200, { items: [notificationFixture('n-1', { observed_price: 'oitenta' })], next_cursor: null }))
    expect((await failureOf(api.notifications())).code).toBe('invalid_response')
  })
})

describe('notificações não lidas', () => {
  it('consulta somente as não lidas com o limite máximo do contrato', async () => {
    const mockFetch = stubFetch(reply(200, { items: [notificationFixture('n-1')], next_cursor: null }))
    const page = await api.unreadNotifications()
    expect(page.items).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/notifications?unread_only=true&limit=100', expect.objectContaining({ credentials: 'same-origin' }))
  })
})
