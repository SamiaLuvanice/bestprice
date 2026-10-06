import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('mostra carregamento até a verificação responder', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  render(<App />)

  expect(screen.getByRole('status')).toHaveTextContent('Verificando conexão')
  expect(screen.queryByText('Tudo conectado')).not.toBeInTheDocument()
})

it('mostra sucesso somente para 200 com os dois campos ok', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ status: 'ok', database: 'ok' }),
  }))

  render(<App />)

  expect(await screen.findByText('Tudo conectado')).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledWith('/api/health', expect.any(Object))
})

it.each([
  ['503 do banco', { ok: false, status: 503, json: async () => ({ status: 'unavailable', database: 'unavailable' }) }],
  ['200 com resposta inválida', { ok: true, status: 200, json: async () => ({ status: 'ok', database: 'unavailable' }) }],
])('mostra indisponibilidade para %s', async (_caseName, response) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível')
  expect(screen.queryByText('Tudo conectado')).not.toBeInTheDocument()
})

it('mostra falha compreensível se a API não responde', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API')
  expect(screen.queryByText('Tudo conectado')).not.toBeInTheDocument()
})

it('trata JSON malformado como resposta indisponível', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('Unexpected token') },
  }))

  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível')
})

it('sai do carregamento quando a API não responde dentro do prazo', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  })))

  render(<App />)
  expect(screen.getByRole('status')).toHaveTextContent('Verificando conexão')

  await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })

  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar à API')
})
