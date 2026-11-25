import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiFailure } from '../api'
import { deferred } from '../test/fakeApi'
import { isUnavailable, MAX_RETRIES, useWakeRetry, WINDOW_MS } from './wakeRetry'

// 0061/AC15: a demora de 5 s, a janela de 60 s e os atrasos são controlados por timers falsos.
beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }) })
afterEach(() => { vi.useRealTimers() })

/** Avança o relógio falso e deixa as promessas pendentes do React assentarem. */
async function advance(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

const unavailable = () => new ApiFailure(0, 'network_error', 'Não foi possível conectar ao BestPrice. Tente novamente.')

describe('isUnavailable (tabela de classificação do plan 0061)', () => {
  it.each([
    ['falha de rede', new ApiFailure(0, 'network_error', 'x'), true],
    ['429 do Render sem envelope', new ApiFailure(429, 'api_error', 'x'), true],
    ['corpo fora do contrato', new ApiFailure(200, 'invalid_response', 'x'), true],
    ['502 sem envelope', new ApiFailure(502, 'api_error', 'x'), true],
    ['503 com envelope da API', new ApiFailure(503, 'database_unavailable', 'x'), true],
    ['erro fora do cliente da API', new TypeError('boom'), true],
    ['401 com envelope', new ApiFailure(401, 'unauthenticated', 'x'), false],
    ['403 com envelope', new ApiFailure(403, 'forbidden', 'x'), false],
    ['429 de limite da própria API', new ApiFailure(429, 'login_rate_limited', 'x'), false],
  ])('%s → %s', (_case, failure, expected) => {
    expect(isUnavailable(failure)).toBe(expected)
  })
})

describe('useWakeRetry', () => {
  it('decide com o valor quando a consulta responde', async () => {
    const fetcher = vi.fn(() => Promise.resolve('ok'))
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    expect(result.current.phase).toBe('loading')
    await advance()
    expect(result.current.phase).toBe('settled')
    expect(result.current.value).toBe('ok')
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('erro definitivo (4xx com envelope) decide sem novas tentativas', async () => {
    const failure = new ApiFailure(403, 'forbidden', 'Proibido.')
    const fetcher = vi.fn(() => Promise.reject(failure))
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance()
    expect(result.current.phase).toBe('settled')
    expect(result.current.error).toBe(failure)
    await advance(WINDOW_MS)
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('passa a waking após 5 s sem resposta e não abre outra requisição em paralelo', async () => {
    const pending = deferred<string>()
    const fetcher = vi.fn(() => pending.promise)
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance(4_999)
    expect(result.current.phase).toBe('loading')
    await advance(1)
    expect(result.current.phase).toBe('waking')
    await advance(20_000)
    expect(fetcher).toHaveBeenCalledOnce()
    await act(async () => { pending.resolve('acordou') })
    expect(result.current.phase).toBe('settled')
    expect(result.current.value).toBe('acordou')
  })

  it('repete com atrasos crescentes de pelo menos 2 s, no máximo 6 vezes, e esgota a janela', async () => {
    const fetcher = vi.fn(() => Promise.reject(unavailable()))
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance()
    expect(result.current.phase).toBe('waking')
    expect(fetcher).toHaveBeenCalledTimes(1)
    await advance(1_999)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
    // Atrasos seguintes: 4 s, 8 s, 12 s, 15 s e 15 s (soma 56 s desde a primeira falha).
    for (const [delay, calls] of [[4_000, 3], [8_000, 4], [12_000, 5], [15_000, 6], [15_000, 7]] as const) {
      await advance(delay - 1)
      expect(fetcher).toHaveBeenCalledTimes(calls - 1)
      await advance(1)
      expect(fetcher).toHaveBeenCalledTimes(calls)
    }
    expect(fetcher).toHaveBeenCalledTimes(1 + MAX_RETRIES)
    expect(result.current.phase).toBe('exhausted')
    expect(result.current.error).toBeInstanceOf(ApiFailure)
    await advance(WINDOW_MS)
    expect(fetcher).toHaveBeenCalledTimes(1 + MAX_RETRIES)
  })

  it('encerra a janela aos 60 s mesmo com uma tentativa sem resposta', async () => {
    let call = 0
    const hanging = deferred<string>()
    const fetcher = vi.fn(() => ++call === 1 ? Promise.reject(unavailable()) : hanging.promise)
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance(2_000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.phase).toBe('waking')
    await advance(WINDOW_MS - 2_001)
    expect(result.current.phase).toBe('waking')
    await advance(1)
    expect(result.current.phase).toBe('exhausted')
    expect(fetcher).toHaveBeenCalledTimes(2)
    // A requisição em voo ainda pode decidir: a API acordou depois da janela.
    await act(async () => { hanging.resolve('tarde') })
    expect(result.current.phase).toBe('settled')
  })

  it('retry() abre uma nova janela depois de esgotada', async () => {
    let awake = false
    const fetcher = vi.fn(() => awake ? Promise.resolve('ok') : Promise.reject(unavailable()))
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance(WINDOW_MS)
    expect(result.current.phase).toBe('exhausted')
    awake = true
    act(() => result.current.retry())
    expect(result.current.phase).toBe('loading')
    await advance()
    expect(result.current.phase).toBe('settled')
    expect(result.current.value).toBe('ok')
  })

  it('settle() decide por fora e ignora a resposta atrasada', async () => {
    const pending = deferred<string>()
    const fetcher = vi.fn(() => pending.promise)
    const { result } = renderHook(() => useWakeRetry(fetcher, { active: true }))
    await advance(6_000)
    expect(result.current.phase).toBe('waking')
    act(() => result.current.settle('login'))
    expect(result.current.phase).toBe('settled')
    expect(result.current.value).toBe('login')
    await act(async () => { pending.resolve('atrasada') })
    expect(result.current.value).toBe('login')
    await advance(WINDOW_MS)
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('inativo não agenda novas tentativas; ao reativar começa uma nova janela', async () => {
    const fetcher = vi.fn(() => Promise.reject(unavailable()))
    const { result, rerender } = renderHook(({ active }) => useWakeRetry(fetcher, { active }),
      { initialProps: { active: true } })
    await advance()
    expect(fetcher).toHaveBeenCalledTimes(1)
    rerender({ active: false })
    await advance(WINDOW_MS * 2)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.phase).not.toBe('settled')
    rerender({ active: true })
    await advance()
    expect(fetcher).toHaveBeenCalledTimes(2)
    // A nova janela tem a própria contagem: a próxima tentativa volta ao atraso de 2 s.
    await advance(2_000)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('começando inativo (landing) consulta uma vez e não abre janela', async () => {
    const fetcher = vi.fn(() => Promise.reject(unavailable()))
    renderHook(() => useWakeRetry(fetcher, { active: false }))
    await advance(WINDOW_MS)
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
