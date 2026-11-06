import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { apiError, deferred, reply } from '../test/fakeApi'
import { useSignupAvailability } from './useSignupAvailability'

afterEach(() => { vi.unstubAllGlobals() })

function stub(...responses: Array<() => Promise<unknown>>) {
  const mockFetch = vi.fn()
  for (const response of responses) mockFetch.mockImplementationOnce(response)
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

it('começa em loading e passa a enabled com {enabled: true}', async () => {
  const pending = deferred()
  const mockFetch = stub(() => pending.promise)
  const { result } = renderHook(() => useSignupAvailability())
  expect(result.current.availability).toBe('loading')
  pending.resolve(reply(200, { enabled: true }))
  await waitFor(() => expect(result.current.availability).toBe('enabled'))
  expect(mockFetch).toHaveBeenCalledOnce()
  expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({ credentials: 'same-origin' }))
})

it('fica disabled com {enabled: false}', async () => {
  stub(() => Promise.resolve(reply(200, { enabled: false })))
  const { result } = renderHook(() => useSignupAvailability())
  await waitFor(() => expect(result.current.availability).toBe('disabled'))
})

it.each([
  ['HTTP 503', () => Promise.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))],
  ['falha de rede', () => Promise.reject(new TypeError('Failed to fetch'))],
  ['resposta inválida', () => Promise.resolve(reply(200, { enabled: 'yes' }))],
])('fica em error com %s e volta a consultar ao tentar de novo', async (_case, failure) => {
  const mockFetch = stub(failure, () => Promise.resolve(reply(200, { enabled: true })))
  const { result } = renderHook(() => useSignupAvailability())
  await waitFor(() => expect(result.current.availability).toBe('error'))
  act(() => result.current.retry())
  expect(result.current.availability).toBe('loading')
  await waitFor(() => expect(result.current.availability).toBe('enabled'))
  expect(mockFetch).toHaveBeenCalledTimes(2)
})

it('ignora a resposta que chega depois de desmontar', async () => {
  const pending = deferred()
  stub(() => pending.promise)
  const { result, unmount } = renderHook(() => useSignupAvailability())
  unmount()
  pending.resolve(reply(200, { enabled: true }))
  await Promise.resolve()
  expect(result.current.availability).toBe('loading')
})
