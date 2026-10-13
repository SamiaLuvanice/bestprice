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
