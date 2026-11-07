import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, dashboardWith, fakeApi, reply, trackedFixture, type Route } from './test/fakeApi'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

// 0049/AC07: em cada tela da lista A há no máximo uma ação em verde (Button `default`, o
// `action` do Figma). jsdom não aplica CSS de layout; a contagem exclui só elementos ocultos
// por atributo (hidden/aria-hidden), e a Fase 5 confere a visibilidade real no navegador.
const capabilities = { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
const conversation = { id: 'c1', title: 'Notebook', kind: 'conversation', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-30T12:00:00Z', expires_at: '2027-01-24T00:00:00Z' }
const guest: Route = (url) => url === '/api/auth/me' ? reply(401, apiError('unauthenticated', 'Entre para continuar.')) : undefined
const ai: Route = (url) => {
  if (url === '/api/ai/capabilities') return reply(200, capabilities)
  if (url.startsWith('/api/research?')) return reply(200, { items: [conversation], next_offset: null })
  if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation, messages: [{ id: 'm1', role: 'assistant', content: 'Qual o seu uso?', created_at: conversation.created_at }] })
  return undefined
}

function visibleActions(): Element[] {
  return Array.from(document.querySelectorAll('[data-slot="button"][data-variant="default"]'))
    .filter((element) => !element.closest('[hidden], [aria-hidden="true"]'))
}

type Ready = () => Promise<unknown>
const heading = (name: string | RegExp): Ready => () => screen.findByRole('heading', { level: 1, name })
const text = (content: string): Ready => async () => (await screen.findAllByText(content))[0]

// Cada tela espera um elemento próprio do estado (dados carregados ou erro). Se ele não aparecer,
// o findBy falha e o teste também: a contagem nunca roda sobre uma tela errada ou incompleta.
const screens: [string, string, Route, unknown, Ready][] = [
  ['Entrar', '/login', guest, undefined, heading('Entrar na sua conta')],
  ['Criar conta', '/cadastro', (url, init) => guest(url, init) ?? (url === '/api/auth/signup' ? reply(200, { enabled: true }) : undefined), undefined, heading('Criar sua conta')],
  ['Assistente — início', '/app/assistant', ai, undefined, heading('O que você quer comprar?')],
  ['Assistente — conversa', '/app/assistant/c1', ai, undefined, text('Qual o seu uso?')],
  ['Assistente indisponível', '/app/assistant', (url) => url === '/api/ai/capabilities' ? reply(200, { ...capabilities, enabled: false }) : ai(url), undefined,
    text('O assistente está indisponível no momento. Suas pesquisas salvas continuam acessíveis.')],
  ['Histórico', '/app/history', ai, undefined, text('Notebook')],
  ['Monitoramento — sem produtos', '/app/monitoring', () => undefined, undefined, text('Você ainda não está acompanhando nenhum produto.')],
  ['Monitoramento — com produtos', '/app/monitoring', () => undefined, dashboardWith([trackedFixture()]), text('Fone sem fio')],
  ['Monitoramento indisponível', '/app/monitoring', (url) => url === '/api/dashboard' ? reply(503, apiError('unavailable', 'Não foi possível carregar o painel. Tente novamente.')) : undefined, undefined,
    text('Não foi possível carregar o painel. Tente novamente.')],
]

it.each(screens)('%s tem no máximo uma ação verde', async (_, path, route, dashboard, ready) => {
  fakeApi(route, dashboard)
  window.history.replaceState({}, '', path)
  render(<App />)
  await ready()
  const actions = visibleActions()
  expect(actions.length, actions.map((action) => action.textContent).join(' | ')).toBeLessThanOrEqual(1)
  for (const action of actions) expect(action.className).toContain('text-action-foreground')
})

it('falha quando o elemento esperado da tela não aparece', async () => {
  fakeApi(guest)
  window.history.replaceState({}, '', '/login')
  render(<App />)
  await expect(text('Elemento que não existe')()).rejects.toThrow()
})
