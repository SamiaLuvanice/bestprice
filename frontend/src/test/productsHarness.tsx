import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import { App } from '../App'
import { fakeApi, trackedFixture, type Route } from './fakeApi'

// Apoio dos testes da área com produtos: relógio fixo, render da App e consultas por linha da tabela.

export const fixedNow = new Date('2026-10-11T18:00:00Z')
export const clock = () => fixedNow

const recentTimes = {
  last_price_observed_at: '2026-10-11T16:00:00Z', last_attempt_at: '2026-10-11T17:30:00Z', price_changed_at: '2026-10-11T15:00:00Z',
}

export function product(id: string, title: string, overrides: Record<string, unknown> = {}, tracked: Record<string, unknown> = {}) {
  return trackedFixture({ id: `product-${id}`, title, ...recentTimes, ...overrides }, { id: `tracking-${id}`, ...tracked })
}

export async function renderArea(dashboard: unknown, route: Route = () => undefined, initialPath = '/produtos') {
  const mockFetch = fakeApi(route, dashboard)
  const user = userEvent.setup()
  window.history.replaceState({}, '', initialPath)
  render(<App clock={clock} />)
  await screen.findByRole('navigation', { name: 'Principal' })
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  if (initialPath === '/produtos') {
    await waitFor(() => expect(screen.getByRole('region', { name: 'Seus produtos' })).toHaveAttribute('aria-busy', 'false'))
  } else if (initialPath === '/') {
    await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
  }
  return { user, mockFetch }
}

export type User = ReturnType<typeof userEvent.setup>

export function productRow(title: string) {
  return screen.getByRole('rowgroup', { name: title })
}

export function rowStatus(title: string) {
  return within(productRow(title)).getByRole('status')
}

export async function chooseRowAction(user: User, title: string, action: 'Atualizar agora' | 'Parar de monitorar') {
  await user.click(screen.getByRole('button', { name: `Ações de ${title}` }))
  await user.click(within(screen.getByRole('group', { name: `Ações de ${title}` })).getByRole('button', { name: action }))
}

export function bellButton() {
  return within(screen.getByRole('banner')).getByRole('button', { name: /^Notificações/ })
}

export function linkField() {
  return screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
}
