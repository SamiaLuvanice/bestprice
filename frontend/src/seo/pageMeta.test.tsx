import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, deferred, fakeApi, reply } from '../test/fakeApi'
import { pageMetaFor, usePageMeta } from './pageMeta'

// Textos da tabela "Textos" da spec 0051 (valores esperados escritos à mão, não importados).
const landingDescription = 'Monitore preços de produtos do Mercado Livre com a BestPrice. Acompanhe históricos, receba alertas de queda de preço e encontre o melhor momento para comprar.'
const loginDescription = 'Entre na sua conta BestPrice para ver seus anúncios do Mercado Livre monitorados, o histórico de preços e os alertas de queda.'
const signupDescription = 'Crie sua conta no BestPrice e comece a monitorar preços de anúncios do Mercado Livre colando apenas o link do produto.'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.head.querySelectorAll('link[rel="canonical"], meta[name="description"]').forEach((element) => element.remove())
})

const canonicalHref = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null
const descriptionContent = () => document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? null

// 0051/AC06: cada página pública tem canonical autorreferente absoluto e a descrição da spec.
it.each([
  ['/', false, 'https://bestprice-stage.pages.dev/', landingDescription],
  ['/login', false, 'https://bestprice-stage.pages.dev/login', loginDescription],
  ['/login/', false, 'https://bestprice-stage.pages.dev/login', loginDescription],
  ['/cadastro', true, 'https://bestprice-stage.pages.dev/cadastro', signupDescription],
])('pageMetaFor(%s, cadastro %s) declara canonical %s', (pathname, signupEnabled, canonical, description) => {
  expect(pageMetaFor(pathname, signupEnabled)).toEqual({ canonical, description })
})

it.each([
  ['/cadastro', false],
  ['/app', true],
  ['/app/dashboard', true],
  ['/produtos', true],
  ['/produtos/abc', true],
  ['/alertas', true],
  ['/pagina-que-nao-existe', true],
])('pageMetaFor(%s, cadastro %s) não declara canonical e usa a descrição da landing', (pathname, signupEnabled) => {
  expect(pageMetaFor(pathname, signupEnabled)).toEqual({ canonical: null, description: landingDescription })
})

it('usePageMeta cria, atualiza e remove o canonical conforme a rota', () => {
  const { rerender } = renderHook(({ pathname }) => usePageMeta(pathname, false), { initialProps: { pathname: '/' } })
  expect(canonicalHref()).toBe('https://bestprice-stage.pages.dev/')
  expect(descriptionContent()).toBe(landingDescription)

  rerender({ pathname: '/login' })
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
  expect(canonicalHref()).toBe('https://bestprice-stage.pages.dev/login')
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  expect(descriptionContent()).toBe(loginDescription)

  rerender({ pathname: '/app/dashboard' })
  expect(canonicalHref()).toBeNull()
  expect(descriptionContent()).toBe(landingDescription)
})

it('usePageMeta reaproveita a descrição já presente no HTML em vez de duplicar', () => {
  const existing = document.createElement('meta')
  existing.setAttribute('name', 'description')
  existing.setAttribute('content', landingDescription)
  document.head.append(existing)
  renderHook(() => usePageMeta('/login', false))
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  expect(existing.getAttribute('content')).toBe(loginDescription)
})

// 0051/AC06: o metadado de Entrar não espera a sessão — vale enquanto ela carrega e quando falha.
it.each(['pendente', 'HTTP 503', 'falha de rede'])('o App em /login declara canonical e descrição com a sessão %s', async (state) => {
  const session = deferred()
  fakeApi((url) => {
    if (url === '/api/auth/me') return session.promise
    if (url === '/api/auth/signup') return reply(200, { enabled: false })
    return undefined
  })
  window.history.replaceState({}, '', '/login')
  render(<App />)
  if (state === 'HTTP 503') session.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  if (state === 'falha de rede') session.reject(new TypeError('Failed to fetch'))
  if (state === 'pendente') expect(screen.getByRole('status')).toHaveTextContent('Carregando sua conta…')
  else expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  // O efeito do usePageMeta é passivo: pode rodar depois de o findBy* resolver.
  await waitFor(() => {
    expect(canonicalHref()).toBe('https://bestprice-stage.pages.dev/login')
    expect(descriptionContent()).toBe(loginDescription)
  })
})

it('o App em /cadastro com o cadastro ligado declara o canonical de Criar conta', async () => {
  fakeApi((url) => {
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    if (url === '/api/auth/signup') return reply(200, { enabled: true })
    return undefined
  })
  window.history.replaceState({}, '', '/cadastro')
  render(<App />)
  expect(await screen.findByRole('heading', { level: 1, name: 'Criar sua conta' })).toBeInTheDocument()
  await waitFor(() => {
    expect(canonicalHref()).toBe('https://bestprice-stage.pages.dev/cadastro')
    expect(descriptionContent()).toBe(signupDescription)
  })
})

// Navegação dentro da SPA: o canonical de Entrar existe e some ao chegar à página não encontrada.
it('o App remove o canonical ao navegar de /login para uma rota desconhecida', async () => {
  fakeApi((url) => url === '/api/auth/me' ? reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    : url === '/api/auth/signup' ? reply(200, { enabled: false }) : undefined)
  window.history.replaceState({}, '', '/login')
  render(<App />)
  expect(await screen.findByRole('heading', { level: 1, name: 'Entrar na sua conta' })).toBeInTheDocument()
  await waitFor(() => expect(canonicalHref()).toBe('https://bestprice-stage.pages.dev/login'))
  act(() => {
    window.history.pushState({}, '', '/pagina-que-nao-existe')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  expect(await screen.findByRole('heading', { level: 1, name: 'Este endereço saiu do radar.' })).toBeInTheDocument()
  await waitFor(() => {
    expect(canonicalHref()).toBeNull()
    expect(descriptionContent()).toBe(landingDescription)
  })
})
