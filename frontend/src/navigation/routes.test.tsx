import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../App'
import { alertFixture, apiError, dashboardFixture, deferred, fakeApi, notificationFixture, reply, trackedFixture } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
  vi.unstubAllGlobals()
})

function visit(path: string) {
  window.history.replaceState({}, '', path)
  render(<App />)
}

it('abre o detalhe pela URL sem carregar dashboard e mantém Produtos ativo', async () => {
  const item = trackedFixture()
  const fetch = fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ir para Produtos' })).toHaveAttribute('href', '/produtos')
  expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('aria-current', 'page')
  expect(fetch.mock.calls.some(([url]) => url === '/api/dashboard')).toBe(false)
})

it('preserva o destino protegido durante login e recarga', async () => {
  const fetch = fakeApi((url, init) => {
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    if (url === '/api/auth/login' && init?.method === 'POST') return reply(200, { id: 'user-1', email: 'pessoa@example.com' })
    if (url === '/api/tracked-products/tracking-1') return reply(200, trackedFixture())
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  await screen.findByRole('button', { name: 'Entrar' })
  expect(window.location.pathname).toBe('/login')
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/produtos/tracking-1')
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-mail'), 'pessoa@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha-segura')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos/tracking-1')
  expect(fetch.mock.calls.some(([url]) => url === '/api/tracked-products/tracking-1')).toBe(true)
})

it('erro temporário da sessão mantém a URL e permite tentar novamente', async () => {
  let attempts = 0
  fakeApi((url) => {
    if (url === '/api/auth/me') {
      attempts += 1
      return attempts === 1 ? reply(503, apiError('unavailable', 'Serviço indisponível.'))
        : reply(200, { id: 'user-1', email: 'pessoa@example.com' })
    }
    return undefined
  }, dashboardFixture())
  visit('/produtos')
  expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível.')
  expect(window.location.pathname).toBe('/produtos')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/produtos')
})

it('detalhe inexistente mostra mensagem segura e link para Produtos', async () => {
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(404, apiError('not_found', 'Outro usuário.'))
    if (url === '/api/tracked-products/tracking-1/history') return reply(404, apiError('not_found', 'Outro usuário.'))
    return undefined
  })
  visit('/produtos/tracking-1')
  expect(await screen.findByRole('alert')).toHaveTextContent('Produto não encontrado ou indisponível.')
  expect(screen.queryByText('Outro usuário.')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ir para Produtos' })).toHaveAttribute('href', '/produtos')
})

it('alertas percorrem página vazia intermediária até alcançar o próximo alerta', async () => {
  const first = trackedFixture({}, { id: 'tracking-1', alert: alertFixture({ target_price: '80.00', enabled: true }) })
  const middle = trackedFixture({}, { id: 'tracking-2', alert: null })
  const last = trackedFixture({}, { id: 'tracking-3', alert: alertFixture({ target_price: '60.00', enabled: false }) })
  fakeApi((url) => {
    if (url === '/api/tracked-products') return reply(200, { items: [first], next_cursor: 'page-2' })
    if (url === '/api/tracked-products?cursor=page-2') return reply(200, { items: [middle], next_cursor: 'page-3' })
    if (url === '/api/tracked-products?cursor=page-3') return reply(200, { items: [last], next_cursor: null })
    return undefined
  })
  visit('/alertas')
  expect(await screen.findByText('Alvo: R$ 80,00')).toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Carregar mais alertas' }))
  await waitFor(() => expect(screen.getByText('Alvo: R$ 60,00')).toBeInTheDocument())
  expect(screen.getByText('Pausado')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Carregar mais alertas' })).not.toBeInTheDocument()
})

it('detalhe interrompido mantém histórico e oculta ações de monitoramento', async () => {
  const inactive = trackedFixture({}, { active: false })
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, inactive)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  expect(await screen.findByText('Monitoramento interrompido.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Histórico de preços' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Atualizar agora' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Criar alerta' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Parar de monitorar' })).not.toBeInTheDocument()
})

it('confirma interrupção no detalhe e leva a Produtos com foco na lista', async () => {
  const first = trackedFixture()
  const other = trackedFixture({ title: 'Cafeteira' }, { id: 'tracking-2' })
  let stopped = false
  fakeApi((url, init) => {
    if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') {
      stopped = true
      return reply(204, null)
    }
    if (url === '/api/tracked-products/tracking-1') return reply(200, first)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: stopped ? [other] : [first, other] }))
    return undefined
  })
  visit('/produtos/tracking-1')
  await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Parar de monitorar “Fone sem fio”?')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(window.location.pathname).toBe('/produtos/tracking-1')
  expect(screen.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
  await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
  expect(screen.getByTestId('global-status')).toHaveTextContent('Você parou de monitorar este produto.')
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
})

it('falha ao interromper mantém detalhe, URL e foco na ação', async () => {
  fakeApi((url, init) => {
    if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE')
      return reply(503, apiError('unavailable', 'Não foi possível parar agora.'))
    if (url === '/api/tracked-products/tracking-1') return reply(200, trackedFixture())
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos/tracking-1')
  await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível parar agora.')
  expect(window.location.pathname).toBe('/produtos/tracking-1')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Parar de monitorar' })).toHaveFocus())
})

it('login ignora retorno externo e não entra em ciclo com /login', async () => {
  fakeApi((url, init) => {
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre.'))
    if (url === '/api/auth/login' && init?.method === 'POST') return reply(200, { id: 'user-1', email: 'pessoa@example.com' })
    return undefined
  }, dashboardFixture())
  visit('/login?returnTo=https%3A%2F%2Fexample.com')
  const user = userEvent.setup()
  await screen.findByRole('button', { name: 'Entrar' })
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Entrar na sua conta' })).toHaveFocus())
  await user.click(screen.getByLabelText('E-mail'))
  await user.type(screen.getByLabelText('E-mail'), 'pessoa@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha-segura')
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(window.location.pathname).toBe('/'))
  expect(await screen.findByRole('heading', { name: 'Seu painel de preços' })).toBeInTheDocument()
})

it('abrir notificação navega ao monitoramento sem marcá-la como lida', async () => {
  const fetch = fakeApi((url, init) => {
    if (url === '/api/tracked-products') return reply(200, { items: [], next_cursor: null })
    if (url === '/api/notifications') return reply(200, { items: [notificationFixture('notice-1')], next_cursor: null })
    if (url === '/api/tracked-products/tracking-1') return reply(200, trackedFixture())
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    if (init?.method === 'PATCH') throw new Error('Abrir notificação não deve marcá-la como lida')
    return undefined
  })
  visit('/alertas')
  await screen.findByRole('link', { name: 'Abrir produto' })
  await userEvent.setup().click(screen.getByRole('link', { name: 'Abrir produto' }))
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(fetch.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
})

it('401 no detalhe preserva o endereço como retorno após login', async () => {
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(401, apiError('unauthenticated', 'Sessão encerrada.'))
    if (url === '/api/tracked-products/tracking-1/history') return reply(401, apiError('unauthenticated', 'Sessão encerrada.'))
    return undefined
  })
  visit('/produtos/tracking-1')
  await screen.findByRole('button', { name: 'Entrar' })
  expect(window.location.pathname).toBe('/login')
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/produtos/tracking-1')
})

it('logout limpa a área da conta e substitui a URL por login', async () => {
  fakeApi((url, init) => url === '/api/auth/logout' && init?.method === 'POST' ? reply(204, null) : undefined,
    dashboardFixture())
  visit('/produtos')
  const heading = await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })
  await waitFor(() => expect(heading).toHaveFocus())
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Conta:.*pessoa@example.com/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
  expect(window.location.search).toBe('')
  expect(screen.queryByText('pessoa@example.com')).not.toBeInTheDocument()
})

it('falha em página adicional de alertas mantém itens e permite retomar do cursor', async () => {
  const first = trackedFixture({}, { id: 'tracking-1', alert: alertFixture({ target_price: '80.00' }) })
  const last = trackedFixture({}, { id: 'tracking-3', alert: alertFixture({ target_price: '60.00' }) })
  let pageTwoCalls = 0
  fakeApi((url) => {
    if (url === '/api/tracked-products') return reply(200, { items: [first], next_cursor: 'page-2' })
    if (url === '/api/tracked-products?cursor=page-2') {
      pageTwoCalls += 1
      return pageTwoCalls === 1 ? reply(503, apiError('unavailable', 'Lista indisponível.'))
        : reply(200, { items: [], next_cursor: 'page-3' })
    }
    if (url === '/api/tracked-products?cursor=page-3') return reply(200, { items: [last], next_cursor: null })
    return undefined
  })
  visit('/alertas')
  await screen.findByText('Alvo: R$ 80,00')
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Carregar mais alertas' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Lista indisponível.')
  expect(screen.getByText('Alvo: R$ 80,00')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('Alvo: R$ 60,00')).toBeInTheDocument()
  expect(pageTwoCalls).toBe(2)
})

it('navegação entre Início, Produtos, detalhe e Alertas acompanha o histórico', async () => {
  const item = trackedFixture()
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    if (url === '/api/tracked-products') return reply(200, { items: [item], next_cursor: null })
    return undefined
  }, dashboardFixture({ items: [item] }))
  visit('/')
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Seu painel de preços' })
  await user.click(screen.getByRole('link', { name: 'Produtos' }))
  expect(await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Alertas' }))
  expect(await screen.findByRole('heading', { name: 'Alertas', level: 1 })).toBeInTheDocument()
  window.history.back()
  await waitFor(() => expect(window.location.pathname).toBe('/produtos/tracking-1'))
  expect(await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('aria-current', 'page')
  window.history.back()
  await waitFor(() => expect(window.location.pathname).toBe('/produtos'))
  expect(await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })).toBeInTheDocument()
})

it('descarta página de histórico de A quando a pessoa já abriu B', async () => {
  const first = trackedFixture({}, { id: 'tracking-1' })
  const second = trackedFixture({ title: 'Cafeteira' }, { id: 'tracking-2' })
  const slowPage = deferred<ReturnType<typeof reply>>()
  fakeApi((url) => {
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: [first, second] }))
    if (url === '/api/tracked-products/tracking-1') return reply(200, first)
    if (url === '/api/tracked-products/tracking-2') return reply(200, second)
    if (url === '/api/tracked-products/tracking-1/history')
      return reply(200, { items: [], next_cursor: 'next-a' })
    if (url === '/api/tracked-products/tracking-1/history?cursor=next-a') return slowPage.promise
    if (url === '/api/tracked-products/tracking-2/history')
      return reply(200, { items: [{ id: 'b1', price: '42.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' }], next_cursor: null })
    return undefined
  })
  visit('/produtos')
  const user = userEvent.setup()
  await screen.findByRole('link', { name: 'Ver detalhes de Fone sem fio' })
  await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
  await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })
  await user.click(screen.getByRole('button', { name: 'Carregar mais preços' }))
  await user.click(screen.getByRole('link', { name: 'Produtos' }))
  await user.click(await screen.findByRole('link', { name: 'Ver detalhes de Cafeteira' }))
  expect(await screen.findByRole('heading', { name: 'Cafeteira', level: 1 })).toBeInTheDocument()
  await act(async () => { slowPage.resolve(reply(200, {
    items: [{ id: 'a-late', price: '1.00', currency: 'BRL', captured_at: '2026-10-08T12:00:00Z' }],
    next_cursor: null,
  })); await slowPage.promise })
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Cafeteira', level: 1 })).toBeInTheDocument())
  expect(screen.getByText(/R\$ 42,00/)).toBeInTheDocument()
  expect(screen.queryByText(/R\$ 1,00/)).not.toBeInTheDocument()
})

it('resposta tardia de parar A não navega para Produtos quando B está aberto', async () => {
  const first = trackedFixture({}, { id: 'tracking-1' })
  const second = trackedFixture({ title: 'Cafeteira' }, { id: 'tracking-2' })
  const slowStop = deferred<ReturnType<typeof reply>>()
  fakeApi((url, init) => {
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: [first, second] }))
    if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') return slowStop.promise
    if (url === '/api/tracked-products/tracking-1') return reply(200, first)
    if (url === '/api/tracked-products/tracking-2') return reply(200, second)
    if (url.endsWith('/history')) return reply(200, { items: [], next_cursor: null })
    return undefined
  })
  visit('/produtos')
  const user = userEvent.setup()
  await screen.findByRole('link', { name: 'Ver detalhes de Fone sem fio' })
  await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
  await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })
  await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
  window.history.back()
  await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })
  await user.click(screen.getByRole('link', { name: 'Ver detalhes de Cafeteira' }))
  expect(await screen.findByRole('heading', { name: 'Cafeteira', level: 1 })).toBeInTheDocument()
  await act(async () => { slowStop.resolve(reply(204, null)); await slowStop.promise })
  await waitFor(() => expect(window.location.pathname).toBe('/produtos/tracking-2'))
  expect(screen.getByRole('heading', { name: 'Cafeteira', level: 1 })).toBeInTheDocument()
})

it('resposta tardia de parar não restaura área protegida após logout', async () => {
  const first = trackedFixture()
  const slowStop = deferred<ReturnType<typeof reply>>()
  fakeApi((url, init) => {
    if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: [first] }))
    if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') return slowStop.promise
    if (url === '/api/tracked-products/tracking-1') return reply(200, first)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    if (url === '/api/auth/logout' && init?.method === 'POST') return reply(204, null)
    return undefined
  })
  visit('/produtos')
  const user = userEvent.setup()
  await screen.findByRole('link', { name: 'Ver detalhes de Fone sem fio' })
  await user.click(screen.getByRole('link', { name: 'Ver detalhes de Fone sem fio' }))
  await screen.findByRole('heading', { name: 'Fone sem fio', level: 1 })
  await user.click(screen.getByRole('button', { name: 'Parar de monitorar' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
  window.history.back()
  await screen.findByRole('heading', { name: 'Seus produtos', level: 1 })
  await user.click(screen.getByRole('button', { name: /Conta:.*pessoa@example.com/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  await screen.findByRole('heading', { name: 'Entrar na sua conta' })
  await act(async () => { slowStop.resolve(reply(204, null)); await slowStop.promise })
  await waitFor(() => expect(window.location.pathname).toBe('/login'))
  expect(screen.queryByRole('heading', { name: 'Seus produtos', level: 1 })).not.toBeInTheDocument()
})
