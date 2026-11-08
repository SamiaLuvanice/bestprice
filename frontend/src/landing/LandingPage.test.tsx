import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'
import { takePendingTrackLink } from '../navigation/pendingTrackLink'
import { stubLandingEnvironment } from './landingTestEnv'

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

type Props = { authenticated?: boolean; signupAvailable?: boolean }

function renderLanding(props: Props = {}) {
  return render(<MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<><LandingPage {...props} /><Where /></>} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>)
}

const fetchSpy = vi.fn()

beforeEach(() => {
  stubLandingEnvironment()
  vi.stubGlobal('fetch', fetchSpy)
  fetchSpy.mockReset()
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.sessionStorage.clear()
})

// 0050/AC03: matriz "Para onde cada ação leva". Sessão e cadastro indeterminados (carregando ou
// com falha) chegam à landing como false (decisão da spec), por isso viram a linha "desligado".
const signupMonitoring = '/cadastro?returnTo=%2Fapp%2Fmonitoring'
const loginMonitoring = '/login?returnTo=%2Fapp%2Fmonitoring'
const matrix: [string, Props, string, string][] = [
  ['sem sessão, cadastro ligado', { authenticated: false, signupAvailable: true }, signupMonitoring, '/login'],
  ['sem sessão, cadastro desligado', { authenticated: false, signupAvailable: false }, loginMonitoring, '/login'],
  ['sem sessão, cadastro carregando ou com falha (props omitidas)', {}, loginMonitoring, '/login'],
  ['com sessão, cadastro ligado', { authenticated: true, signupAvailable: true }, '/app/monitoring', '/app/dashboard'],
  ['com sessão, cadastro desligado', { authenticated: true, signupAvailable: false }, '/app/monitoring', '/app/dashboard'],
]

describe.each(matrix)('destinos — %s', (_case, props, monitorTarget, loginTarget) => {
  it('as ações de monitorar levam ao destino da tabela', () => {
    renderLanding(props)
    const monitorLinks = [
      ...screen.getAllByRole('link', { name: /^Começar a monitorar/ }),
      ...screen.getAllByRole('link', { name: /^Começar$/ }),
      ...screen.getAllByRole('link', { name: /^Monitorar um anúncio/ }),
    ]
    expect(monitorLinks.length).toBeGreaterThanOrEqual(4)
    for (const link of monitorLinks) expect(link).toHaveAttribute('href', monitorTarget)
  })

  it('Entrar e Já tenho conta levam ao destino da tabela, sem returnTo', () => {
    renderLanding(props)
    const loginLinks = [...screen.getAllByRole('link', { name: /^Entrar$/ }), ...screen.getAllByRole('link', { name: /^Já tenho conta$/ })]
    expect(loginLinks.length).toBeGreaterThanOrEqual(3)
    for (const link of loginLinks) expect(link).toHaveAttribute('href', loginTarget)
  })

  it('Monitorar preço com link guarda o link aparado e navega para o destino da tabela', async () => {
    renderLanding(props)
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /link do anúncio/i }), '  https://produto.mercadolivre.com.br/MLB-123  ')
    await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
    expect(screen.getByTestId('where')).toHaveTextContent(monitorTarget)
    expect(takePendingTrackLink()).toBe('https://produto.mercadolivre.com.br/MLB-123')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

it('âncoras do cabeçalho e do rodapé rolam até a seção, sem sair da página', () => {
  renderLanding()
  const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
  const anchors: [string, string][] = [['Como funciona', '#como-funciona'], ['Demonstração', '#demonstracao'], ['Assistente', '#assistente'], ['Perguntas', '#perguntas']]
  for (const [name, href] of anchors) {
    expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href)
    expect(document.querySelector(href)).not.toBeNull()
  }
  const footer = screen.getByRole('contentinfo')
  for (const [name, href] of [['Como funciona', '#como-funciona'], ['Assistente', '#assistente'], ['Perguntas', '#perguntas']]) {
    expect(within(footer).getByRole('link', { name })).toHaveAttribute('href', href)
  }
})

// 0050/AC06: vazio ou só espaços mostra a mensagem associada ao campo e não sai da página.
it.each([['vazio', ''], ['só com espaços', '    ']])('campo %s mostra a mensagem junto ao campo e não navega', async (_case, typed) => {
  renderLanding({ authenticated: true })
  const user = userEvent.setup()
  const field = screen.getByRole('textbox', { name: /link do anúncio/i })
  if (typed) await user.type(field, typed)
  await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(field).toHaveAccessibleDescription(/Informe o link completo de um anúncio do Mercado Livre Brasil\./)
  expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  expect(takePendingTrackLink()).toBeNull()
  // Corrigir o campo e enviar de novo segue normalmente.
  await user.type(field, 'https://produto.mercadolivre.com.br/MLB-9')
  await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
  expect(screen.getByTestId('where')).toHaveTextContent('/app/monitoring')
})

it('um novo envio no hero substitui o link anterior', async () => {
  const user = userEvent.setup()
  const first = renderLanding({ authenticated: true })
  await user.type(screen.getByRole('textbox', { name: /link do anúncio/i }), 'https://a.mercadolivre.com.br/MLB-1')
  await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
  first.unmount()
  renderLanding({ authenticated: true })
  await user.type(screen.getByRole('textbox', { name: /link do anúncio/i }), 'https://b.mercadolivre.com.br/MLB-2')
  await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
  expect(takePendingTrackLink()).toBe('https://b.mercadolivre.com.br/MLB-2')
})
