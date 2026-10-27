import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, deferred, fakeApi, reply } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
  vi.unstubAllGlobals()
})

function visit(path: string) {
  fakeApi((url) => url === '/api/auth/me' ? reply(401, apiError('unauthenticated', 'Entre para continuar.')) : undefined)
  window.history.replaceState({}, '', path)
  render(<App />)
}

it('mostra a landing pública e permite entrar no login existente', async () => {
  document.title = 'BestPrice'
  visit('/')
  expect(await screen.findByRole('heading', { name: /Compre com.*mais clareza/i, level: 1 })).toBeInTheDocument()
  expect(document.title).toContain('Compre com mais clareza')
  expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'O que muda entre as opções?' })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  await userEvent.setup().click(within(screen.getByRole('banner')).getByRole('link', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
  expect(document.title).toBe('Entrar · BestPrice')
})

it('preserva a landing pública mesmo quando a sessão é válida', async () => {
  document.title = 'BestPrice'
  fakeApi((url) => url === '/api/auth/me' ? reply(200, { id: 'user-1', email: 'pessoa@example.com' }) : undefined)
  window.history.replaceState({}, '', '/')
  render(<App />)
  expect(await screen.findByRole('heading', { name: /Compre com.*mais clareza/i, level: 1 })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Seu painel de preços/i })).not.toBeInTheDocument()
  await waitFor(() => expect(document.title).toContain('Compre com mais clareza'))
})

it('mostra a entrada pública mesmo enquanto a consulta de sessão está pendente ou falha', async () => {
  const session = deferred()
  fakeApi((url) => url === '/api/auth/me' ? session.promise : undefined)
  window.history.replaceState({}, '', '/')
  render(<App />)
  expect(screen.getByRole('heading', { name: /Compre com.*mais clareza/i })).toBeInTheDocument()
  session.reject(new TypeError('Failed to fetch'))
  expect(await screen.findByRole('heading', { name: /Compre com.*mais clareza/i })).toBeInTheDocument()
})

it('encaminha o CTA principal ao login sem prometer cadastro disponível', async () => {
  visit('/')
  const hero = await screen.findByRole('region', { name: /Compre com.*mais clareza/i })
  await userEvent.setup().click(within(hero).getByRole('link', { name: 'Começar com IA' }))
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
})

it('abre o menu por teclado e fecha ao seguir uma seção', async () => {
  visit('/')
  const toggle = await screen.findByRole('button', { name: 'Abrir menu' })
  const user = userEvent.setup()
  toggle.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
  await user.click(within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Como funciona' }))
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
})

it('fecha o menu com Escape e devolve o foco ao botão de abertura', async () => {
  visit('/')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Abrir menu' }))
  within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Como funciona' }).focus()
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus()
})

it('recolhe o menu quando o foco sai do cabeçalho', async () => {
  visit('/')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Abrir menu' }))
  within(screen.getByRole('region', { name: /Compre com.*mais clareza/i })).getByRole('link', { name: 'Começar com IA' }).focus()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false'))
})
