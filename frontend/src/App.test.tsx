import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { savePendingTrackLink } from './navigation/pendingTrackLink'
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

it.each(['/login', '/login?returnTo=%2Fprodutos', '/login/', '/LOGIN'])('mostra login sem rodapé e preserva seu conteúdo em %s', async (path) => {
  guestApi()
  visit(path)
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('main').firstElementChild).toContainElement(screen.getByLabelText('E-mail'))
  expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  expect(screen.queryByPlaceholderText('https://www.mercadolivre.com.br/...')).not.toBeInTheDocument()
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(screen.getByText('O monitoramento começa com um link do Mercado Livre.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
})

it.each(['HTTP 503', 'falha de rede'])('mantém o login sem rodapé durante a sessão pendente, %s e recuperação', async (failure) => {
  const session = deferred()
  let attempt = 0
  fakeApi((url) => url === '/api/auth/me'
    ? ++attempt === 1 ? session.promise : reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    : undefined)
  visit('/login?returnTo=%2Fprodutos')
  expect(screen.getByRole('status')).toHaveTextContent('Carregando sua conta…')
  expect(document.title).toBe('Entrar · BestPrice')
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  if (failure === 'HTTP 503') session.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  else session.reject(new TypeError('Failed to fetch'))
  const retry = await screen.findByRole('button', { name: 'Tentar novamente' })
  expect(document.title).toBe('Entrar · BestPrice')
  expect(screen.getByRole('alert')).toHaveTextContent(failure === 'HTTP 503'
    ? 'Serviço temporariamente indisponível.' : 'Não foi possível conectar ao BestPrice. Tente novamente.')
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  fireEvent.click(retry)
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(document.title).toBe('Entrar · BestPrice')
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/produtos')
})

it('mostra o 404 público durante a consulta de sessão e após falha da API', async () => {
  const session = deferred()
  fakeApi((url) => url === '/api/auth/me' ? session.promise : undefined)
  visit('/pagina-que-nao-existe')

  const heading = screen.getByRole('heading', { name: 'Este endereço saiu do radar.' })
  expect(document.title).toBe('Página não encontrada · BestPrice')
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()

  await act(async () => {
    session.resolve(reply(429, {}))
  })
  expect(heading).toBeInTheDocument()
  await waitFor(() => expect(heading).toHaveFocus())
  expect(document.title).toBe('Página não encontrada · BestPrice')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it.each([
  { path: '/', title: 'Pare de dar F5 no preço.' },
  { path: '/endereco-inexistente', title: 'Este endereço saiu do radar.' },
])('preserva o rodapé público em $path', async ({ path, title }) => {
  guestApi()
  visit(path)
  expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
})

// 0028/AC14: enquanto a sessão é verificada (ou falha), a tela não oferece o formulário de link.
it('mantém a marca sem formulário de link enquanto verifica a sessão e quando ela falha', async () => {
  const session = deferred()
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(session.promise))
  visit('/produtos')
  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando sua conta…')
  expect(screen.getByRole('contentinfo')).toHaveTextContent('BestPrice · Acompanhe com clareza')
  expect(screen.getByRole('banner')).toHaveTextContent('BestPrice')
  expect(screen.getAllByRole('img', { name: 'BestPrice' })).toHaveLength(1)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Seu painel de preços' })).not.toBeInTheDocument()
  session.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  expect(await screen.findByText('Serviço temporariamente indisponível.')).toBeInTheDocument()
  expect(screen.getByRole('banner')).toHaveTextContent('BestPrice')
  expect(screen.getAllByRole('img', { name: 'BestPrice' })).toHaveLength(1)
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent('BestPrice · Acompanhe com clareza')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos')
})

it('recupera falha de rede na verificação sem concluir logout', async () => {
  const mockFetch = fakeApi()
  mockFetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
  visit('/produtos')
  expect(await screen.findByText('Não foi possível conectar ao BestPrice. Tente novamente.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos')
})

it('não mostra dados protegidos após 401 da área autenticada', async () => {
  fakeApi((url) => url === '/api/dashboard' ? reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.')) : undefined)
  visit('/app/monitoring/overview')
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
  expect(screen.getByRole('contentinfo')).toHaveTextContent('BestPrice · Acompanhe com clareza')
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
  visit('/app/monitoring/overview')
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('aceita evento de disponibilidade sem moeda e mostra a atualização recente', async () => {
  fakeApi(() => undefined, dashboardFixture({ items: [trackedFixture()], recentUpdates: [{
    ...validPriceEvent, type: 'availability_changed', previous_value: 'unavailable',
    current_value: 'available', currency: null,
  }] }))
  visit('/app/monitoring/overview')
  await waitFor(() => expect(screen.getByRole('region', { name: 'Atualizações recentes' }))
    .toHaveTextContent('Fone sem fio voltou a ficar disponível.'))
  expect(screen.queryByText('A API respondeu com dados inválidos.')).not.toBeInTheDocument()
})

it('mostra falha da integração no formulário sem afirmar sucesso', async () => {
  fakeApi((url, init) => url === '/api/tracked-products' && init?.method === 'POST'
    ? reply(503, apiError('integration_not_configured', 'Integração indisponível no momento.')) : undefined)
  visit('/app/monitoring/overview')
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
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(busyButton).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(busyButton)
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(1)
  pending.resolve(reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.'))
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('errada')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
  fillLogin('pessoa@example.com', 'certa')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('pessoa@example.com')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/app/dashboard')
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
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(1)
})

it('mostra falha de conexão no login e mantém os campos', async () => {
  guestApi(() => Promise.reject(new TypeError('Failed to fetch')))
  visit('/login')
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'segredo')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar ao BestPrice. Tente novamente.'))
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('segredo')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
})

function signupApi(signup: () => unknown, extra: (url: string, init?: RequestInit) => unknown = () => undefined) {
  return fakeApi((url, init) => {
    if (url === '/api/auth/signup' && (init?.method ?? 'GET') === 'GET') return signup()
    const custom = extra(url, init)
    if (custom !== undefined) return custom
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    return undefined
  })
}

// 0048/F4: o login oferece o cadastro só com o interruptor ligado, preservando o destino válido.
it.each([
  ['/login', '/cadastro'],
  ['/login?returnTo=%2Fapp%2Fassistant', '/cadastro?returnTo=%2Fapp%2Fassistant'],
  ['/login?returnTo=%2F%2Fevil.example', '/cadastro'],
  ['/login?returnTo=https%3A%2F%2Fevil.example', '/cadastro'],
  ['/login?returnTo=%2F', '/cadastro'],
])('em %s o link Criar conta leva a %s', async (path, href) => {
  signupApi(() => reply(200, { enabled: true }))
  visit(path)
  expect(await screen.findByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', href)
})

it.each([
  ['desligado', () => reply(200, { enabled: false })],
  ['com erro', () => Promise.reject(new TypeError('Failed to fetch'))],
])('não oferece Criar conta no login com o cadastro %s', async (_case, signup) => {
  const answered = deferred()
  signupApi(() => { answered.resolve(undefined); return signup() })
  visit('/login')
  await screen.findByRole('heading', { name: 'Entrar na sua conta' })
  await answered.promise
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(screen.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument()
})

// 0048/F5: rota do cadastro.
// 0050: com sessão confirmada, Entrar e Criar conta já levam ao destino final (returnTo seguro).
it.each([
  ['/cadastro?returnTo=%2Fapp%2Fassistant', '/app/assistant'],
  ['/cadastro', '/app/dashboard'],
  ['/cadastro?returnTo=%2F%2Fevil.example', '/app/dashboard'],
])('leva quem já tem sessão de %s a %s', async (path, destination) => {
  signupApi(() => reply(200, { enabled: true }), (url) => url === '/api/auth/me' ? reply(200, sessionUser) : undefined)
  visit(path)
  await waitFor(() => expect(window.location.pathname).toBe(destination))
  expect(screen.queryByRole('heading', { name: 'Criar sua conta' })).not.toBeInTheDocument()
})

it.each([
  ['/cadastro', '/login', null],
  ['/cadastro?returnTo=%2Fapp%2Fassistant', '/login', '/app/assistant'],
  ['/cadastro?returnTo=%2F%2Fevil.example', '/login', null],
])('com o cadastro desligado, %s leva ao login preservando o returnTo válido', async (path, pathname, returnTo) => {
  signupApi(() => reply(200, { enabled: false }))
  visit(path)
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(window.location.pathname).toBe(pathname)
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(returnTo)
  expect(screen.queryByRole('heading', { name: 'Criar sua conta' })).not.toBeInTheDocument()
})

it('com o cadastro ligado mostra o formulário sem rodapé e com título próprio', async () => {
  signupApi(() => reply(200, { enabled: true }))
  visit('/cadastro')
  expect(await screen.findByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeInTheDocument()
  await waitFor(() => expect(document.title).toBe('Criar conta · BestPrice'))
  expect(window.location.pathname).toBe('/cadastro')
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(screen.queryByText('Este endereço saiu do radar.')).not.toBeInTheDocument()
})

it('mostra carregando enquanto consulta o cadastro e alerta com nova tentativa quando falha', async () => {
  const first = deferred()
  let attempt = 0
  signupApi(() => ++attempt === 1 ? first.promise : reply(200, { enabled: true }))
  visit('/cadastro')
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^Carregando…$/))
  first.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível verificar o cadastro agora.')
  expect(window.location.pathname).toBe('/cadastro')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeInTheDocument()
})

// 0048/F6 (AC02): o cadastro inicia a sessão e segue ao destino, sem novo login.
function fillSignup(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: password } })
}

it.each([
  ['/cadastro', '/app/dashboard'],
  ['/cadastro?returnTo=%2Fapp%2Fassistant', '/app/assistant'],
  ['/cadastro?returnTo=%2F%2Fevil.example', '/app/dashboard'],
])('depois do cadastro em %s segue para %s sem chamar o login', async (path, destination) => {
  let signedUp = false
  const mockFetch = signupApi(() => reply(200, { enabled: true }), (url, init) => {
    if (url === '/api/auth/signup' && init?.method === 'POST') { signedUp = true; return reply(201, { id: 'user-9', email: 'ana@exemplo.com' }) }
    if (url === '/api/auth/me' && signedUp) return reply(200, { id: 'user-9', email: 'ana@exemplo.com' })
    return undefined
  })
  visit(path)
  await screen.findByRole('heading', { name: 'Criar sua conta', level: 1 })
  fillSignup('ana@exemplo.com', 'uma-senha-longa')
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => expect(window.location.pathname).toBe(destination))
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(0)
  expect(callsTo(mockFetch, '/api/auth/signup', 'POST')).toHaveLength(1)
})

it('do login com returnTo, o atalho Criar conta leva ao cadastro e volta com Entrar preservando o destino', async () => {
  signupApi(() => reply(200, { enabled: true }))
  visit('/login?returnTo=%2Fapp%2Fassistant')
  fireEvent.click(await screen.findByRole('link', { name: 'Criar conta' }))
  expect(await screen.findByRole('heading', { name: 'Criar sua conta', level: 1 })).toBeInTheDocument()
  expect(window.location.search).toBe('?returnTo=%2Fapp%2Fassistant')
  fireEvent.click(screen.getByRole('link', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/app/assistant')
})

it.each([
  ['/login?returnTo=%2Fapp%2Fmonitoring', '/app/monitoring'],
  ['/login', '/app/dashboard'],
  ['/login?returnTo=https%3A%2F%2Fevil.example', '/app/dashboard'],
])('leva quem já tem sessão de %s a %s', async (path, destination) => {
  fakeApi()
  visit(path)
  await waitFor(() => expect(window.location.pathname).toBe(destination))
  expect(window.location.search).toBe('')
  expect(screen.queryByRole('heading', { name: 'Entrar na sua conta' })).not.toBeInTheDocument()
})

// 0050/AC05: o link do hero atravessa o login sem ir à URL nem ao servidor antes da confirmação.
it('leva o link guardado na landing pelo login até o monitoramento, preenchido e com foco, sem enviá-lo', async () => {
  const link = 'https://produto.mercadolivre.com.br/MLB-4444444444-batedeira-_JM'
  savePendingTrackLink(link)
  const mockFetch = guestApi(() => reply(200, sessionUser))
  visit('/login?returnTo=%2Fapp%2Fmonitoring')
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'certa')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring'))
  const field = await screen.findByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
  expect(field).toHaveValue(link)
  await waitFor(() => expect(field).toHaveFocus())
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(field).toHaveFocus()
  expect(window.location.href).not.toContain('MLB-4444444444')
  expect(mockFetch.mock.calls.filter(([url, init]) => String(url).includes('MLB-4444444444')
    || String(init?.body ?? '').includes('MLB-4444444444'))).toHaveLength(0)
  expect(callsTo(mockFetch, '/api/tracked-products', 'POST')).toHaveLength(0)
  window.sessionStorage.clear()
})
