import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, fakeApi, reply } from './test/fakeApi'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const capabilities = { enabled: true, provider: 'google', model: 'gemini-2.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
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

async function openRecent() {
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Conversas recentes' }))
  return screen.getByRole('region', { name: 'Conversas recentes' })
}

it.each(['/app/assistant', '/app/assistant/c1'])('recentes começam recolhidos e preservam rascunho ao fechar em %s', async (path) => {
  const fetch = setup((url) => {
    if (url.startsWith('/api/research?')) return reply(200, { items: [conversation('c1', 'Notebook real')], next_offset: null })
    if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation('c1'), messages: [] })
    return undefined
  }, path)
  const user = userEvent.setup()
  const toggle = await screen.findByRole('button', { name: 'Conversas recentes' })
  await waitFor(() => expect(screen.getByLabelText('Sua mensagem')).toBeEnabled())
  const input = screen.getByLabelText('Sua mensagem')
  fireEvent.change(input, { target: { value: 'Meu rascunho' } })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('region', { name: 'Conversas recentes' })).not.toBeInTheDocument()
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const panel = screen.getByRole('region', { name: 'Conversas recentes' })
  await user.tab()
  expect(within(panel).getByRole('link', { name: 'Ver todas' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()
  await user.click(toggle)
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await user.click(toggle)
  await user.click(input)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(input).toHaveValue('Meu rascunho')
  expect(window.location.pathname).toBe(path)
  expect(fetch.mock.calls.some(([url]) => url === '/api/ai/chat')).toBe(false)
})

it('mostra pergunta e exemplo únicos com transparência junto ao envio e descrição curta', async () => {
  setup()
  expect(await screen.findByRole('heading', { name: 'O que você quer comprar?' })).toBeInTheDocument()
  const input = screen.getByLabelText('Sua mensagem')
  expect(input).toHaveAttribute('placeholder', 'Ex.: notebook para estudar, até R$ 3.500')
  expect(input).toHaveAccessibleDescription('Até 2.000 caracteres')
  const form = input.closest('form')!
  expect(within(form).getByText(/O Google processa suas mensagens/)).toHaveTextContent('Na modalidade gratuita, o conteúdo pode ser usado para melhorar seus produtos. Não envie dados pessoais ou confidenciais.')
  expect(screen.queryByRole('button', { name: /Ver exemplos|Sobre a IA|Um notebook para estudar/ })).not.toBeInTheDocument()
  expect(screen.queryByText(/20 análises|contexto mais recente|Volte quando quiser|excluídas do BestPrice/)).not.toBeInTheDocument()
})

it('mostra contador apenas nos últimos 200 caracteres e permite voltar a editar', async () => {
  setup()
  const input = await screen.findByLabelText('Sua mensagem')
  expect(input).toHaveAttribute('maxlength', '2000')
  fireEvent.change(input, { target: { value: 'a'.repeat(1799) } })
  expect(screen.queryByText(/caracteres restantes/)).not.toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'a'.repeat(1800) } })
  expect(input).toHaveAccessibleDescription('Até 2.000 caracteres 200 caracteres restantes')
  fireEvent.change(input, { target: { value: 'a'.repeat(2000) } })
  expect(screen.getByText('0 caracteres restantes')).toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'Texto menor' } })
  expect(screen.queryByText(/caracteres restantes/)).not.toBeInTheDocument()
})

it('mostra quatro conversas reais e solicita somente conversas recentes', async () => {
  const fetch = setup((url) => url.startsWith('/api/research?') ? reply(200, { items: ['A', 'B', 'C', 'D'].map((id) => conversation(id)), next_offset: 4 }) : undefined)
  const recent = await openRecent()
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
  await openRecent()
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
  await openRecent()
  expect(await screen.findByText('Carregando conversas recentes…')).toBeInTheDocument()
  await act(async () => complete(reply(200, { items: [], next_offset: null })))
  expect(await screen.findByText('Nenhuma conversa ainda.')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

it('retoma conversa salva com IA desativada e não exibe a ilustração grande', async () => {
  setup((url) => {
    if (url === '/api/ai/capabilities') return reply(200, { ...capabilities, enabled: false })
    if (url.startsWith('/api/research?')) return reply(200, { items: [conversation('c1', 'Notebook real')], next_offset: null })
    if (url === '/api/ai/conversations/c1') return reply(200, { ...conversation('c1', 'Notebook real'), messages: [{ id: 'm1', role: 'assistant', content: 'Qual o seu uso?', created_at: conversation('c1').created_at }] })
    return undefined
  })
  await openRecent()
  await userEvent.setup().click(await screen.findByRole('link', { name: /Notebook real/ }))
  expect(await screen.findByText('Qual o seu uso?')).toBeInTheDocument()
  expect(screen.getByText(/O assistente está indisponível/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled()
  expect(screen.queryByRole('img', { name: /Robô do assistente/ })).not.toBeInTheDocument()
  const response = screen.getByRole('article', { name: 'Resposta de BestPrice IA. Dados de mercado não verificados.' })
  expect(within(response).getByText('BestPrice IA')).toHaveAttribute('title', 'Resposta de IA. Preços, estoque e especificações não verificados.')
  expect(screen.queryByText('Resposta de IA. Dados de mercado não verificados.')).not.toBeInTheDocument()
})

it('nova conversa limpa o rascunho sem enviar', async () => {
  const fetch = setup()
  const user = userEvent.setup()
  await screen.findByLabelText('Sua mensagem')
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Um notebook para estudar' } })
  expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Um notebook para estudar')
  expect(fetch.mock.calls.some(([url]) => url === '/api/ai/chat')).toBe(false)
  await openRecent()
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
  const recent = await openRecent()
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
  await screen.findByText('Qual será o uso?')
  await screen.findByRole('heading', { name: 'Minha primeira conversa' })
  await openRecent()
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
  await openRecent()
  await screen.findByText('Carregando conversas recentes…')
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Conta:/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  await user.type(await screen.findByLabelText('E-mail'), 'outra@example.com')
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'senha')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('button', { name: /outra@example.com/ })
  // O login retoma a rota do assistente com um novo painel recolhido.
  if (screen.queryByRole('button', { name: 'Conversas recentes' })) await openRecent()
  expect(await screen.findByRole('link', { name: /Conversa da nova conta/ })).toBeInTheDocument()
  await act(async () => complete(reply(200, { items: [conversation('private', 'Conversa privada da conta anterior')], next_offset: null })))
  expect(screen.queryByText('Conversa privada da conta anterior')).not.toBeInTheDocument()
})

const searchedAt = '2026-11-04T12:00:00Z'
const suggestions = '<style>.chip{color:#000}</style><div class="chip"><a href="https://www.google.com/search?q=notebook">notebook preço</a></div>'
function groundedConversation(grounding: unknown) {
  const assistant: Record<string, unknown> = { id: 'a1', role: 'assistant', content: 'Encontrei ofertas a partir de R$ 3.199,00.', created_at: searchedAt }
  if (grounding !== undefined) assistant.grounding = grounding
  return { ...conversation('c1', 'Preço de notebook'), messages: [{ id: 'u1', role: 'user', content: 'Quanto custa o notebook X?', created_at: searchedAt, grounding: null }, assistant] }
}
function setupGrounded(grounding: unknown, caps: Record<string, unknown> = capabilities) {
  return setup((url) => {
    if (url === '/api/ai/capabilities') return reply(200, caps)
    if (url === '/api/ai/conversations/c1') return reply(200, groundedConversation(grounding))
    return undefined
  }, '/app/assistant/c1')
}

it('mostra fontes, sugestões isoladas, rótulo e instante da pesquisa na resposta com busca', async () => {
  setupGrounded({ status: 'searched', searched_at: searchedAt, sources: [{ title: 'Loja X', url: 'https://loja.example/notebook' }, { title: 'Loja Y', url: 'https://y.example/oferta' }], search_suggestions_html: suggestions })
  const response = await screen.findByRole('article', { name: /Resposta de BestPrice IA/ })
  const block = within(response).getByRole('region', { name: 'Fontes da pesquisa na web' })
  expect(within(block).getByText('Não verificado')).toBeInTheDocument()
  const time = block.querySelector('time')!
  expect(time).toHaveAttribute('dateTime', searchedAt)
  const local = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(searchedAt))
  expect(time.parentElement).toHaveTextContent(`Pesquisado em ${local}`)
  const link = within(block).getByRole('link', { name: 'Loja X (abre em nova aba)' })
  expect(link).toHaveAttribute('href', 'https://loja.example/notebook')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).not.toHaveAttribute('onclick')
  expect(within(block).getAllByRole('link')).toHaveLength(2)
  const frame = within(block).getByTitle('Sugestões de pesquisa do Google')
  expect(frame.tagName).toBe('IFRAME')
  expect(frame).toHaveAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox')
  const prefix = '<base target="_blank"><meta name="referrer" content="no-referrer">'
  const srcdoc = frame.getAttribute('srcdoc')!
  expect(srcdoc.startsWith(prefix)).toBe(true)
  expect(srcdoc.slice(prefix.length)).toBe(suggestions)
  expect(frame.getAttribute('sandbox')).not.toMatch(/allow-scripts|allow-same-origin/)
  expect(screen.getByText('Encontrei ofertas a partir de R$ 3.199,00.')).toBeInTheDocument()
})

it('avisa que a pesquisa na web ficou indisponível sem mostrar fontes', async () => {
  setupGrounded({ status: 'unavailable', searched_at: searchedAt, sources: [], search_suggestions_html: null })
  const response = await screen.findByRole('article', { name: /Resposta de BestPrice IA/ })
  expect(within(response).getByText('A pesquisa na web está indisponível agora; esta resposta não usou a web.')).toBeInTheDocument()
  expect(within(response).queryByRole('region', { name: 'Fontes da pesquisa na web' })).not.toBeInTheDocument()
  expect(response.querySelector('iframe')).toBeNull()
})

it.each([['nulo', null], ['ausente', undefined]])('não mostra bloco de pesquisa quando grounding é %s', async (_name, grounding) => {
  setupGrounded(grounding)
  const response = await screen.findByRole('article', { name: /Resposta de BestPrice IA/ })
  expect(within(response).queryByText('Não verificado')).not.toBeInTheDocument()
  expect(within(response).queryByText(/pesquisa na web está indisponível/)).not.toBeInTheDocument()
  expect(response.querySelector('iframe, time')).toBeNull()
})

it('acrescenta aviso de pesquisa pelo Google somente quando a busca na web está ativa', async () => {
  setup((url) => url === '/api/ai/capabilities' ? reply(200, { ...capabilities, web_search: true }) : undefined)
  const form = (await screen.findByLabelText('Sua mensagem')).closest('form')!
  expect(await within(form).findByText(/pode ser pesquisada pelo Google/)).toHaveTextContent('Sua pergunta pode ser pesquisada pelo Google, e o fornecedor guarda a pergunta e a resposta por 30 dias.')
  expect(within(form).getByText(/O Google processa suas mensagens/)).toBeInTheDocument()
  cleanup()
  setup((url) => url === '/api/ai/capabilities' ? reply(200, { ...capabilities, web_search: false }) : undefined)
  const other = (await screen.findByLabelText('Sua mensagem')).closest('form')!
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled())
  expect(within(other).queryByText(/pode ser pesquisada pelo Google/)).not.toBeInTheDocument()
})
