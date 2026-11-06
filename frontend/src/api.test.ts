import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiFailure } from './api'
import { apiError, notificationFixture, reply, trackedFixture } from './test/fakeApi'

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

describe('campos do erro (0048)', () => {
  it('expõe os campos válidos do envelope de erro', async () => {
    stubFetch(reply(422, apiError('validation_error', 'Confira os dados informados.', {
      fields: [{ field: 'email', code: 'email_invalid', message: 'Informe um e-mail válido, como nome@exemplo.com.' }],
    })))
    const failure = await failureOf(api.signup('a@b', 'uma-senha-longa'))
    expect(failure.fields).toEqual([{ field: 'email', code: 'email_invalid', message: 'Informe um e-mail válido, como nome@exemplo.com.' }])
  })

  it.each([
    ['ausente', { error: { code: 'validation_error', message: 'Confira os dados informados.' } }],
    ['fora de lista', { error: { code: 'validation_error', message: 'Confira os dados informados.', fields: 'email' } }],
    ['com item malformado', { error: { code: 'validation_error', message: 'Confira os dados informados.', fields: [{ field: 'email', code: 1, message: 'x' }] } }],
  ])('usa lista vazia quando fields está %s', async (_case, body) => {
    stubFetch(reply(422, body))
    const failure = await failureOf(api.signup('a@b', 'uma-senha-longa'))
    expect(failure.code).toBe('validation_error')
    expect(failure.fields).toEqual([])
  })
})

describe('disponibilidade do cadastro (0048)', () => {
  it.each([true, false])('aceita {enabled: %s} da rota pública', async (enabled) => {
    const mockFetch = stubFetch(reply(200, { enabled }))
    expect(await api.signupStatus()).toEqual({ enabled })
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({ credentials: 'same-origin' }))
  })

  it.each([[{}], [{ enabled: 'true' }], [null], [{ enabled: 1 }]])('rejeita corpo fora do contrato %j', async (body) => {
    stubFetch(reply(200, body))
    expect((await failureOf(api.signupStatus())).code).toBe('invalid_response')
  })
})

describe('cadastro (0048)', () => {
  it('envia e-mail e senha em JSON e aceita 201 com o usuário', async () => {
    const mockFetch = stubFetch(reply(201, { id: 'user-9', email: 'ana@exemplo.com' }))
    expect(await api.signup(' Ana@Exemplo.com ', 'uma-senha-longa')).toEqual({ id: 'user-9', email: 'ana@exemplo.com' })
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ' Ana@Exemplo.com ', password: 'uma-senha-longa' }),
    }))
  })

  it.each([
    ['200 em vez de 201', reply(200, { id: 'user-9', email: 'ana@exemplo.com' })],
    ['corpo sem e-mail', reply(201, { id: 'user-9' })],
    ['corpo vazio', reply(201, null)],
  ])('não considera sucesso: %s', async (_case, response) => {
    stubFetch(response)
    const failure = await failureOf(api.signup('ana@exemplo.com', 'uma-senha-longa'))
    expect(failure.code).toBe('invalid_response')
  })

  it('preserva código, campos e mensagem do 409', async () => {
    stubFetch(reply(409, apiError('email_already_registered', 'Já existe uma conta com este e-mail.', {
      fields: [{ field: 'email', code: 'email_already_registered', message: 'Já existe uma conta com este e-mail.' }],
    })))
    const failure = await failureOf(api.signup('ana@exemplo.com', 'uma-senha-longa'))
    expect(failure.status).toBe(409)
    expect(failure.code).toBe('email_already_registered')
    expect(failure.fields.map((item) => item.field)).toEqual(['email'])
  })

  it('preserva o tempo de espera do 429 e o código do 404', async () => {
    stubFetch(reply(429, apiError('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.', { retry_after_seconds: 1800 })))
    const limited = await failureOf(api.signup('ana@exemplo.com', 'uma-senha-longa'))
    expect(limited.status).toBe(429)
    expect(limited.retryAfterSeconds).toBe(1800)
    stubFetch(reply(404, apiError('signup_unavailable', 'Cadastro indisponível.')))
    const unavailable = await failureOf(api.signup('ana@exemplo.com', 'uma-senha-longa'))
    expect(unavailable.status).toBe(404)
    expect(unavailable.code).toBe('signup_unavailable')
  })

  it('traduz falha de rede no cadastro', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const failure = await failureOf(api.signup('ana@exemplo.com', 'uma-senha-longa'))
    expect(failure.code).toBe('network_error')
    expect(failure.fields).toEqual([])
  })
})
