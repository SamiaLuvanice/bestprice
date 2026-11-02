import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, fakeApi, reply } from './test/fakeApi'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const capabilities = { enabled: true, provider: 'google', model: 'gemini-3.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
const conversation = (id: string, title = id) => ({ id, title, kind: 'conversation', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-30T12:00:00Z', expires_at: '2027-01-24T00:00:00Z' })
function setup(extra: Parameters<typeof fakeApi>[0] = () => undefined, path = '/app/assistant') {
  const fetch = fakeApi((url, init) => {
    const result = extra(url, init)
    if (result !== undefined) return result
    if (url === '/api/ai/capabilities') return reply(200, capabilities)
    if (url.startsWith('/api/research?')) return reply(200, { items: [], next_offset: null })
    return undefined
  })
  window.history.replaceState({}, '', path)
  render(<App />)
  return fetch
}

it('mostra quatro conversas reais e solicita somente conversas recentes', async () => {
  const fetch = setup((url) => url.startsWith('/api/research?') ? reply(200, { items: ['A', 'B', 'C', 'D'].map((id) => conversation(id)), next_offset: 4 }) : undefined)
  const recent = await screen.findByRole('region', { name: 'Conversas recentes' })
  await waitFor(() => expect(within(recent).getAllByRole('listitem')).toHaveLength(4))
  expect(within(recent).getByRole('link', { name: /A.*30/ })).toHaveAttribute('href', '/app/assistant/A')
  expect(within(recent).getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/app/history')
  const request = fetch.mock.calls.find(([url]) => url.startsWith('/api/research?'))?.[0]
  expect(new URL(String(request), 'http://localhost').searchParams.get('kind')).toBe('conversation')
  expect(new URL(String(request), 'http://localhost').searchParams.get('limit')).toBe('4')
})

it('falha da lista preserva a escrita e permite tentar novamente sem enviar', async () => {
  let attempts = 0
  const fetch = setup((url) => {
    if (!url.startsWith('/api/research?')) return undefined
    attempts += 1
    return attempts === 1 ? reply(503, apiError('research_unavailable', 'Não foi possível listar conversas.')) : reply(200, { items: [conversation('c1', 'Notebook real')], next_offset: null })
  })
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível listar conversas.')
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Rascunho preservado' } })
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('link', { name: /Notebook real/ })).toBeInTheDocument()
  expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Rascunho preservado')
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled()
  expect(fetch.mock.calls.some(([url]) => url === '/api/ai/chat')).toBe(false)
})

it('distingue carregamento e vazio sem inventar conversas', async () => {
  let complete!: (response: ReturnType<typeof reply>) => void
  setup((url) => url.startsWith('/api/research?') ? new Promise<ReturnType<typeof reply>>((resolve) => { complete = resolve }) : undefined)
  expect(await screen.findByText('Carregando conversas recentes…')).toBeInTheDocument()
  await act(async () => complete(reply(200, { items: [], next_offset: null })))
  expect(await screen.findByText(/Escreva uma mensagem para iniciar a primeira/)).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

it('retoma conversa salva com IA desativada e não exibe a ilustração grande', async () => {
  setup((url) => {
    if (url === '/api/ai/capabilities') return reply(200, { ...capabilities, enabled: false })
    if (url.startsWith('/api/research?')) return reply(200, { items: [conversation('c1', 'Notebook real')], next_offset: null })
    if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation('c1', 'Notebook real'), messages: [{ id: 'm1', role: 'assistant', content: 'Qual o seu uso?', created_at: conversation('c1').created_at }] })
    return undefined
  })
  await userEvent.setup().click(await screen.findByRole('link', { name: /Notebook real/ }))
  expect(await screen.findByText('Qual o seu uso?')).toBeInTheDocument()
  expect(screen.getByText(/O assistente está indisponível/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled()
  expect(screen.queryByRole('img', { name: /Robô do assistente/ })).not.toBeInTheDocument()
  expect(screen.getByText(/Resposta de IA. Dados de mercado não verificados/)).toBeInTheDocument()
})

it('sugestão preenche texto editável sem envio e nova conversa limpa o rascunho', async () => {
  const fetch = setup()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Um notebook para estudar' }))
  expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Um notebook para estudar')
  expect(screen.getByLabelText('Sua mensagem')).toHaveFocus()
  expect(fetch.mock.calls.some(([url]) => url === '/api/ai/chat')).toBe(false)
  await user.click(screen.getByRole('link', { name: 'Nova conversa' }))
  expect(await screen.findByLabelText('Sua mensagem')).toHaveValue('')
})

it('atualiza a ordem após envio em conversa existente sem duplicar entradas', async () => {
  let sent = false
  setup((url) => {
    if (url.startsWith('/api/research?')) return reply(200, { items: (sent ? ['c1', 'c2'] : ['c2', 'c1']).map((id) => conversation(id)), next_offset: null })
    if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation('c1'), messages: [] })
    if (url === '/api/ai/chat') {
      sent = true
      return reply(200, { conversation_id: 'c1', request_id: 'r1', expires_at: conversation('c1').expires_at, user_message: { id: 'u1', role: 'user', content: 'Quero estudar', created_at: conversation('c1').created_at }, assistant_message: { id: 'a1', role: 'assistant', content: 'Qual seu orçamento?', created_at: conversation('c1').created_at } })
    }
    return undefined
  }, '/app/assistant/c1')
  const recent = await screen.findByRole('region', { name: 'Conversas recentes' })
  await waitFor(() => expect(within(recent).getAllByRole('listitem')[0]).toHaveTextContent('c2'))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Quero estudar' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByText('Qual seu orçamento?')).toBeInTheDocument()
  await waitFor(() => expect(within(recent).getAllByRole('listitem')[0]).toHaveTextContent('c1'))
  expect(within(recent).getAllByRole('listitem')).toHaveLength(2)
})

it('valida mensagem vazia e conserva o texto quando o envio falha', async () => {
  setup((url) => url === '/api/ai/chat' ? reply(429, apiError('ai_daily_limit', 'Limite diário atingido.')) : undefined)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: '   ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Escreva uma mensagem')
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Um celular' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Limite diário atingido.')
  expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Um celular')
})

it('inclui a primeira conversa na lista após envio e mudança de URL', async () => {
  let sent = false
  setup((url) => {
    if (url.startsWith('/api/research?')) return reply(200, { items: sent ? [conversation('c1', 'Minha primeira conversa')] : [], next_offset: null })
    if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation('c1', 'Minha primeira conversa'), messages: [{ id: 'a1', role: 'assistant', content: 'Qual será o uso?', created_at: conversation('c1').created_at }] })
    if (url === '/api/ai/chat') {
      sent = true
      return reply(200, { conversation_id: 'c1', request_id: 'r1', expires_at: conversation('c1').expires_at, user_message: { id: 'u1', role: 'user', content: 'Notebook', created_at: conversation('c1').created_at }, assistant_message: { id: 'a1', role: 'assistant', content: 'Qual será o uso?', created_at: conversation('c1').created_at } })
    }
    return undefined
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Notebook' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('link', { name: /Minha primeira conversa/ })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/app/assistant/c1')
})

it('não mostra resultado atrasado da lista da conta anterior após sair e entrar', async () => {
  let complete!: (response: ReturnType<typeof reply>) => void
  let requests = 0
  setup((url) => {
    if (url === '/api/auth/logout') return reply(204, null)
    if (url === '/api/auth/login') return reply(200, { id: 'user-2', email: 'outra@example.com' })
    if (!url.startsWith('/api/research?')) return undefined
    requests += 1
    return requests === 1 ? new Promise<ReturnType<typeof reply>>((resolve) => { complete = resolve }) : reply(200, { items: [conversation('c2', 'Conversa da nova conta')], next_offset: null })
  })
  await screen.findByText('Carregando conversas recentes…')
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Conta:/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  await user.type(await screen.findByLabelText('E-mail'), 'outra@example.com')
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'senha')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('link', { name: /Conversa da nova conta/ })).toBeInTheDocument()
  await act(async () => complete(reply(200, { items: [conversation('private', 'Conversa privada da conta anterior')], next_offset: null })))
  expect(screen.queryByText('Conversa privada da conta anterior')).not.toBeInTheDocument()
})
