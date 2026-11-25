import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, callsTo, deferred, fakeApi, reply, sessionUser } from './test/fakeApi'

// Spec 0061: telas do escopo com a API acordando (Render Free hibernado). Tempo sob timers falsos (AC15).
const NOTICE = 'Não conseguimos falar com o servidor agora. Ele pode estar iniciando; isso leva alguns segundos.'

// S6 (revisão): requestAnimationFrame também é falso, para o foco não depender do rAF do jsdom.
beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] }) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

async function advance(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

async function visit(path: string) {
  window.history.replaceState({}, '', path)
  render(<App />)
  await advance()
}

/** O 429 observado em Stage: sem corpo de erro da API (`x-render-routing: hibernate-rate-limited`). */
const hibernating = () => reply(429, {})
const noSession = () => reply(401, apiError('unauthenticated', 'Entre para continuar.'))

/** `me` responde, em ordem, cada item da lista; o último se repete. */
function sessionSequence(...answers: Array<() => unknown>) {
  let call = 0
  return () => answers[Math.min(call++, answers.length - 1)]()
}

function wakingApi(options: { me: () => unknown; signup?: () => unknown; login?: () => unknown }) {
  return fakeApi((url, init) => {
    const method = init?.method ?? 'GET'
    if (url === '/api/auth/me') return options.me()
    if (url === '/api/auth/signup' && method === 'GET' && options.signup) return options.signup()
    if (url === '/api/auth/login' && method === 'POST' && options.login) return options.login()
    return undefined
  })
}

const notice = () => screen.queryByText(NOTICE)
const loginHeading = () => screen.queryByRole('heading', { name: 'Entrar na sua conta', level: 1 })

describe('Entrar (/login)', () => {
  it('AC01/AC02: falha de sessão mostra o formulário e o aviso como status, sem "Tentar novamente"', async () => {
    wakingApi({ me: hibernating })
    await visit('/login')
    expect(loginHeading()).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(notice()).toBeInTheDocument()
    expect(notice()?.closest('[role="status"]')).not.toBeNull()
    expect(notice()?.closest('[role="alert"]')).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await advance(16)
    expect(loginHeading()).toHaveFocus()
  })

  it('AC01: sem resposta por 5 s, o formulário aparece com o aviso', async () => {
    const pending = deferred()
    const mockFetch = wakingApi({ me: () => pending.promise })
    await visit('/login')
    await advance(4_999)
    expect(screen.getByText('Carregando sua conta…')).toBeInTheDocument()
    expect(loginHeading()).not.toBeInTheDocument()
    await advance(1)
    expect(loginHeading()).toBeInTheDocument()
    expect(notice()).toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
  })

  it('AC03: sessão encontrada numa nova tentativa leva ao destino mesmo durante a digitação', async () => {
    wakingApi({ me: sessionSequence(hibernating, () => reply(200, sessionUser)) })
    await visit('/login?returnTo=%2Fprodutos')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@exa' } })
    await advance(2_000)
    expect(window.location.pathname).toBe('/produtos')
    expect(loginHeading()).not.toBeInTheDocument()
  })

  it('AC04: 401 numa nova tentativa remove o aviso, para as tentativas e preserva o que foi digitado', async () => {
    const mockFetch = wakingApi({ me: sessionSequence(hibernating, noSession) })
    await visit('/login')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo' } })
    await advance(2_000)
    expect(notice()).not.toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
    expect(screen.getByLabelText('Senha')).toHaveValue('segredo')
    await advance(60_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
  })

  it('AC05: envio com resposta da API acordada mostra o erro atual, remove o aviso e para as tentativas', async () => {
    const mockFetch = wakingApi({
      me: hibernating,
      login: () => reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')),
    })
    await visit('/login')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await advance()
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(notice()).not.toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
    await advance(60_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
  })

  it('AC05: envio que também falha por indisponibilidade mantém o aviso e as tentativas', async () => {
    const mockFetch = wakingApi({ me: hibernating, login: hibernating })
    await visit('/login')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'certa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await advance()
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a operação. Tente novamente.')
    expect(notice()).toBeInTheDocument()
    await advance(2_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
  })

  it('AC05: login bem-sucedido não é desfeito por uma verificação atrasada', async () => {
    const lateSession = deferred()
    const mockFetch = wakingApi({ me: () => lateSession.promise, login: () => reply(200, sessionUser) })
    await visit('/login')
    await advance(5_000)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'certa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await advance()
    expect(window.location.pathname).toBe('/app/dashboard')
    await act(async () => { lateSession.resolve(noSession()) })
    await advance(60_000)
    expect(window.location.pathname).toBe('/app/dashboard')
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
  })

  it('AC06: fim da janela mantém o formulário e o aviso, sem tela de erro', async () => {
    const mockFetch = wakingApi({ me: hibernating })
    await visit('/login')
    await advance(60_000)
    expect(loginHeading()).toBeInTheDocument()
    expect(notice()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(7)
    await advance(60_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(7)
  })

  it('AC07: o link Criar conta aparece sem recarregar quando o cadastro é confirmado na janela', async () => {
    wakingApi({ me: noSession, signup: sessionSequence(hibernating, () => reply(200, { enabled: true })) })
    await visit('/login')
    expect(loginHeading()).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument()
    await advance(2_000)
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })

  it('erro definitivo da sessão (4xx com envelope) mantém o erro atual sem novas tentativas', async () => {
    const mockFetch = wakingApi({ me: () => reply(403, apiError('forbidden', 'Acesso negado.')) })
    await visit('/login')
    expect(screen.getByRole('alert')).toHaveTextContent('Acesso negado.')
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(notice()).not.toBeInTheDocument()
    await advance(60_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
  })

  it('AC14: com a API respondendo rápido, 401 mostra o login sem aviso e sessão válida segue ao destino', async () => {
    wakingApi({ me: noSession })
    await visit('/login')
    expect(loginHeading()).toBeInTheDocument()
    expect(notice()).not.toBeInTheDocument()
    cleanup()
    wakingApi({ me: () => reply(200, sessionUser) })
    await visit('/login?returnTo=%2Falertas')
    expect(window.location.pathname).toBe('/alertas')
    expect(notice()).not.toBeInTheDocument()
  })
})

function navigateTo(path: string) {
  act(() => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

const signupHeading = () => screen.queryByRole('heading', { name: 'Criar sua conta', level: 1 })
const SIGNUP_ERROR = 'Não foi possível verificar o cadastro agora. Tente novamente.'

describe('Criar conta (/cadastro)', () => {
  it('AC08: espera sem clique com "Carregando…" e aviso; o formulário aparece quando o cadastro é confirmado', async () => {
    wakingApi({ me: hibernating, signup: sessionSequence(hibernating, () => reply(200, { enabled: true })) })
    await visit('/cadastro')
    expect(screen.getByText(/^Carregando…$/)).toBeInTheDocument()
    expect(notice()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await advance(2_000)
    expect(signupHeading()).toBeInTheDocument()
    expect(window.location.pathname).toBe('/cadastro')
  })

  it('AC08: sessão encontrada depois leva ao destino', async () => {
    wakingApi({ me: sessionSequence(hibernating, () => reply(200, sessionUser)), signup: () => reply(200, { enabled: true }) })
    await visit('/cadastro?returnTo=%2Falertas')
    expect(signupHeading()).toBeInTheDocument()
    await advance(2_000)
    expect(window.location.pathname).toBe('/alertas')
  })

  it('AC08: cadastro informado como desligado leva ao login', async () => {
    wakingApi({ me: hibernating, signup: sessionSequence(hibernating, () => reply(200, { enabled: false })) })
    await visit('/cadastro')
    await advance(2_000)
    expect(window.location.pathname).toBe('/login')
    expect(loginHeading()).toBeInTheDocument()
  })

  it('AC09: fim da janela mostra o erro do cadastro; "Tentar novamente" abre nova janela', async () => {
    let awake = false
    const mockFetch = wakingApi({ me: noSession, signup: () => awake ? reply(200, { enabled: true }) : hibernating() })
    await visit('/cadastro')
    await advance(59_999)
    expect(screen.queryByText(SIGNUP_ERROR)).not.toBeInTheDocument()
    await advance(1)
    expect(screen.getByRole('alert')).toHaveTextContent(SIGNUP_ERROR)
    expect(callsTo(mockFetch, '/api/auth/signup')).toHaveLength(7)
    awake = true
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await advance()
    expect(callsTo(mockFetch, '/api/auth/signup')).toHaveLength(8)
    expect(signupHeading()).toBeInTheDocument()
  })
})

describe('Áreas logadas', () => {
  it('AC10: continua em "Carregando sua conta…" com o aviso e abre a área quando encontra a sessão', async () => {
    wakingApi({ me: sessionSequence(hibernating, () => reply(200, sessionUser)) })
    await visit('/produtos')
    expect(screen.getByText('Carregando sua conta…')).toBeInTheDocument()
    expect(notice()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    await advance(2_000)
    expect(screen.getByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
    expect(notice()).not.toBeInTheDocument()
  })

  it('AC10: 401 numa nova tentativa leva ao login com returnTo', async () => {
    wakingApi({ me: sessionSequence(hibernating, noSession) })
    await visit('/produtos/tracking-1')
    await advance(2_000)
    expect(window.location.pathname).toBe('/login')
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/produtos/tracking-1')
  })

  it('AC11: fim da janela mostra o erro atual; "Tentar novamente" abre nova janela', async () => {
    let awake = false
    const mockFetch = wakingApi({ me: () => awake ? reply(200, sessionUser) : hibernating() })
    await visit('/alertas')
    await advance(59_999)
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    await advance(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a operação. Tente novamente.')
    expect(notice()).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(7)
    awake = true
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await advance()
    expect(screen.getByRole('heading', { name: 'Alertas', level: 1 })).toBeInTheDocument()
  })
})

describe('Navegação durante a janela (AC13)', () => {
  it('do login para o cadastro, a janela em curso continua sem reiniciar', async () => {
    const mockFetch = wakingApi({ me: hibernating, signup: () => reply(200, { enabled: true }) })
    await visit('/login')
    await advance(2_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
    navigateTo('/cadastro')
    await advance()
    expect(signupHeading()).toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
    await advance(4_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(3)
  })

  it('na landing as tentativas param; de volta ao login, uma nova janela começa', async () => {
    const mockFetch = wakingApi({ me: hibernating })
    await visit('/login')
    navigateTo('/')
    await advance(120_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
    navigateTo('/login')
    await advance()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
    expect(notice()).toBeInTheDocument()
    await advance(2_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(3)
  })

  it('em rota inexistente as tentativas param', async () => {
    const mockFetch = wakingApi({ me: hibernating })
    await visit('/produtos')
    navigateTo('/pagina-que-nao-existe')
    await advance(120_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeInTheDocument()
  })

  it('AC13/AC14: voltar pelo histórico (pageshow persistido) refaz a verificação desde o início', async () => {
    let signedIn = true
    const mockFetch = wakingApi({ me: () => signedIn ? reply(200, sessionUser) : noSession() })
    await visit('/produtos')
    expect(screen.getByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
    signedIn = false
    act(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })) })
    await advance()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(2)
    expect(window.location.pathname).toBe('/login')
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/produtos')
  })
})

describe('Correções pós-revisão e QA', () => {
  it('I1: senha errada durante uma verificação lenta não impede um 200 tardio de levar ao destino', async () => {
    const lateSession = deferred()
    wakingApi({
      me: () => lateSession.promise,
      login: () => reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')),
    })
    await visit('/login?returnTo=%2Falertas')
    await advance(5_000)
    expect(notice()).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await advance()
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(notice()).not.toBeInTheDocument()
    await act(async () => { lateSession.resolve(reply(200, sessionUser)) })
    await advance()
    expect(window.location.pathname).toBe('/alertas')
  })

  it('AC05: 429 de limite de login (com envelope) durante a janela mostra a espera, remove o aviso e para as tentativas', async () => {
    const mockFetch = wakingApi({
      me: hibernating,
      login: () => reply(429, apiError('login_rate_limited', 'Muitas tentativas de login. Tente novamente mais tarde.', { retry_after_seconds: 900 })),
    })
    await visit('/login')
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await advance()
    expect(screen.getByRole('alert')).toHaveTextContent('Muitas tentativas de login. Tente novamente em 15 minutos.')
    expect(notice()).not.toBeInTheDocument()
    await advance(60_000)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(1)
  })

  it('AC09 (desvio): "Tentar novamente" do cadastro reabre também a sessão esgotada', async () => {
    const mockFetch = wakingApi({ me: hibernating, signup: hibernating })
    await visit('/cadastro')
    await advance(60_000)
    expect(screen.getByRole('alert')).toHaveTextContent(SIGNUP_ERROR)
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(7)
    expect(callsTo(mockFetch, '/api/auth/signup')).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await advance()
    expect(callsTo(mockFetch, '/api/auth/me')).toHaveLength(8)
    expect(callsTo(mockFetch, '/api/auth/signup')).toHaveLength(8)
  })

  it('I2: no login, o status é um contêiner estável; o aviso entra e sai sem trocar o elemento', async () => {
    wakingApi({ me: sessionSequence(hibernating, noSession) })
    await visit('/login')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(NOTICE)
    await advance(2_000)
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toBeEmptyDOMElement()
  })

  it('I2: sem indisponibilidade, o login já tem o contêiner de status vazio', async () => {
    wakingApi({ me: noSession })
    await visit('/login')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('I2: em "Carregando sua conta…" há um único status, que passa a incluir o aviso', async () => {
    const pending = deferred()
    wakingApi({ me: () => pending.promise })
    await visit('/produtos')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Carregando sua conta…')
    await advance(5_000)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Carregando sua conta…')
    expect(status).toHaveTextContent(NOTICE)
  })

  it('I2: no cadastro em espera há um único status com "Carregando…" e o aviso', async () => {
    wakingApi({ me: hibernating, signup: hibernating })
    await visit('/cadastro')
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE)
  })
})
