import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { apiError, deferred, fakeApi, reply } from '../../test/fakeApi'
import { HistoryPage } from './HistoryPage'

const conversation = { id: 'c1', title: 'Notebook para programação', kind: 'conversation', created_at: '2026-10-26T12:00:00Z', updated_at: '2026-10-31T12:00:00Z', expires_at: '2027-01-24T12:00:00Z' }
const result = (items = [conversation], next_offset: number | null = null) => reply(200, { items, next_offset })
const onUnauthenticated = vi.fn()

function visit() { render(<MemoryRouter><HistoryPage onUnauthenticated={onUnauthenticated} /></MemoryRouter>) }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })

it('consulta apenas conversas e apresenta cards com ação explícita de continuar', async () => {
  const fetch = fakeApi((url) => url.startsWith('/api/research?') ? result() : undefined)
  visit()
  const card = await screen.findByRole('listitem')
  expect(new URL(fetch.mock.calls[0][0], 'http://local').searchParams.get('kind')).toBe('conversation')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Suas conversas')
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(within(card).getByRole('link', { name: 'Continuar Notebook para programação' })).toHaveAttribute('href', '/app/assistant/c1')
  expect(within(card).getByText(/31\/10\/2026/)).toHaveAttribute('datetime', conversation.updated_at)
  expect(screen.getByText(/90 dias da criação/)).toBeInTheDocument()
})

it('busca por título, pagina o mesmo termo e limpa a busca com Enter', async () => {
  const fetch = fakeApi((url) => {
    if (!url.startsWith('/api/research?')) return undefined
    const query = new URL(url, 'http://local').searchParams
    return query.get('offset') === '20' ? result([{ ...conversation, id: 'c2', title: 'Outra conversa' }]) : result([conversation], 20)
  })
  visit()
  await screen.findByRole('listitem')
  const user = userEvent.setup()
  const input = screen.getByRole('searchbox', { name: 'Buscar pelo título' })
  await user.type(input, '  notebook  {Enter}')
  await screen.findByRole('listitem')
  await user.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(await screen.findByRole('heading', { name: 'Outra conversa' })).toBeInTheDocument()
  expect(new URL(fetch.mock.calls.at(-1)![0], 'http://local').searchParams).toEqual(new URLSearchParams('kind=conversation&q=notebook&offset=20&limit=20'))
  await user.click(screen.getByRole('button', { name: 'Anterior' }))
  await screen.findByRole('heading', { name: conversation.title })
  await user.clear(input)
  await user.type(input, '{Enter}')
  await screen.findByRole('listitem')
  expect(new URL(fetch.mock.calls.at(-1)![0], 'http://local').searchParams.get('q')).toBe('')
})

it('não troca a busca atual por uma resposta antiga', async () => {
  const first = deferred<ReturnType<typeof reply>>()
  fakeApi((url) => !url.startsWith('/api/research?') ? undefined : new URL(url, 'http://local').searchParams.get('q') ? result([{ ...conversation, title: 'Busca atual' }]) : first.promise)
  visit()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando histórico')
  const user = userEvent.setup()
  await user.type(screen.getByRole('searchbox'), 'atual{Enter}')
  await screen.findByRole('heading', { name: 'Busca atual' })
  await act(async () => first.resolve(result()))
  expect(screen.queryByRole('heading', { name: conversation.title })).not.toBeInTheDocument()
})

it('diferencia a primeira conversa de busca sem resultado e mantém o prazo', async () => {
  fakeApi((url) => url.startsWith('/api/research?') ? result([]) : undefined)
  visit()
  expect(await screen.findByRole('heading', { name: 'Seu histórico começa com a primeira ideia.' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Iniciar uma conversa' })).toHaveAttribute('href', '/app/assistant')
  const user = userEvent.setup()
  await user.type(screen.getByRole('searchbox'), 'inexistente')
  await user.click(screen.getByRole('button', { name: 'Buscar conversas' }))
  expect(await screen.findByRole('heading', { name: 'Nenhuma conversa encontrada.' })).toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Páginas de conversas' })).not.toBeInTheDocument()
  expect(screen.getByText(/90 dias da criação/)).toBeInTheDocument()
})

it.each(['http', 'network', 'invalid'])('recupera erro %s sem mostrar vazio e preserva a busca', async (kind) => {
  let fail = true
  fakeApi((url) => {
    if (!url.startsWith('/api/research?')) return undefined
    if (fail && new URL(url, 'http://local').searchParams.get('q')) {
      if (kind === 'network') return Promise.reject(new TypeError('Failed to fetch'))
      return kind === 'invalid' ? reply(200, { items: 'inválido' }) : reply(503, apiError('research_unavailable', 'Conversas indisponíveis.'))
    }
    return result()
  })
  visit()
  await screen.findByRole('listitem')
  const user = userEvent.setup()
  await user.type(screen.getByRole('searchbox'), 'notebook{Enter}')
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  expect(screen.queryByText('Nenhuma conversa encontrada.')).not.toBeInTheDocument()
  fail = false
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('listitem')).toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('notebook')
})

it('encaminha sessão expirada no carregamento', async () => {
  fakeApi((url) => url.startsWith('/api/research?') ? reply(401, apiError('unauthenticated', 'Sessão encerrada.')) : undefined)
  visit()
  await vi.waitFor(() => expect(onUnauthenticated).toHaveBeenCalledWith('Sessão encerrada.'))
})

it('confirma exclusão e recarrega a primeira página da mesma busca', async () => {
  let removed = false
  const fetch = fakeApi((url, init) => {
    if (init?.method === 'DELETE') { removed = true; return reply(204, null) }
    if (!url.startsWith('/api/research?')) return undefined
    const offset = new URL(url, 'http://local').searchParams.get('offset')
    return removed ? result([]) : offset === '20' ? result() : result([{ ...conversation, id: 'c0', title: 'Primeira página' }], 20)
  })
  visit()
  await screen.findByRole('listitem')
  const user = userEvent.setup()
  await user.type(screen.getByRole('searchbox'), 'notebook{Enter}')
  await screen.findByRole('listitem')
  await user.click(screen.getByRole('button', { name: 'Próxima' }))
  await user.click(await screen.findByRole('button', { name: `Excluir ${conversation.title}` }))
  const dialog = screen.getByRole('alertdialog')
  await vi.waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus())
  await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  expect(removed).toBe(false)
  expect(screen.getByRole('button', { name: `Excluir ${conversation.title}` })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: `Excluir ${conversation.title}` }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir pesquisa' }))
  expect(await screen.findByRole('heading', { name: 'Nenhuma conversa encontrada.' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Suas conversas' })).toHaveFocus()
  expect(fetch.mock.calls.some(([url, init]) => url === '/api/ai/conversations/c1' && init?.method === 'DELETE')).toBe(true)
  expect(new URL(fetch.mock.calls.at(-1)![0], 'http://local').searchParams.get('offset')).toBe('0')
  expect(new URL(fetch.mock.calls.at(-1)![0], 'http://local').searchParams.get('q')).toBe('notebook')
})
