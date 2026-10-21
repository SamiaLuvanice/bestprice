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
  expect(await screen.findByRole('heading', { name: /O preço muda.*Você fica sabendo/i, level: 1 })).toBeInTheDocument()
  expect(document.title).toContain('Acompanhe preços')
  expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Clareza para decidir na hora certa.' })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  await userEvent.setup().click(within(screen.getByRole('banner').querySelector('.landing-header__actions')!).getByRole('link', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
  expect(document.title).toBe('Entrar · BestPrice')
})

it('substitui a landing pelo painel com título próprio quando a sessão é válida', async () => {
  document.title = 'BestPrice'
  fakeApi((url) => url === '/api/auth/me' ? reply(200, { id: 'user-1', email: 'pessoa@example.com' }) : undefined)
  window.history.replaceState({}, '', '/')
  render(<App />)
  expect(await screen.findByRole('heading', { name: /Seu painel de preços/i, level: 1 })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /O preço muda.*Você fica sabendo/i })).not.toBeInTheDocument()
  await waitFor(() => expect(document.title).toBe('Início · BestPrice'))
})

it('mostra a entrada pública mesmo enquanto a consulta de sessão está pendente ou falha', async () => {
  const session = deferred()
  fakeApi((url) => url === '/api/auth/me' ? session.promise : undefined)
  window.history.replaceState({}, '', '/')
  render(<App />)
  expect(screen.getByRole('heading', { name: /O preço muda.*Você fica sabendo/i })).toBeInTheDocument()
  session.reject(new TypeError('Failed to fetch'))
  expect(await screen.findByRole('heading', { name: /O preço muda.*Você fica sabendo/i })).toBeInTheDocument()
})

it('encaminha o CTA principal ao login sem prometer cadastro disponível', async () => {
  visit('/')
  const hero = await screen.findByRole('region', { name: /O preço muda.*Você fica sabendo/i })
  await userEvent.setup().click(within(hero).getByRole('link', { name: 'Entrar e monitorar' }))
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
