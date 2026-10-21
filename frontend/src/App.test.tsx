import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, callsTo, dashboardFixture, deferred, fakeApi, reply, sessionUser, trackedFixture } from './test/fakeApi'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function visit(path = '/') {
  window.history.replaceState({}, '', path)
  render(<App />)
}

function guestApi(login?: () => unknown) {
  return fakeApi((url, init) => {
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    if (url === '/api/auth/login' && init?.method === 'POST' && login) return login()
    return undefined
  })
}

function fillLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
}

it('mostra login diretamente ao visitante, sem formulário de monitoramento', async () => {
  guestApi()
  visit('/login')
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('main').firstElementChild).toContainElement(screen.getByLabelText('E-mail'))
  expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  expect(screen.queryByPlaceholderText('https://www.mercadolivre.com.br/...')).not.toBeInTheDocument()
})

// 0028/AC14: enquanto a sessão é verificada (ou falha), a tela não oferece o formulário de link.
it('mantém a marca sem formulário de link enquanto verifica a sessão e quando ela falha', async () => {
  const session = deferred()
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(session.promise))
  visit('/produtos')
  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando sua conta…')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Seu painel de preços' })).not.toBeInTheDocument()
  session.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  expect(await screen.findByText('Serviço temporariamente indisponível.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos')
})

it('recupera falha de rede na verificação sem concluir logout', async () => {
  const mockFetch = fakeApi()
  mockFetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
  visit('/produtos')
  expect(await screen.findByText('Não foi possível conectar ao BestPrice. Tente novamente.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Produtos', level: 1 })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos')
})

it('não mostra dados protegidos após 401 da área autenticada', async () => {
  fakeApi((url) => url === '/api/dashboard' ? reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.')) : undefined)
  visit('/')
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
  expect(screen.queryByText('pessoa@example.com')).not.toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
})

it('abre detalhe direto por URL com valores e histórico da API', async () => {
  const item = trackedFixture()
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [
      { id: 'price-1', price: '80.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' },
    ], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver anúncio no Mercado Livre/ })).toHaveAttribute('href', item.product.canonical_url)
  expect(screen.getByText(/Menor: R\$\s*80,00/)).toBeInTheDocument()
  expect(screen.getByText('Histórico de preços')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('preserva preço desconhecido sem criar valor zero no detalhe', async () => {
  const item = trackedFixture({ current_price: null, previous_price: null, min_price: null, max_price: null,
    absolute_change: null, percentage_change: null, last_price_observed_at: null, price_changed_at: null })
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Preço indisponível')).toBeInTheDocument()
  expect(await screen.findByText('O gráfico aparece após o primeiro preço válido registrado.')).toBeInTheDocument()
  expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument()
})

const validPriceEvent = {
  id: 'event-1', tracked_product_id: 'tracking-1', type: 'price_changed',
  previous_value: '100.00', current_value: '80.00', currency: 'BRL', observed_at: '2026-10-08T11:00:00Z',
}

it.each([
  ['tipo desconhecido', { ...validPriceEvent, type: 'other' }],
  ['identificador do monitoramento ausente', { ...validPriceEvent, tracked_product_id: undefined }],
  ['preço atual não textual', { ...validPriceEvent, current_value: 80 }],
  ['moeda inválida', { ...validPriceEvent, currency: 123 }],
  ['instante inválido', { ...validPriceEvent, observed_at: null }],
])('rejeita resposta de dashboard com evento fora do contrato: %s', async (_case, event) => {
  fakeApi(() => undefined, dashboardFixture({ recentUpdates: [event] }))
  visit('/')
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('aceita evento de disponibilidade sem moeda e mostra a atualização recente', async () => {
  fakeApi(() => undefined, dashboardFixture({ items: [trackedFixture()], recentUpdates: [{
    ...validPriceEvent, type: 'availability_changed', previous_value: 'unavailable',
    current_value: 'available', currency: null,
  }] }))
  visit('/')
  await waitFor(() => expect(screen.getByRole('region', { name: 'Atualizações recentes' }))
    .toHaveTextContent('Fone sem fio voltou a ficar disponível.'))
  expect(screen.queryByText('A API respondeu com dados inválidos.')).not.toBeInTheDocument()
})

it('mostra falha da integração no formulário sem afirmar sucesso', async () => {
  fakeApi((url, init) => url === '/api/tracked-products' && init?.method === 'POST'
    ? reply(503, apiError('integration_not_configured', 'Integração indisponível no momento.')) : undefined)
  visit('/')
  await screen.findByRole('heading', { name: 'Seu painel de preços' })
  fireEvent.change(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...'), {
    target: { value: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Monitorar preço' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Integração indisponível no momento.')
  expect(screen.queryByText('Produto monitorado com sucesso.')).not.toBeInTheDocument()
})

it('mostra envio ocupado sem reenviar, preserva campos após 401 e entra na tentativa seguinte', async () => {
  const pending = deferred()
  let attempt = 0
  const mockFetch = guestApi(() => ++attempt === 1 ? pending.promise : reply(200, sessionUser))
  visit('/login')
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'errada')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  const busyButton = await screen.findByRole('button', { name: 'Entrando…' })
  expect(busyButton).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(busyButton)
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(1)
  pending.resolve(reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.'))
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('errada')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
  fillLogin('pessoa@example.com', 'certa')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('pessoa@example.com')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/')
})

it('limpa alerta do servidor se novo envio falha na validação', async () => {
  const mockFetch = guestApi(() => reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')))
  visit('/login')
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'errada')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.'))
  fillLogin('pessoa@example.com', '')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(1)
})

it('mostra falha de conexão no login e mantém os campos', async () => {
  guestApi(() => Promise.reject(new TypeError('Failed to fetch')))
  visit('/login')
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'segredo')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar ao BestPrice. Tente novamente.'))
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('segredo')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
})
