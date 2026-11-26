import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { wakeApiOrigin } from './auth/apiWaker'
import { apiError, fakeApi, reply } from './test/fakeApi'

// Spec 0062: a App liga o despertador às janelas da 0061; o pedido em si é testado em apiWaker.test.ts.
vi.mock('./auth/apiWaker', () => ({ wakeApiOrigin: vi.fn() }))

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }) })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.mocked(wakeApiOrigin).mockClear() })

function visitLogin() {
  window.history.replaceState({}, '', '/login')
  render(<App />)
}

it('AC01: com a API hibernando (429 do Render), /login aciona o despertador ao abrir a janela', async () => {
  fakeApi(() => reply(429, 'Too Many Requests'))
  visitLogin()
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
  expect(screen.getByRole('status')).toHaveTextContent('Ele pode estar iniciando')
  expect(wakeApiOrigin).toHaveBeenCalled()
  const callsAtOpen = vi.mocked(wakeApiOrigin).mock.calls.length
  // AC02: as novas tentativas da janela não acionam de novo.
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
  expect(wakeApiOrigin).toHaveBeenCalledTimes(callsAtOpen)
})

it('AC06: com a API respondendo, /login não aciona o despertador', async () => {
  fakeApi((url) => url === '/api/auth/me'
    ? reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    : reply(200, { enabled: false }))
  visitLogin()
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
  expect(screen.getByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(wakeApiOrigin).not.toHaveBeenCalled()
})
