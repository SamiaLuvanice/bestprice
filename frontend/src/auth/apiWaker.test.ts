import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiWaker, WAKE_TIMEOUT_MS } from './apiWaker'

const ORIGIN = 'https://bestprice-stage-api.onrender.com'

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }) })
afterEach(() => { vi.useRealTimers() })

function deferredResponse() {
  let resolve!: () => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Response>((res, rej) => {
    resolve = () => res(new Response(null))
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createApiWaker (spec 0062)', () => {
  it('AC01/AC03: faz um GET cego ao health da origem, sem credenciais, corpo ou dados', () => {
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {}))
    createApiWaker(ORIGIN, fetchImpl)()
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${ORIGIN}/api/health`)
    expect(init).toMatchObject({
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
    expect(init.body).toBeUndefined()
    expect(init.headers).toBeUndefined()
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it.each([
    ['ausente', undefined],
    ['vazia', ''],
    ['http', 'http://bestprice-stage-api.onrender.com'],
    ['com caminho', `${ORIGIN}/api`],
    ['com usuário', 'https://user:pass@bestprice-stage-api.onrender.com'],
    ['com query', `${ORIGIN}/?x=1`],
    ['com fragmento', `${ORIGIN}/#x`],
    ['inválida', 'não é url'],
  ])('AC05: origem %s não faz pedido', (_case, origin) => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response(null)))
    createApiWaker(origin, fetchImpl)()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('AC04: falha do pedido é silenciosa e libera um novo pedido', async () => {
    const failing = deferredResponse()
    const fetchImpl = vi.fn()
      .mockReturnValueOnce(failing.promise)
      .mockReturnValue(new Promise<Response>(() => {}))
    const wake = createApiWaker(ORIGIN, fetchImpl)
    wake()
    failing.reject(new TypeError('Failed to fetch'))
    await vi.advanceTimersByTimeAsync(0)
    wake()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('AC04: exceção síncrona do fetch não vaza', () => {
    const fetchImpl = vi.fn(() => { throw new TypeError('bloqueado') })
    expect(() => createApiWaker(ORIGIN, fetchImpl)()).not.toThrow()
  })

  it('AC02: com um pedido em voo, novas chamadas não fazem outro; depois que ele termina, fazem', async () => {
    const first = deferredResponse()
    const fetchImpl = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValue(new Promise<Response>(() => {}))
    const wake = createApiWaker(ORIGIN, fetchImpl)
    wake()
    wake()
    expect(fetchImpl).toHaveBeenCalledOnce()
    first.resolve()
    await vi.advanceTimersByTimeAsync(0)
    wake()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('aborta o pedido sem resposta depois de 60 s', async () => {
    let signal: AbortSignal | undefined
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    })
    const wake = createApiWaker(ORIGIN, fetchImpl)
    wake()
    await vi.advanceTimersByTimeAsync(WAKE_TIMEOUT_MS - 1)
    expect(signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(signal?.aborted).toBe(true)
    wake()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})
