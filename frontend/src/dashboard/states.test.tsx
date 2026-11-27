import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, callsTo, dashboardFixture, deferred, emptyDashboard, fakeApi, reply, trackedFixture, unreadUrl } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

// 0063: os estados do painel valem para a página única de Monitoramento (/app/monitoring), que reúne
// indicadores, lista e atualizações recentes; "Boas oportunidades" saiu da página.
function dashboardRegions() {
  return [
    screen.getByRole('region', { name: 'Resumo do monitoramento' }),
    screen.getByRole('region', { name: /^Produtos monitorados/ }),
    screen.getByRole('region', { name: 'Atualizações recentes' }),
  ]
}

function at(path: string) {
  window.history.replaceState(null, '', path)
}

async function openLinkField(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Adicionar anúncio/ }))
  return screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
}

describe('carregamento do painel', () => {
  it('mostra esqueletos anunciados como carregando, sem números nem textos de vazio, até a resposta chegar', async () => {
    const response = deferred()
    fakeApi((url) => url === '/api/dashboard' ? response.promise : undefined)
    at('/app/monitoring')
    render(<App clock={clock} />)
    const loadingStatus = (await screen.findByText('Carregando seu painel…')).closest('[role="status"]')
    expect(loadingStatus).not.toBeNull()
    // O anúncio não pode ficar dentro de região aria-busy, que suprime a leitura.
    expect(loadingStatus?.closest('[aria-busy="true"]')).toBeNull()
    const regions = dashboardRegions()
    for (const region of regions) {
      expect(region).toHaveAttribute('aria-busy', 'true')
      expect(region).not.toHaveTextContent(/\d/)
      expect(region.querySelector('[data-skeleton]')).toHaveAttribute('aria-hidden', 'true')
    }
    expect(screen.queryByText(/Nenhuma oportunidade|Nenhum produto acompanhado|ainda não está acompanhando|aparecerão aqui/)).not.toBeInTheDocument()

    response.resolve(reply(200, dashboardFixture({
      items: [trackedFixture()], summary: { price_drop_count: 3 },
    })))
    await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
    for (const region of dashboardRegions()) {
      expect(region).toHaveAttribute('aria-busy', 'false')
      expect(region.querySelector('[data-skeleton]')).toBeNull()
    }
    expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('3')).toBeInTheDocument()
  })
})

describe('estado vazio', () => {
  it('prioriza o convite com o campo de link e oculta indicadores, produtos e atualizações', async () => {
    fakeApi(() => undefined, emptyDashboard)
    at('/app/monitoring')
    render(<App clock={clock} />)
    const card = within(await screen.findByRole('region', { name: 'Nenhum produto acompanhado' }))
    expect(card.getByText('Cole o link de um anúncio do Mercado Livre para começar.')).toBeInTheDocument()
    const field = card.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
    expect(field).toBeVisible()
    expect(field.closest('.hero')).toHaveClass('hero-priority')
    expect(card.getByRole('button', { name: /Monitorar preço/ })).toBeEnabled()
    // 0028/AC09 e 0063/AC10: sem produtos, o convite fica sozinho, sem indicadores zerados nem tabela vazia.
    expect(screen.queryByText('Produtos monitorados')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument()
    for (const name of ['Resumo do monitoramento', /^Produtos monitorados/, 'Atualizações recentes', 'Notificações recebidas']) {
      expect(screen.queryByRole('region', { name })).not.toBeInTheDocument()
    }
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Monitoramento de preços', level: 1 })).toHaveFocus())
  })
})

describe('respostas concorrentes do painel', () => {
  it('mantém os dados da carga mais recente quando a anterior chega depois', async () => {
    const older = deferred()
    const newer = deferred()
    let dashboardCall = 0
    let trackCall = 0
    fakeApi((url, init) => {
      if (url === '/api/dashboard') {
        dashboardCall += 1
        if (dashboardCall === 1) return reply(200, dashboardFixture({ items: [trackedFixture()], summary: { tracked_count: 1 } }))
        return dashboardCall === 2 ? older.promise : newer.promise
      }
      if (url === '/api/tracked-products' && init?.method === 'POST') {
        trackCall += 1
        return reply(201, trackedFixture({ id: `product-n${trackCall}`, title: `Novo ${trackCall}` }, { id: `tracking-n${trackCall}` }))
      }
      return undefined
    })
    const user = userEvent.setup()
    at('/app/monitoring')
    render(<App clock={clock} />)
    const summary = () => within(screen.getByRole('region', { name: 'Resumo do monitoramento' }))
    await waitFor(() => expect(summary().getByText('1')).toBeInTheDocument())
    const field = await openLinkField(user)
    for (const link of ['https://produto.mercadolivre.com.br/MLB-1-a-_JM', 'https://produto.mercadolivre.com.br/MLB-2-b-_JM']) {
      await user.click(field)
      await user.paste(link)
      await user.click(screen.getByRole('button', { name: 'Monitorar preço' }))
      await screen.findByText('Produto adicionado ao monitoramento.')
      await waitFor(() => expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeEnabled())
    }
    await waitFor(() => expect(dashboardCall).toBe(3))
    newer.resolve(reply(200, dashboardFixture({ items: [trackedFixture()], summary: { tracked_count: 5 } })))
    await waitFor(() => expect(summary().getByText('5')).toBeInTheDocument())
    older.resolve(reply(200, dashboardFixture({ items: [trackedFixture()], summary: { tracked_count: 4 } })))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(summary().getByText('5')).toBeInTheDocument()
    expect(summary().queryByText('4')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /^Produtos monitorados/ })).toHaveTextContent(/\(5\)/)
  })
})

describe('falhas por região', () => {
  const dashboardFailures = [
    ['500', () => reply(500, apiError('internal_error', 'Não foi possível carregar o painel.')), 'Não foi possível carregar o painel.'],
    ['rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível conectar ao BestPrice. Tente novamente.'],
  ] as const

  it.each(dashboardFailures)('mostra a falha do painel com Tentar novamente, sem números fabricados (%s)', async (_case, failure, message) => {
    let fail = true
    const mockFetch = fakeApi((url) => {
      if (url === '/api/dashboard') return fail ? failure() : reply(200, dashboardFixture({ items: [trackedFixture()] }))
      return undefined
    })
    const user = userEvent.setup()
    at('/app/monitoring')
    render(<App clock={clock} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('heading', { level: 1, name: 'Monitoramento de preços' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Resumo do monitoramento' })).not.toBeInTheDocument()
    expect(screen.queryByText('Nenhum produto acompanhado')).not.toBeInTheDocument()
    const notificationCalls = callsTo(mockFetch, '/api/notifications').length
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('1')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(callsTo(mockFetch, '/api/notifications')).toHaveLength(notificationCalls)
  })

  // Antes da 0063, a falha do painel não bloqueava o campo de link (hero da Início e a lista em
  // /app/monitoring). A spec pede que o erro continue "como hoje" (AC11).
  it.each(dashboardFailures)('mantém o campo de link disponível quando o painel falha (%s)', async (_case, failure) => {
    fakeApi((url) => url === '/api/dashboard' ? failure() : undefined)
    at('/app/monitoring')
    render(<App clock={clock} />)
    await screen.findByRole('alert')
    const field = screen.queryByRole('textbox', { name: 'Link do anúncio do Mercado Livre', hidden: true })
    expect(field).not.toBeNull()
    expect(field).toBeEnabled()
  })

  it('mantém os dados e mostra a falha de recarga do painel com Tentar novamente', async () => {
    let fail = false
    fakeApi((url, init) => {
      if (url === '/api/dashboard') return fail ? reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')) : reply(200, dashboardFixture({ items: [trackedFixture()], summary: { tracked_count: 1 } }))
      if (url === '/api/tracked-products' && init?.method === 'POST') { fail = true; return reply(201, trackedFixture({ id: 'product-2', title: 'Cafeteira elétrica' }, { id: 'tracking-2' })) }
      return undefined
    })
    const user = userEvent.setup()
    at('/app/monitoring')
    render(<App clock={clock} />)
    const summary = () => within(screen.getByRole('region', { name: 'Resumo do monitoramento' }))
    await waitFor(() => expect(summary().getByText('1')).toBeInTheDocument())
    await user.click(await openLinkField(user))
    await user.paste('https://produto.mercadolivre.com.br/MLB-2-b-_JM')
    await user.click(screen.getByRole('button', { name: 'Monitorar preço' }))
    const refreshError = await screen.findByText('Serviço temporariamente indisponível.')
    expect(refreshError).toHaveAttribute('role', 'alert')
    // Dados já exibidos preservados: indicadores, lista (com o produto novo) e atualizações recentes.
    expect(summary().getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('rowgroup', { name: 'Fone sem fio' })).toBeInTheDocument()
    expect(screen.getByRole('rowgroup', { name: 'Cafeteira elétrica' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Atualizações recentes' })).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => expect(screen.queryByText('Serviço temporariamente indisponível.')).not.toBeInTheDocument())
  })

  it.each([
    ['500', () => reply(500, apiError('internal_error', 'Não foi possível carregar as notificações.'))],
    ['rede', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('mostra a falha das notificações no sino e na seção Alertas, sem bloquear o hero (%s)', async (_case, failure) => {
    fakeApi((url) => url.startsWith('/api/notifications') ? failure() : undefined, dashboardFixture({ items: [trackedFixture()] }))
    at('/alertas')
    render(<App clock={clock} />)
    const alerts = within(await screen.findByRole('region', { name: 'Notificações recebidas' }))
    expect(await alerts.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('banner')).getByRole('button', { name: /^Notificações/ })).toHaveAccessibleName('Notificações indisponíveis'))
    expect(screen.getByRole('heading', { name: 'Alertas', level: 1 })).toBeInTheDocument()
  })

  it.each([['/api/dashboard'], ['/api/notifications'], [unreadUrl]])('volta à entrada com 401 em %s', async (target) => {
    fakeApi((url) => url === target ? reply(401, apiError('unauthenticated', 'Sua sessão expirou. Entre novamente.')) : undefined, dashboardFixture({ items: [trackedFixture()] }))
    at(target === '/api/dashboard' ? '/app/monitoring' : '/alertas')
    render(<App clock={clock} />)
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
  })
})

describe('tempo relativo com relógio controlado', () => {
  // São Paulo em UTC−3: 15:00 local = 18:00Z.
  const rows = [
    ['2026-10-11T17:59:30Z', 'Agora'],
    ['2026-10-11T17:15:00Z', 'Há 45 min'],
    ['2026-10-11T06:00:00Z', 'Há 12 h'],
    ['2026-10-10T23:15:00Z', 'Há 18 h'],
    ['2026-10-08T12:05:00Z', '08/10/2026, 09:05'],
    ['2026-10-11T18:02:00Z', 'Agora'],
  ] as const

  it('fixa o texto da tabela do AC26 na chegada da resposta e não o altera quando o relógio avança', async () => {
    let now = new Date('2026-10-11T18:00:00Z')
    const items = rows.map(([observed], index) => trackedFixture(
      { id: `product-${index}`, title: `Produto ${index}`, last_price_observed_at: observed }, { id: `tracking-${index}` }))
    fakeApi(() => undefined, dashboardFixture({ items }))
    at('/produtos')
    render(<App clock={() => now} />)
    await screen.findByRole('rowgroup', { name: 'Produto 0' })
    const observedText = (index: number) => within(screen.getByRole('rowgroup', { name: `Produto ${index}` })).getAllByRole('cell')[5].querySelector('time > span')?.textContent
    rows.forEach(([, expected], index) => expect(observedText(index)).toBe(expected))
    now = new Date('2026-10-12T18:00:00Z')
    await new Promise((resolve) => setTimeout(resolve, 0))
    rows.forEach(([, expected], index) => expect(observedText(index)).toBe(expected))
  })

  it('mostra “Ontem, HH:mm” no dia civil anterior', async () => {
    fakeApi(() => undefined, dashboardFixture({ items: [trackedFixture({ last_price_observed_at: '2026-10-10T11:15:00Z' })] }))
    at('/produtos')
    render(<App clock={() => new Date('2026-10-11T12:00:00Z')} />)
    const row = await screen.findByRole('rowgroup', { name: 'Fone sem fio' })
    expect(within(row).getAllByRole('cell')[5].querySelector('time > span')?.textContent).toBe('Ontem, 08:15')
  })
})
