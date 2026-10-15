import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, callsTo, dashboardWith, deferred, fakeApi, productUrl, notificationFixture, reply, sessionUser, trackedFixture as trackedItem, type Route } from './test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function submitUrl() {
  fireEvent.change(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...'), { target: { value: productUrl } })
  fireEvent.click(screen.getByRole('button', { name: 'Monitorar preço' }))
}

// Pessoa autenticada com o dublê compartilhado (src/test/fakeApi.ts), que também responde às não lidas do sino.
const signedIn = fakeApi

// 0019/AC01: no estado de visitante o cabeçalho de marca não precede o login.
it('não mostra o cabeçalho de marca ao visitante', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, {
    error: { code: 'unauthenticated', message: 'Entre para continuar.' },
  })))
  render(<App />)
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  expect(screen.queryByRole('banner')).not.toBeInTheDocument()
})

// 0019/AC01: no estado de visitante o formulário de link não precede o login.
it('não mostra o formulário de monitoramento por link ao visitante', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, {
    error: { code: 'unauthenticated', message: 'Entre para continuar.' },
  })))
  render(<App />)
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Acompanhe o preço. Compre na hora certa.' })).not.toBeInTheDocument()
  expect(screen.queryByPlaceholderText('https://www.mercadolivre.com.br/...')).not.toBeInTheDocument()
})

// 0019/AC01: o primeiro elemento do main é a área de login.
it('tem o login como primeiro elemento do conteúdo principal do visitante', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, {
    error: { code: 'unauthenticated', message: 'Entre para continuar.' },
  })))
  render(<App />)
  await screen.findByRole('button', { name: 'Entrar' })
  const first = screen.getByRole('main').firstElementChild
  expect(first).not.toBeNull()
  expect(first).toContainElement(screen.getByLabelText('E-mail'))
  expect(first).toHaveAccessibleName('Bem-vindo de volta')
})

// 0019/AC02: "Bem-vindo de volta" é o único h1 e nenhum h2 o antecede.
it('tem Bem-vindo de volta como único título de nível 1, sem h2 anterior', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, {
    error: { code: 'unauthenticated', message: 'Entre para continuar.' },
  })))
  const { container } = render(<App />)
  await screen.findByRole('button', { name: 'Entrar' })
  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Bem-vindo de volta'])
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  expect(headings[0].tagName).toBe('H1')
})

// 0019/AC04: as telas de carregamento e de sessão indisponível mantêm o visual atual.
it('mantém cabeçalho e hero enquanto verifica a sessão e quando ela está indisponível', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.'))))
  render(<App />)
  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Acompanhe o preço. Compre na hora certa.' })).toBeInTheDocument()
  expect(screen.getByPlaceholderText('https://www.mercadolivre.com.br/...')).toBeInTheDocument()
  expect(await screen.findByText('Serviço temporariamente indisponível.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
})

it('mostra a logo oficial inteira e com nome acessível enquanto verifica a sessão', () => {
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)))
  render(<App />)
  const logos = within(screen.getByRole('banner')).getAllByRole('img', { name: 'BestPrice' })
  expect(logos).toHaveLength(1)
  expect(logos[0].getAttribute('src')).toContain('logo-bestprice.png')
})

it('mostra bloqueio real da integração sem criar sucesso fictício nem encerrar a sessão', async () => {
  const backendMessage = 'Cadastro indisponível até a autorização da integração com o Mercado Livre.'
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(503, apiError('integration_not_configured', backendMessage))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  expect(screen.queryByText(/integração oficial autorizada/i)).not.toBeInTheDocument()
  submitUrl()
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(backendMessage))
  expect(screen.getByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
})

it('mostra anúncio persistido, detalhe e histórico recebidos da API', async () => {
  const item = trackedItem()
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, {
      items: [
        { id: 'event-1', price: '100.00', currency: 'BRL', captured_at: '2026-10-08T10:00:00Z' },
        { id: 'event-2', price: '80.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' },
      ], next_cursor: null,
    })
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver anúncio no Mercado Livre/ })).toHaveAttribute('href', item.product.canonical_url)
  expect(screen.getByText(/Menor: R\$\s*80,00/)).toBeInTheDocument()
})

it('carrega páginas adicionais de histórico e notificações sem repetir entradas', async () => {
  const item = trackedItem({ previous_price: null, max_price: '80.00', absolute_change: null, percentage_change: null, price_changed_at: null })
  const notification = (id: string) => notificationFixture(id)
  const history = (id: string) => ({ id, price: '80.00', currency: 'BRL', captured_at: '2026-10-08T11:00:00Z' })
  const mockFetch = fakeApi((url) => {
    if (url === '/api/notifications') return reply(200, { items: [notification('notice-1')], next_cursor: 'notice-page-2' })
    if (url === '/api/notifications?cursor=notice-page-2') return reply(200, { items: [notification('notice-2')], next_cursor: null })
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [history('price-1')], next_cursor: 'price-page-2' })
    if (url === '/api/tracked-products/tracking-1/history?cursor=price-page-2') return reply(200, { items: [history('price-2')], next_cursor: null })
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  // Migrado (0012/AC22): a seção Alertas mostra produto, preços e criação em campos separados.
  const alerts = within(await screen.findByRole('region', { name: 'Alertas' }))
  expect(await alerts.findByText('Aviso notice-1')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar mais notificações' }))
  expect(await alerts.findByText('Aviso notice-2')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Carregar mais notificações' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar mais preços' }))
  await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/tracked-products/tracking-1/history?cursor=price-page-2', expect.anything()))
  expect(screen.queryByRole('button', { name: 'Carregar mais preços' })).not.toBeInTheDocument()
  expect(screen.getAllByText(/R\$\s*80,00/).length).toBeGreaterThan(1)
})

it('distingue tentativa falha, leitura válida, preço observado e mudança no detalhe', async () => {
  const item = trackedItem({
    last_attempt_status: 'rate_limited', last_attempt_at: '2026-10-08T12:00:00Z',
    price_changed_at: '2026-10-08T10:00:00Z', stale: true,
  })
  fakeApi((url) => {
    if (url === '/api/tracked-products/tracking-1') return reply(200, item)
    if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  expect(screen.getByText(/Preço desatualizado/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText(/Última tentativa:/)).toBeInTheDocument()
  expect(detail.getByText(/Última leitura válida:/)).toBeInTheDocument()
  expect(detail.getByText(/Último preço observado:/)).toBeInTheDocument()
  expect(detail.getByText(/Última mudança de preço:/)).toBeInTheDocument()
  expect(detail.getByText(/Limite de consultas atingido/)).toBeInTheDocument()
  expect(detail.getByText(/Anterior: R\$\s*100,00/)).toBeInTheDocument()
  expect(detail.getByText(/Variação: -20,00%/)).toBeInTheDocument()
})

it('mostra erro com nova tentativa quando a sessão não pode ser verificada por falha de rede', async () => {
  const mockFetch = signedIn(() => undefined)
  mockFetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
  render(<App />)
  expect(await screen.findByText('Não foi possível conectar ao BestPrice. Tente novamente.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
})

it('não pede login quando a verificação de sessão recebe 503', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.'))))
  render(<App />)
  expect(await screen.findByText('Serviço temporariamente indisponível.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
})

it('volta ao login quando uma chamada autenticada recebe 401 no meio da sessão', async () => {
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.'))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
  expect(screen.queryByText('pessoa@example.com')).not.toBeInTheDocument()
  expect(screen.queryByText('Você ainda não está acompanhando nenhum produto.')).not.toBeInTheDocument()
})

it('oferece Ver produto quando o anúncio já é monitorado', async () => {
  const item = trackedItem()
  signedIn((url) => {
    if (url === '/api/tracked-products') return Promise.resolve(reply(409, apiError('already_tracked', 'Você já monitora este anúncio.', { tracked_product_id: 'tracking-1' })))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByText('Você já monitora este anúncio.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver produto' }))
  expect(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })).toBeInTheDocument()
})

it('informa quando tentar novamente após limite de consultas', async () => {
  signedIn((url) => url === '/api/tracked-products'
    ? Promise.resolve(reply(429, apiError('integration_rate_limited', 'Limite de consultas ao Mercado Livre atingido.', { retry_after_seconds: 90 }))) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  submitUrl()
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Limite de consultas ao Mercado Livre atingido.')
  expect(alert).toHaveTextContent('Tente novamente em 2 minutos.')
})

it('mostra erro na área de notificações quando elas não carregam', async () => {
  signedIn((url) => url === '/api/notifications'
    ? Promise.resolve(reply(500, apiError('internal_error', 'Não foi possível carregar as notificações.'))) : undefined)
  render(<App />)
  const section = within(await screen.findByRole('region', { name: 'Alertas' }))
  expect(await section.findByRole('alert')).toHaveTextContent('Não foi possível carregar as notificações.')
  // Migrado (0012/AC22): texto de vazio da seção mudou.
  expect(section.queryByText('Nenhuma notificação por enquanto.')).not.toBeInTheDocument()
})

it('rejeita atualização recente com valor fora do contrato', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'price_changed', previous_value: '100.00', current_value: 80, currency: 'BRL', observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
  // Migrado (0012/AC21): texto de vazio da linha do tempo mudou.
  expect(screen.queryByText('As mudanças confirmadas de preço e disponibilidade aparecerão aqui.')).not.toBeInTheDocument()
})

it('rejeita atualização recente com tipo desconhecido', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'stock_guess', previous_value: 'available', current_value: 'unavailable', currency: null, observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('rejeita atualização recente sem produto, moeda ou instante válidos', async () => {
  signedIn(() => undefined, dashboardWith([], [
    { id: 'event-1', type: 'price_changed', previous_value: '100.00', current_value: '80.00', currency: 7, observed_at: null },
  ]))
  render(<App />)
  expect(await screen.findByText('A API respondeu com dados inválidos.')).toBeInTheDocument()
})

it('exibe atualização recente válida de disponibilidade sem moeda', async () => {
  // Migrado (0012/AC23): sem produtos a linha do tempo fica oculta; o evento pertence a um produto carregado.
  signedIn(() => undefined, dashboardWith([trackedItem()], [
    { id: 'event-1', tracked_product_id: 'tracking-1', type: 'availability_changed', previous_value: 'available', current_value: 'unavailable', currency: null, observed_at: '2026-10-08T11:00:00Z' },
  ]))
  render(<App />)
  // Migrado (0012/AC20): o evento descreve o produto e a nova disponibilidade.
  expect(await screen.findByText(/ficou indisponível\./)).toHaveTextContent('Fone sem fio ficou indisponível.')
})

it('mostra mensagem de rede quando o cadastro não alcança a API', async () => {
  signedIn((url) => url === '/api/tracked-products' ? Promise.reject(new TypeError('Failed to fetch')) : undefined)
  render(<App />)
  expect(await screen.findByText('Você ainda não está acompanhando nenhum produto.')).toBeInTheDocument()
  submitUrl()
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao BestPrice. Tente novamente.')
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
})

it('recarrega o vínculo e mostra o erro quando a atualização falha na fonte', async () => {
  const before = trackedItem()
  const after = trackedItem({ last_attempt_status: 'temporary_error', last_attempt_at: '2026-10-08T12:00:00Z' })
  let refreshed = false
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') {
      refreshed = true
      return Promise.resolve(reply(503, apiError('integration_unavailable', 'Mercado Livre indisponível no momento.')))
    }
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, refreshed ? after : before))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    if (url === '/api/dashboard') return Promise.resolve(reply(200, dashboardWith([refreshed ? after : before])))
    return undefined
  })
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText('Resultado da última tentativa: Consulta concluída')).toBeInTheDocument()
  fireEvent.click(detail.getByRole('button', { name: 'Atualizar agora' }))
  expect(await detail.findByText('Resultado da última tentativa: Falha temporária na consulta')).toBeInTheDocument()
  expect(detail.getByRole('alert')).toHaveTextContent('Mercado Livre indisponível no momento.')
  const tracked = within(screen.getByRole('region', { name: 'Seus produtos' }))
  expect(await tracked.findByText('Última tentativa: Falha temporária na consulta')).toBeInTheDocument()
  expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
})

it('volta ao login quando a atualização recebe 401', async () => {
  const item = trackedItem()
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') return Promise.resolve(reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.')))
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Atualizar agora' }))
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
})

it('mostra Preço indisponível e métricas desconhecidas para item sem preço observado', async () => {
  const item = trackedItem({
    current_price: null, previous_price: null, min_price: null, max_price: null, absolute_change: null,
    percentage_change: null, last_attempt_status: 'missing_price', availability: 'unknown',
    last_confirmed_availability: null, last_confirmed_availability_at: null,
    last_price_observed_at: null, price_changed_at: null, stale: true,
  })
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }, dashboardWith([item]))
  render(<App />)
  expect(await screen.findByText('Fone sem fio')).toBeInTheDocument()
  expect(screen.getByText('Preço indisponível')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Ver detalhes/ }))
  const detail = within(await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' }))
  expect(detail.getByText('Preço indisponível')).toBeInTheDocument()
  expect(detail.getByText('Ainda não há preço válido registrado.')).toBeInTheDocument()
  expect(detail.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument()
  expect(detail.getByText('Anterior: Desconhecido · Diferença: Desconhecida · Variação: Desconhecida')).toBeInTheDocument()
  expect(detail.getByText('Menor: Desconhecido · Maior: Desconhecido')).toBeInTheDocument()
  expect(detail.getByText('Último preço observado: Desconhecido')).toBeInTheDocument()
  expect(detail.getByText('Última mudança de preço: Desconhecida')).toBeInTheDocument()
})

// Migrado (0012/AC12): o card virou linha da tabela “Seus produtos” (linha principal + secundária).
function productRow(title: string): HTMLElement {
  return screen.getByRole('rowgroup', { name: title })
}

function detailRoutes(item: unknown): Route {
  return (url) => {
    if (url === '/api/tracked-products/tracking-1') return Promise.resolve(reply(200, item))
    if (url === '/api/tracked-products/tracking-1/history') return Promise.resolve(reply(200, { items: [], next_cursor: null }))
    return undefined
  }
}

it('mostra no card do dashboard preço anterior, mínimo, máximo, variação e horários de consulta e alteração', async () => {
  signedIn(() => undefined, dashboardWith([trackedItem({ last_attempt_at: '2026-10-08T12:00:00Z', price_changed_at: '2026-10-08T11:00:00Z' })]))
  render(<App />)
  const row = within(await screen.findByRole('rowgroup', { name: 'Fone sem fio' }))
  expect(row.getByText('Preço anterior').closest('div')).toHaveTextContent(/Preço anterior\s*R\$\s*100,00/)
  expect(row.getAllByRole('cell')[3]).toHaveTextContent(/^R\$\s*80,00$/)
  expect(row.getByText('Maior preço').closest('div')).toHaveTextContent(/Maior preço\s*R\$\s*100,00/)
  expect(row.getAllByRole('cell')[2]).toHaveTextContent(/-20,00%/)
  expect(row.getByText('Última consulta').closest('div')).not.toHaveTextContent('Desconhecida')
  expect(row.getByText('Última alteração').closest('div')).not.toHaveTextContent('Desconhecida')
  expect(screen.getByText(/desde o primeiro registro no BestPrice/)).toBeInTheDocument()
})

it('identifica como desconhecidas no card as métricas ausentes, sem exibir R$ 0,00', async () => {
  signedIn(() => undefined, dashboardWith([trackedItem({
    current_price: null, previous_price: null, min_price: null, max_price: null, absolute_change: null,
    percentage_change: null, last_attempt_at: null, last_price_observed_at: null, price_changed_at: null,
  })]))
  render(<App />)
  const rowElement = await screen.findByRole('rowgroup', { name: 'Fone sem fio' })
  const row = within(rowElement)
  expect(row.getByText('Preço anterior').closest('div')).toHaveTextContent(/Preço anterior\s*Desconhecido/)
  expect(row.getAllByRole('cell')[3]).toHaveTextContent(/^Desconhecido$/)
  expect(row.getByText('Maior preço').closest('div')).toHaveTextContent(/Maior preço\s*Desconhecido/)
  expect(row.getAllByRole('cell')[2]).toHaveTextContent(/^Desconhecida$/)
  expect(row.getByText('Última consulta').closest('div')).toHaveTextContent(/Última consulta\s*Desconhecida/)
  expect(row.getByText('Última alteração').closest('div')).toHaveTextContent(/Última alteração\s*Desconhecida/)
  expect(productRow('Fone sem fio')).not.toHaveTextContent(/R\$\s*0,00/)
})

async function openDetail() {
  const item = trackedItem()
  signedIn(detailRoutes(item), dashboardWith([item]))
  render(<App />)
  const opener = await screen.findByRole('button', { name: /^Ver detalhes/ })
  opener.focus()
  fireEvent.click(opener)
  const dialog = await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })
  return { opener, dialog }
}

it('move o foco para dentro do diálogo de detalhe ao abrir', async () => {
  const { dialog } = await openDetail()
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Fechar detalhes' })).toHaveFocus())
})

it('fecha o diálogo com Esc e devolve o foco a Ver detalhes', async () => {
  const { opener, dialog } = await openDetail()
  fireEvent.keyDown(within(dialog).getByRole('button', { name: 'Fechar detalhes' }), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(opener).toHaveFocus()
})

it('devolve o foco a Ver detalhes ao fechar pelo botão', async () => {
  const { opener, dialog } = await openDetail()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar detalhes' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(opener).toHaveFocus()
})

it('prende o foco no diálogo com Tab e Shift+Tab', async () => {
  const { dialog } = await openDetail()
  const close = within(dialog).getByRole('button', { name: 'Fechar detalhes' })
  const last = within(dialog).getByRole('button', { name: 'Parar de monitorar' })
  last.focus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(close).toHaveFocus()
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
})

it('mantém Esc e Tab presos ao diálogo quando o botão focado é desabilitado e o foco cai no body', async () => {
  const item = trackedItem()
  signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') return new Promise(() => undefined)
    return detailRoutes(item)(url)
  }, dashboardWith([item]))
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /^Ver detalhes/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })
  const refresh = within(dialog).getByRole('button', { name: 'Atualizar agora' })
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Fechar detalhes' })).toHaveFocus())
  // O navegador tira o foco de um botão que fica desabilitado e o devolve ao body;
  // o jsdom não faz essa troca nem permite blur em elemento desabilitado, então ela é simulada antes do clique.
  refresh.focus()
  refresh.blur()
  fireEvent.click(refresh)
  await waitFor(() => expect(refresh).toBeDisabled())
  expect(document.body).toHaveFocus()
  fireEvent.keyDown(document.body, { key: 'Tab' })
  const close = within(dialog).getByRole('button', { name: 'Fechar detalhes' })
  expect(close).toHaveFocus()
  close.blur()
  expect(document.body).toHaveFocus()
  fireEvent.keyDown(document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('leva o foco ao título da lista quando o card que abriu o detalhe deixa de existir', async () => {
  // Migrado (0012/AC19): com outro produto na lista a seção continua visível e recebe o foco;
  // parar pelo detalhe agora passa pela confirmação dentro do próprio diálogo.
  const item = trackedItem()
  const other = trackedItem({ id: 'product-2', title: 'Cafeteira elétrica' }, { id: 'tracking-2' })
  let stopped = false
  fakeApi((url, init) => {
    if (url === '/api/dashboard') return reply(200, stopped ? dashboardWith([other]) : dashboardWith([item, other]))
    if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') {
      stopped = true
      return reply(204, null)
    }
    return detailRoutes(item)(url)
  })
  render(<App />)
  const opener = await screen.findByRole('button', { name: 'Ver detalhes de Fone sem fio' })
  opener.focus()
  fireEvent.click(opener)
  const dialog = await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Parar de monitorar' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Parar de monitorar' }))
  await waitFor(() => expect(screen.queryByRole('rowgroup', { name: 'Fone sem fio' })).not.toBeInTheDocument())
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Seus produtos' })).toHaveFocus())
})

async function closeDuringRefresh(outcome: () => unknown) {
  const item = trackedItem()
  let finishRefresh: (value: unknown) => void = () => undefined
  const mockFetch = signedIn((url) => {
    if (url === '/api/tracked-products/tracking-1/refresh') return new Promise((resolve) => { finishRefresh = resolve })
    return detailRoutes(item)(url)
  }, dashboardWith([item]))
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /^Ver detalhes/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Detalhes de Fone sem fio' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Atualizar agora' }))
  fireEvent.keyDown(document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  const dashboardCalls = mockFetch.mock.calls.filter(([url]) => url === '/api/dashboard').length
  finishRefresh(outcome())
  await waitFor(() => expect(mockFetch.mock.calls.filter(([url]) => url === '/api/dashboard').length).toBeGreaterThan(dashboardCalls))
  await waitFor(() => expect(screen.getByRole('button', { name: /^Ver detalhes/ })).toBeEnabled())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
}

it('não reabre o diálogo fechado durante Atualizar agora quando a atualização conclui', async () => {
  await closeDuringRefresh(() => reply(200, trackedItem()))
})

it('não reabre o diálogo fechado durante Atualizar agora quando a atualização falha', async () => {
  await closeDuringRefresh(() => reply(503, apiError('source_unavailable', 'Mercado Livre indisponível.')))
})

// 0017 (AC05/AC06): integração do LoginForm com api.login.
function guestThenLogin(login: () => unknown) {
  return fakeApi((url, init) => {
    if (url === '/api/auth/me') return reply(401, apiError('unauthenticated', 'Entre para continuar.'))
    if (url === '/api/auth/login' && init?.method === 'POST') return login()
    return undefined
  })
}

function fillLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
}

it('mostra Entrando… sem reenviar, preserva os campos após 401, foca a Senha e entra na nova tentativa', async () => {
  const pending = deferred()
  let attempt = 0
  const mockFetch = guestThenLogin(() => {
    attempt += 1
    return attempt === 1 ? pending.promise : reply(200, sessionUser)
  })
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Mostrar senha' }))
  fillLogin('pessoa@example.com', 'errada')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  const busyButton = await screen.findByRole('button', { name: 'Entrando…' })
  expect(busyButton).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(busyButton)
  fireEvent.submit(busyButton.closest('form') as HTMLFormElement)
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')).toHaveLength(1)
  expect(callsTo(mockFetch, '/api/auth/login', 'POST')[0][1]?.body).toBe(JSON.stringify({ email: 'pessoa@example.com', password: 'errada' }))
  pending.resolve(reply(401, apiError('invalid_credentials', 'E-mail ou senha inválidos.')))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.'))
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('errada')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
  expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  fillLogin('pessoa@example.com', 'certa')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('pessoa@example.com')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
})

it('mostra falha de conexão no login como alerta e mantém os campos', async () => {
  guestThenLogin(() => Promise.reject(new TypeError('Failed to fetch')))
  render(<App />)
  await screen.findByRole('button', { name: 'Entrar' })
  fillLogin('pessoa@example.com', 'segredo')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar ao BestPrice. Tente novamente.'))
  expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@example.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('segredo')
  await waitFor(() => expect(screen.getByLabelText('Senha')).toHaveFocus())
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
})
