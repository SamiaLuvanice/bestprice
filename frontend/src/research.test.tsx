import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, fakeApi, reply } from './test/fakeApi'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const capabilities = { enabled: true, provider: 'google', model: 'gemini-3.5-flash-lite', retention_days: 90, max_message_chars: 2000, user_daily_limit: 20 }
const summary = { id: 'comparison-1', title: 'Meu notebook', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z', expires_at: '2027-01-24T00:00:00Z' }
const comparison = { ...summary, use_case: '', version: 1, analysis: null, products: [
  { name: 'Modelo A', details: '', price: null, currency: 'BRL', url: null },
  { name: 'Modelo B', details: '', price: null, currency: 'BRL', url: null },
] }

function visit(path: string) {
  window.history.replaceState({}, '', path)
  render(<App />)
}

function researchApi(extra: Parameters<typeof fakeApi>[0] = () => undefined) {
  return fakeApi((url, init) => {
    const result = extra(url, init)
    if (result !== undefined) return result
    if (url === '/api/ai/capabilities') return reply(200, capabilities)
    if (url.startsWith('/api/research?')) return reply(200, { items: [], next_offset: null })
    return undefined
  })
}

it('abre dashboard A e transporta o rascunho sem incluir a mensagem na URL', async () => {
  const fetch = researchApi()
  visit('/app/dashboard')
  expect(await screen.findByRole('heading', { name: /Uma boa compra começa/ })).toBeInTheDocument()
  screen.getAllByRole('link', { name: 'BestPrice AI — Dashboard' }).forEach((brand) => expect(brand).toHaveTextContent('BestPrice AI'))
  fireEvent.change(screen.getByLabelText('O que você deseja comprar hoje?'), { target: { value: 'Notebook para estudar' } })
  await userEvent.setup().click(screen.getByRole('button', { name: 'Conversar com a IA' }))
  expect(await screen.findByLabelText('Sua mensagem')).toHaveValue('Notebook para estudar')
  expect(window.location.pathname).toBe('/app/assistant')
  expect(window.location.search).toBe('')
  expect(fetch.mock.calls.some(([url]) => url === '/api/ai/chat')).toBe(false)
})

it('mantém landing pública para uma pessoa autenticada', async () => {
  researchApi()
  visit('/')
  expect(await screen.findByRole('heading', { name: /Compre com mais clareza/ })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'BestPrice AI — Início' })).toHaveTextContent('BestPrice AI')
  expect(screen.getAllByRole('link', { name: 'Começar com IA' })[0]).toHaveAttribute('href', '/app/assistant')
})

it('mostra indisponibilidade do histórico sem declarar que não há pesquisas', async () => {
  researchApi((url) => url.startsWith('/api/research?') ? reply(503, apiError('research_unavailable', 'Pesquisas indisponíveis.')) : undefined)
  visit('/app/dashboard')
  expect(await screen.findByRole('alert')).toHaveTextContent('Pesquisas indisponíveis.')
  expect(screen.queryByText('Suas pesquisas começam aqui.')).not.toBeInTheDocument()
})

it('conserva rascunho ao falhar e não executa HTML retornado pela IA', async () => {
  let attempts = 0
  researchApi((url) => {
    if (url === '/api/ai/conversations/conversation-1') return reply(200, { id: 'conversation-1', title: 'Preciso de um notebook', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:01Z', expires_at: '2027-01-24T00:00:00Z', messages: [{ id: 'u1', role: 'user', content: 'Preciso de um notebook', created_at: '2026-10-26T00:00:00Z' }, { id: 'a1', role: 'assistant', content: '<img src=x onerror=alert(1)>', created_at: '2026-10-26T00:00:01Z' }] })
    if (url !== '/api/ai/chat') return undefined
    attempts += 1
    if (attempts === 1) return reply(503, apiError('ai_unavailable', 'IA indisponível.'))
    return reply(200, { conversation_id: 'conversation-1', request_id: 'request-1', expires_at: '2027-01-24T00:00:00Z', user_message: { id: 'u1', role: 'user', content: 'Preciso de um notebook', created_at: '2026-10-26T00:00:00Z' }, assistant_message: { id: 'a1', role: 'assistant', content: '<img src=x onerror=alert(1)>', created_at: '2026-10-26T00:00:01Z' } })
  })
  visit('/app/assistant')
  await screen.findByLabelText('Sua mensagem')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).not.toBeDisabled())
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Preciso de um notebook' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('IA indisponível.')
  expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Preciso de um notebook')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  expect(document.querySelector('.ai-message img')).toBeNull()
})

it.each([404, 503])('não permite criar por engano quando a comparação existente falha com %s', async (status) => {
  const fetch = researchApi((url) => {
    if (url === '/api/comparisons/comparison-1') return reply(status, apiError('research_unavailable', 'Comparação indisponível.'))
    return undefined
  })
  visit('/app/compare/comparison-1')
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Salvar comparação' })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Título da pesquisa')).not.toBeInTheDocument()
  expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

it('preserva preço colado com separador de milhar e envia decimal canônico', async () => {
  const fetch = researchApi((url, init) => {
    if (url !== '/api/comparisons/comparison-1') return undefined
    if (init?.method === 'PUT') return reply(200, { ...comparison, version: 2, products: [{ ...comparison.products[0], price: '1899.90' }, comparison.products[1]] })
    return reply(200, comparison)
  })
  visit('/app/compare/comparison-1')
  const price = await screen.findByLabelText('Preço informado 1 (R$, opcional)')
  fireEvent.change(price, { target: { value: '1.899,90' } })
  expect(price).toHaveValue('1.899,90')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar comparação' }))
  await waitFor(() => expect(fetch.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true))
  const body = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')?.[1]?.body
  expect(JSON.parse(String(body)).products[0].price).toBe('1899.90')
  expect(await screen.findByText('Comparação salva.')).toBeInTheDocument()
})

it('não restaura rascunho de uma sessão encerrada ao voltar ao histórico do navegador', async () => {
  researchApi((url) => {
    if (url === '/api/auth/logout') return reply(204, null)
    if (url === '/api/auth/login') return reply(200, { id: 'user-2', email: 'outra@example.com' })
    return undefined
  })
  const user = userEvent.setup()
  visit('/app/dashboard')
  fireEvent.change(await screen.findByLabelText('O que você deseja comprar hoje?'), { target: { value: 'Rascunho privado da primeira conta' } })
  await user.click(screen.getByRole('button', { name: 'Conversar com a IA' }))
  expect(await screen.findByLabelText('Sua mensagem')).toHaveValue('Rascunho privado da primeira conta')
  const oldEntry: unknown = window.history.state
  await user.click(within(screen.getByRole('navigation', { name: 'Espaço de compras' })).getByRole('link', { name: 'Histórico' }))
  await user.click(screen.getByRole('button', { name: /Conta:/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  await user.type(await screen.findByLabelText('E-mail'), 'outra@example.com')
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'senha')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('button', { name: /outra@example.com/ })
  await act(async () => {
    window.history.replaceState(oldEntry, '', '/app/assistant')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  expect(await screen.findByLabelText('Sua mensagem')).toHaveValue('')
})

it('reutiliza request_id após 409 pendente e limpa rascunho em nova conversa', async () => {
  let attempts = 0
  const conversation = { ...summary, id: 'conversation-1', messages: [] }
  const fetch = researchApi((url, init) => {
    if (url === '/api/ai/conversations/conversation-1') return reply(200, conversation)
    if (url !== '/api/ai/chat') return undefined
    attempts += 1
    if (attempts === 1) return reply(409, apiError('request_in_progress', 'Envio em andamento.'))
    const body = JSON.parse(String(init?.body))
    return reply(200, { conversation_id: 'conversation-1', request_id: body.request_id, expires_at: summary.expires_at, user_message: { id: 'u1', role: 'user', content: body.message, created_at: summary.created_at }, assistant_message: { id: 'a1', role: 'assistant', content: 'Qual será o uso?', created_at: summary.created_at } })
  })
  visit('/app/assistant/conversation-1')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).not.toBeDisabled())
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Notebook' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Envio em andamento.')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByText('Qual será o uso?')).toBeInTheDocument()
  const bodies = fetch.mock.calls.filter(([url]) => url === '/api/ai/chat').map(([, init]) => JSON.parse(String(init?.body)))
  expect(bodies).toHaveLength(2)
  expect(bodies[1].request_id).toBe(bodies[0].request_id)
  expect(screen.getAllByText('Notebook', { exact: true })).toHaveLength(1)
  fireEvent.change(screen.getByLabelText('Sua mensagem'), { target: { value: 'Outro rascunho' } })
  await userEvent.setup().click(screen.getByRole('link', { name: 'Nova conversa' }))
  expect(await screen.findByLabelText('Sua mensagem')).toHaveValue('')
})

it('oculta análise desatualizada ao editar e exige salvar antes de analisar', async () => {
  researchApi((url) => url === '/api/comparisons/comparison-1' ? reply(200, { ...comparison, analysis: { version: 1, content: 'Síntese anterior', created_at: summary.created_at } }) : undefined)
  visit('/app/compare/comparison-1')
  expect(await screen.findByText('Síntese anterior')).toBeInTheDocument()
  expect(screen.getAllByText('Não informado').length).toBeGreaterThan(0)
  fireEvent.change(screen.getByLabelText('Nome do produto 1'), { target: { value: 'Modelo editado' } })
  expect(screen.queryByText('Síntese anterior')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Analisar com IA' })).toBeDisabled()
})

it('cancelar exclusão não envia DELETE e falha conserva pesquisa acessível', async () => {
  const fetch = researchApi((url, init) => {
    if (url.startsWith('/api/research?')) return reply(200, { items: [{ ...summary, kind: 'comparison' }], next_offset: null })
    if (url === '/api/comparisons/comparison-1' && init?.method === 'DELETE') return reply(503, apiError('research_unavailable', 'Não foi possível excluir.'))
    return undefined
  })
  visit('/app/history')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Excluir Meu notebook' }))
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Excluir Meu notebook' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir pesquisa' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível excluir.')
  expect(screen.getByRole('link', { name: /Meu notebook/ })).toBeInTheDocument()
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
})

it('fecha navegação ao sair por Tab e Escape retorna foco ao acionador', async () => {
  researchApi()
  visit('/app/dashboard')
  const user = userEvent.setup()
  const toggle = await screen.findByRole('button', { name: 'Abrir navegação' })
  await user.click(toggle)
  const nav = screen.getByRole('navigation', { name: 'Espaço de compras' })
  const last = within(nav).getByRole('link', { name: 'Monitoramento' })
  last.focus()
  await user.tab()
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await user.click(toggle)
  await user.keyboard('{Escape}')
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()
})

it('mantém request_id na análise pendente e bloqueia versão em conflito até recarregar', async () => {
  let attempts = 0
  const fetch = researchApi((url) => {
    if (url === '/api/comparisons/comparison-1') return reply(200, { ...comparison, analysis: { version: 1, content: 'Análise da versão anterior', created_at: summary.created_at } })
    if (url !== '/api/comparisons/comparison-1/analyze') return undefined
    attempts += 1
    return reply(409, apiError(attempts === 1 ? 'request_in_progress' : 'research_conflict', attempts === 1 ? 'Análise em andamento.' : 'Versão alterada.'))
  })
  visit('/app/compare/comparison-1')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Analisar com IA' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Analisar com IA' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Análise em andamento.')
  fireEvent.click(screen.getByRole('button', { name: 'Analisar com IA' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Esta pesquisa mudou.')
  expect(screen.queryByText('Análise da versão anterior')).not.toBeInTheDocument()
  const bodies = fetch.mock.calls.filter(([url]) => url.endsWith('/analyze')).map(([, init]) => JSON.parse(String(init?.body)))
  expect(bodies).toHaveLength(2)
  expect(bodies[1].request_id).toBe(bodies[0].request_id)
  expect(screen.getByRole('button', { name: 'Analisar com IA' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Analisar com IA' })).toBeEnabled())
})

it('recarregar após conflito de edição libera a versão recuperada para análise', async () => {
  researchApi((url, init) => {
    if (url === '/api/comparisons/comparison-1') return init?.method === 'PUT'
      ? reply(409, apiError('research_conflict', 'Versão alterada.')) : reply(200, comparison)
    return undefined
  })
  visit('/app/compare/comparison-1')
  fireEvent.change(await screen.findByLabelText('Nome do produto 1'), { target: { value: 'Edição local' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar comparação' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Esta pesquisa mudou.')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Analisar com IA' })).toBeEnabled())
  expect(screen.getByLabelText('Nome do produto 1')).toHaveValue('Modelo A')
})

it('atalho de conteúdo do monitoramento aponta para o main existente', async () => {
  researchApi()
  visit('/app/monitoring/overview')
  await screen.findByRole('heading', { name: 'Seu painel de preços' })
  const href = document.querySelector<HTMLAnchorElement>('.research-skip')?.getAttribute('href')
  expect(href).toBe('#conteudo')
  expect(document.querySelector(href ?? '#research-content')).toBe(screen.getByRole('main'))
})
