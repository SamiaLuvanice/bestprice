import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { apiError, dashboardFixture, deferred, fakeApi, reply } from '../test/fakeApi'
import { useDashboard } from './useDashboard'

afterEach(() => { vi.unstubAllGlobals() })

const arrival = new Date('2026-10-11T18:00:00Z')

function setup() {
  const onLoaded = vi.fn()
  const onUnauthenticated = vi.fn()
  const hook = renderHook(() => useDashboard({ clock: () => arrival, onLoaded, onUnauthenticated }))
  return { ...hook, onLoaded, onUnauthenticated }
}

it('começa carregando e guarda o painel com o instante de chegada', async () => {
  const response = deferred()
  fakeApi((url) => url === '/api/dashboard' ? response.promise : undefined)
  const { result, onLoaded } = setup()
  expect(result.current.view.status).toBe('loading')
  await act(async () => { response.resolve(reply(200, dashboardFixture({ summary: { tracked_count: 3 } }))) })
  const view = result.current.view
  if (view.status !== 'ready') throw new Error(`estado inesperado: ${view.status}`)
  expect(view.data.summary.tracked_count).toBe(3)
  expect(view.receivedAt).toBe(arrival)
  expect(onLoaded).toHaveBeenCalledWith(view.data, arrival)
})

it('mantém a resposta da carga mais recente quando a anterior chega depois', async () => {
  const older = deferred()
  const newer = deferred()
  const pending = [older, newer]
  fakeApi((url) => url === '/api/dashboard' ? pending.shift()?.promise : undefined)
  const { result, onLoaded } = setup()
  act(() => { void result.current.reload() })
  await act(async () => { newer.resolve(reply(200, dashboardFixture({ summary: { tracked_count: 2 } }))) })
  await act(async () => { older.resolve(reply(200, dashboardFixture({ summary: { tracked_count: 1 } }))) })
  const view = result.current.view
  if (view.status !== 'ready') throw new Error(`estado inesperado: ${view.status}`)
  expect(view.data.summary.tracked_count).toBe(2)
  expect(onLoaded).toHaveBeenCalledTimes(1)
})

it('descarta erro de carga antiga que chega depois da resposta mais recente', async () => {
  const older = deferred()
  const newer = deferred()
  const pending = [older, newer]
  fakeApi((url) => url === '/api/dashboard' ? pending.shift()?.promise : undefined)
  const { result } = setup()
  act(() => { void result.current.reload() })
  await act(async () => { newer.resolve(reply(200, dashboardFixture())) })
  await act(async () => { older.resolve(reply(500, apiError('internal_error', 'Falhou.'))) })
  expect(result.current.view.status).toBe('ready')
})

it('mostra a mensagem da API quando a primeira carga falha', async () => {
  fakeApi((url) => url === '/api/dashboard' ? reply(500, apiError('internal_error', 'Não foi possível carregar o painel.')) : undefined)
  const { result } = setup()
  await waitFor(() => expect(result.current.view).toEqual({ status: 'error', message: 'Não foi possível carregar o painel.' }))
})

it('encerra a sessão somente em 401', async () => {
  fakeApi((url) => url === '/api/dashboard' ? reply(401, apiError('unauthenticated', 'Sua sessão expirou.')) : undefined)
  const { onUnauthenticated } = setup()
  await waitFor(() => expect(onUnauthenticated).toHaveBeenCalledTimes(1))
})

it('mantém os dados e expõe a mensagem quando uma recarga falha depois da primeira carga', async () => {
  let fail = false
  fakeApi((url) => {
    if (url !== '/api/dashboard') return undefined
    return fail ? reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')) : reply(200, dashboardFixture({ summary: { tracked_count: 2 } }))
  })
  const { result } = setup()
  await waitFor(() => expect(result.current.view.status).toBe('ready'))
  fail = true
  await act(async () => { await result.current.reload() })
  const view = result.current.view
  if (view.status !== 'ready') throw new Error(`estado inesperado: ${view.status}`)
  expect(view.data.summary.tracked_count).toBe(2)
  expect(view.refreshError).toBe('Serviço temporariamente indisponível.')
  fail = false
  await act(async () => { await result.current.reload() })
  const recovered = result.current.view
  if (recovered.status !== 'ready') throw new Error(`estado inesperado: ${recovered.status}`)
  expect(recovered.refreshError).toBeNull()
})
