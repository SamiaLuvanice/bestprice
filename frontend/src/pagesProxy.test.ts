import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest } from '../functions/api/[[path]]'

afterEach(() => vi.unstubAllGlobals())

describe('proxy de stage', () => {
  it('encaminha caminho, consulta, método e cookie e devolve o cookie da API', async () => {
    const upstream = vi.fn(async (request: Request) => {
      expect(request.url).toBe('https://bestprice-stage.onrender.com/api/auth/login?next=1')
      expect(request.method).toBe('POST')
      expect(request.headers.get('cookie')).toBe('bestprice_session=abc')
      expect(await request.text()).toBe('{"email":"a@example.com"}')
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'set-cookie': 'bestprice_session=def; HttpOnly; Secure; Path=/api', 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', upstream)

    const response = await onRequest({
      request: new Request('https://stage.example.com/api/auth/login?next=1', {
        method: 'POST', headers: { cookie: 'bestprice_session=abc' }, body: '{"email":"a@example.com"}',
      }),
      env: { API_ORIGIN: 'https://bestprice-stage.onrender.com' },
    })

    expect(upstream).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; Path=/api')
    expect(await response.json()).toEqual({ ok: true })
  })

  it('falha de forma segura sem origem válida ou quando a API está inacessível', async () => {
    const upstream = vi.fn().mockRejectedValue(new Error('internal address and secret'))
    vi.stubGlobal('fetch', upstream)
    const request = new Request('https://stage.example.com/api/health')

    const invalid = await onRequest({ request, env: { API_ORIGIN: 'http://localhost:8000' } })
    expect(invalid.status).toBe(502)
    expect(upstream).not.toHaveBeenCalled()

    const unavailable = await onRequest({ request, env: { API_ORIGIN: 'https://bestprice-stage.onrender.com' } })
    expect(unavailable.status).toBe(502)
    expect(await unavailable.text()).not.toContain('internal address')
  })
})

// 0048/F7: origem do cadastro assinada pelo proxy; o cliente não consegue forjá-la.
describe('cabeçalhos de origem confiável', () => {
  const secret = 's'.repeat(40)
  const apiOrigin = 'https://bestprice-stage.onrender.com'

  function forgedRequest() {
    return new Request('https://stage.example.com/api/auth/signup', {
      method: 'POST',
      headers: {
        'cf-connecting-ip': '203.0.113.7',
        'x-bestprice-client-ip': '198.51.100.1',
        'x-bestprice-proxy-secret': 'forjado',
        'x-bestprice-outro': 'qualquer',
        'content-type': 'application/json',
      },
      body: '{}',
    })
  }

  function captureUpstream(response = new Response(null, { status: 201 })) {
    const seen: Headers[] = []
    vi.stubGlobal('fetch', vi.fn(async (request: Request) => { seen.push(request.headers); return response }))
    return seen
  }

  it('sem API_PROXY_SECRET remove os cabeçalhos x-bestprice-* do cliente e não injeta nada', async () => {
    const seen = captureUpstream()
    await onRequest({ request: forgedRequest(), env: { API_ORIGIN: apiOrigin } })
    const headers = seen[0]
    expect([...headers.keys()].filter((name) => name.startsWith('x-bestprice-'))).toEqual([])
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('com API_PROXY_SECRET injeta o segredo e o IP do cf-connecting-ip, ignorando os valores forjados', async () => {
    const seen = captureUpstream()
    await onRequest({ request: forgedRequest(), env: { API_ORIGIN: apiOrigin, API_PROXY_SECRET: secret } })
    const headers = seen[0]
    expect(headers.get('x-bestprice-proxy-secret')).toBe(secret)
    expect(headers.get('x-bestprice-client-ip')).toBe('203.0.113.7')
    expect(headers.get('x-bestprice-outro')).toBeNull()
  })

  it('com API_PROXY_SECRET e sem cf-connecting-ip não inventa o IP do visitante', async () => {
    const seen = captureUpstream()
    await onRequest({
      request: new Request('https://stage.example.com/api/auth/signup', { method: 'POST', headers: { 'x-bestprice-client-ip': '198.51.100.1' }, body: '{}' }),
      env: { API_ORIGIN: apiOrigin, API_PROXY_SECRET: secret },
    })
    expect(seen[0].get('x-bestprice-client-ip')).toBeNull()
  })

  it('preserva vários Set-Cookie e o status ao recriar a resposta', async () => {
    const headers = new Headers()
    headers.append('set-cookie', 'a=1; Path=/api')
    headers.append('set-cookie', 'b=2; Path=/api')
    captureUpstream(new Response(null, { status: 204, headers }))
    const response = await onRequest({ request: forgedRequest(), env: { API_ORIGIN: apiOrigin, API_PROXY_SECRET: secret } })
    expect(response.status).toBe(204)
    expect(response.headers.getSetCookie()).toEqual(['a=1; Path=/api', 'b=2; Path=/api'])
  })

  it('não devolve o segredo nem cabeçalhos x-bestprice-* na resposta', async () => {
    captureUpstream(new Response('{"id":"u"}', {
      status: 201,
      headers: { 'x-bestprice-proxy-secret': secret, 'set-cookie': 'bestprice_session=def; HttpOnly; Secure; Path=/api', 'content-type': 'application/json' },
    }))
    const response = await onRequest({ request: forgedRequest(), env: { API_ORIGIN: apiOrigin, API_PROXY_SECRET: secret } })
    expect(response.status).toBe(201)
    expect(response.headers.get('x-bestprice-proxy-secret')).toBeNull()
    expect(response.headers.get('set-cookie')).toContain('bestprice_session=def')
    const body = await response.text()
    expect(body).toBe('{"id":"u"}')
    expect(body).not.toContain(secret)
  })
})
