import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { alertFixture, apiError, dashboardFixture, fakeApi, notificationFixture, reply, trackedFixture, unreadUrl, type Route } from '../test/fakeApi'

// 0063: página única de Monitoramento na área com barra lateral.

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')
const times = { last_price_observed_at: '2026-10-11T16:00:00Z', last_attempt_at: '2026-10-11T17:30:00Z', price_changed_at: '2026-10-11T15:00:00Z' }

function item(id: string, title: string, overrides: Record<string, unknown> = {}, tracked: Record<string, unknown> = {}) {
  return trackedFixture({ id: `product-${id}`, title, ...times, ...overrides }, { id: `tracking-${id}`, ...tracked })
}

const falling = item('1', 'Notebook Inspiron 15', { current_price: '2879.00', previous_price: '3139.00', percentage_change: '-8.28' },
  { alert: alertFixture({ target_price: '2700.00' }) })
const rising = item('2', 'Fone Bluetooth', { current_price: '329.00', previous_price: '312.00', percentage_change: '5.45' })
const stable = item('3', 'Monitor 27 polegadas', { current_price: '1249.00', previous_price: '1249.00', percentage_change: '0.00' })
const unavailable = item('4', 'Teclado mecânico', { current_price: '249.00', percentage_change: '-3.00', availability: 'unavailable' })
const noPrice = item('5', 'Mouse sem fio', { current_price: null, previous_price: null, min_price: null, max_price: null, percentage_change: null, absolute_change: null })
const unknownChange = item('6', 'Cadeira gamer', { current_price: '899.00', previous_price: null, percentage_change: null })

const populated = dashboardFixture({
  items: [falling, rising, stable, unavailable, noPrice, unknownChange],
  summary: { tracked_count: 6, price_drop_count: 1, active_alert_count: 1, target_reached_count: 0 },
  opportunities: [falling],
  recentUpdates: [{ id: 'u1', tracked_product_id: 'tracking-1', type: 'price_changed', previous_value: '3139.00', current_value: '2879.00', currency: 'BRL', observed_at: '2026-10-11T15:00:00Z' }],
})

async function visit(path: string, dashboard: unknown = populated, route: Route = () => undefined) {
  window.history.replaceState(null, '', path)
  const mockFetch = fakeApi(route, dashboard)
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
  return { user, mockFetch }
}

function productsRegion() {
  return screen.getByRole('region', { name: /^Produtos monitorados/ })
}

describe('página única', () => {
  it('mostra um título, sem navegação interna, e o sino uma vez (AC01)', async () => {
    await visit('/app/monitoring')
    expect(screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent)).toEqual(['Monitoramento de preços'])
    expect(screen.getByText('Acompanhe seus anúncios e reconheça o melhor momento de comprar.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Início' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Produtos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Notificações/ })).toHaveLength(1)
  })

  it('leva o endereço antigo da visão geral à página única (AC02)', async () => {
    await visit('/app/monitoring/overview')
    await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring'))
    expect(screen.getByRole('heading', { level: 1, name: 'Monitoramento de preços' })).toBeInTheDocument()
  })

  it('mostra atualizações recentes abaixo da lista e não mostra boas oportunidades (AC09)', async () => {
    await visit('/app/monitoring')
    const updates = screen.getByRole('heading', { name: 'Atualizações recentes' })
    expect(productsRegion().compareDocumentPosition(updates) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Boas oportunidades' })).not.toBeInTheDocument()
  })
})

describe('indicadores (AC03)', () => {
  it('mostra os quatro valores do resumo em cartões', async () => {
    await visit('/app/monitoring')
    const region = screen.getByRole('region', { name: 'Resumo do monitoramento' })
    const cards = within(region).getAllByRole('listitem').map((card) => card.textContent?.replace(/\s+/g, ' ').trim())
    expect(cards).toEqual(['Produtos monitorados 6', 'Baixaram de preço 1 nas últimas 24h', 'Alertas ativos 1', 'Preço-alvo atingido 0 no alvo agora'])
  })
})

describe('produtos monitorados', () => {
  it('mostra quantidade, ação de adicionar só por link e as colunas sem loja (AC04)', async () => {
    const { user } = await visit('/app/monitoring')
    const region = productsRegion()
    expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent(/Produtos monitorados\s*\(6\)/)
    expect(within(region).getAllByRole('columnheader').map((cell) => cell.textContent))
      .toEqual(['Produto', 'Último preço', 'Variação', 'Menor preço', 'Situação', 'Última leitura', 'Ações'])
    await user.click(within(region).getByRole('button', { name: /Adicionar anúncio/ }))
    expect(within(region).getAllByRole('textbox').map((field) => field.getAttribute('aria-label') ?? field.id)).toHaveLength(1)
    expect(within(region).getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })).toBeVisible()
  })

  it('rotula a situação de cada produto em texto (AC05)', async () => {
    await visit('/app/monitoring')
    const situation = (title: string) => within(screen.getByRole('rowgroup', { name: title })).getByTestId('situation').textContent
    expect(situation('Notebook Inspiron 15')).toBe('Em queda')
    expect(situation('Fone Bluetooth')).toBe('Em alta')
    expect(situation('Monitor 27 polegadas')).toBe('Sem alteração')
    expect(situation('Teclado mecânico')).toBe('Indisponível')
    expect(situation('Mouse sem fio')).toBe('Sem preço')
    expect(situation('Cadeira gamer')).toBe('Sem variação conhecida')
    expect(within(screen.getByRole('rowgroup', { name: 'Teclado mecânico' })).getByText('Disponibilidade').nextElementSibling)
      .toHaveTextContent('Indisponível')
  })

  it('nunca mostra preço desconhecido como zero e mantém o alerta visível (AC06)', async () => {
    await visit('/app/monitoring')
    const row = within(screen.getByRole('rowgroup', { name: 'Mouse sem fio' }))
    expect(row.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument()
    expect(row.getByText('Preço indisponível')).toBeInTheDocument()
    expect(within(screen.getByRole('rowgroup', { name: 'Notebook Inspiron 15' })).getByText(/Alerta em R\$\s*2\.700,00/)).toBeInTheDocument()
  })

  it('abre o detalhe dentro da área com barra lateral (AC07)', async () => {
    const { user } = await visit('/app/monitoring', populated, (url) => {
      if (url === '/api/tracked-products/tracking-1') return reply(200, falling)
      if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
      return undefined
    })
    await user.click(within(screen.getByRole('rowgroup', { name: 'Notebook Inspiron 15' })).getByRole('link', { name: /Ver detalhes/ }))
    await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring/tracking-1'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Notebook Inspiron 15' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Monitoramento' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Voltar ao monitoramento' })).toHaveAttribute('href', '/app/monitoring')
  })

  it('leva as atualizações recentes ao detalhe dentro da área (AC07)', async () => {
    await visit('/app/monitoring')
    const updates = screen.getByRole('region', { name: 'Atualizações recentes' })
    expect(within(updates).getByRole('link', { name: /Ver produto/ })).toHaveAttribute('href', '/app/monitoring/tracking-1')
  })

  it('mostra erro com caminho de volta para produto inexistente (AC07)', async () => {
    window.history.replaceState(null, '', '/app/monitoring/tracking-x')
    fakeApi((url) => url.startsWith('/api/tracked-products/tracking-x') ? reply(404, apiError('not_found', 'Produto não encontrado.')) : undefined, populated)
    render(<App clock={clock} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Produto indisponível' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao monitoramento' })).toHaveAttribute('href', '/app/monitoring')
  })
})

describe('alertas (AC08)', () => {
  it('chega aos alertas por link da página e volta ao monitoramento', async () => {
    const { user } = await visit('/app/monitoring', populated, (url) => url === '/api/alerts' ? reply(200, { items: [], next_cursor: null }) : undefined)
    await user.click(screen.getByRole('link', { name: 'Ver alertas' }))
    await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring/alerts'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Alertas' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Voltar ao monitoramento' }))
    await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring'))
  })

  it('o sino leva às notificações dentro da área', async () => {
    const { user } = await visit('/app/monitoring')
    await user.click(screen.getByRole('button', { name: /^Notificações/ }))
    expect(screen.getByRole('link', { name: 'Ver todas as notificações' })).toHaveAttribute('href', '/app/monitoring/alerts')
  })
})

describe('estados', () => {
  it('sem produtos mostra o convite com link, sem indicadores e sem cabeçalho de tabela (AC10)', async () => {
    await visit('/app/monitoring', dashboardFixture({}))
    expect(screen.getByRole('heading', { level: 1, name: 'Monitoramento de preços' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nenhum produto acompanhado' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Monitorar preço/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Resumo do monitoramento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument()
  })

  it('falha ao carregar mostra erro e Tentar novamente (AC11)', async () => {
    let calls = 0
    const { user } = await visit('/app/monitoring', populated, (url) => {
      if (url !== '/api/dashboard') return undefined
      calls += 1
      return calls === 1 ? reply(503, apiError('unavailable', 'Não foi possível carregar o painel. Tente novamente.')) : undefined
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o painel.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('rowgroup', { name: 'Notebook Inspiron 15' })).toBeInTheDocument()
  })
})

describe('rotas legadas (AC13)', () => {
  it('mantêm a navegação interna fora da barra lateral', async () => {
    window.history.replaceState(null, '', '/produtos')
    fakeApi(() => undefined, populated)
    render(<App clock={clock} />)
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Início', 'Produtos', 'Alertas'])
    await waitFor(() => expect(within(screen.getByRole('rowgroup', { name: 'Fone Bluetooth' })).getByRole('link', { name: /Ver detalhes/ }))
      .toHaveAttribute('href', '/produtos/tracking-2'))
  })
})

describe('links e ações dentro da área (revisão 0063)', () => {
  async function stopFromDetail(items: unknown[]) {
    let current = items as { id: string }[]
    const { user } = await visit('/app/monitoring', dashboardFixture({ items }), (url, init) => {
      if (url === '/api/tracked-products/tracking-1' && init?.method === 'DELETE') {
        current = current.filter((entry) => entry.id !== 'tracking-1')
        return reply(204, null)
      }
      if (url === '/api/tracked-products/tracking-1') return reply(200, falling)
      if (url === '/api/tracked-products/tracking-1/history') return reply(200, { items: [], next_cursor: null })
      if (url === '/api/dashboard') return reply(200, dashboardFixture({ items: current }))
      if (url === '/api/tracked-products') return reply(200, { items: current, next_cursor: null })
      return undefined
    })
    await user.click(within(screen.getByRole('rowgroup', { name: 'Notebook Inspiron 15' })).getByRole('link', { name: /Ver detalhes/ }))
    await user.click(await screen.findByRole('button', { name: 'Parar de monitorar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Parar de monitorar' }))
    await waitFor(() => expect(window.location.pathname).toBe('/app/monitoring'))
  }
  // Depois de dois quadros: o foco do título da página (agendado na troca de endereço) não pode vencer.
  const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  it('parar de acompanhar pelo detalhe volta à página única com foco no título da lista (AC07)', async () => {
    await stopFromDetail([falling, rising])
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: /Produtos monitorados/ })).toHaveFocus())
    await frames()
    expect(screen.getByRole('heading', { level: 2, name: /Produtos monitorados/ })).toHaveFocus()
  })

  it('parar de acompanhar o único produto pelo detalhe leva o foco ao campo de link (AC07)', async () => {
    await stopFromDetail([falling])
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })).toHaveFocus())
    await frames()
    expect(screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })).toHaveFocus()
  })

  it('links da página de alertas abrem o detalhe dentro da área (AC07, AC08)', async () => {
    const notice = notificationFixture('n1', { tracked_product_id: 'tracking-1', product_title: 'Notebook Inspiron 15' })
    await visit('/app/monitoring/alerts', populated, (url) => url === '/api/notifications' ? reply(200, { items: [notice], next_cursor: null }) : undefined)
    expect(await screen.findByRole('link', { name: 'Abrir produto' })).toHaveAttribute('href', '/app/monitoring/tracking-1')
    expect(await screen.findByRole('link', { name: 'Configurar alerta' })).toHaveAttribute('href', '/app/monitoring/tracking-1')
  })

  it('"Abrir produto" no sino abre o detalhe dentro da área (AC07)', async () => {
    const notice = notificationFixture('n1', { tracked_product_id: 'tracking-2' })
    const { user } = await visit('/app/monitoring', populated, (url) => url === unreadUrl ? reply(200, { items: [notice], next_cursor: null }) : undefined)
    await user.click(await screen.findByRole('button', { name: /^Notificações/ }))
    expect(screen.getByRole('link', { name: 'Abrir produto' })).toHaveAttribute('href', '/app/monitoring/tracking-2')
  })

  it('"Ver produto" após adicionar abre o detalhe dentro da área (AC07)', async () => {
    const created = item('9', 'Cafeteira elétrica')
    const { user } = await visit('/app/monitoring', populated, (url, init) =>
      url === '/api/tracked-products' && init?.method === 'POST' ? reply(201, created) : undefined)
    await user.click(screen.getByRole('button', { name: /Adicionar anúncio/ }))
    await user.type(screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' }), 'https://produto.mercadolivre.com.br/MLB-9-cafeteira-_JM')
    await user.click(screen.getByRole('button', { name: /Monitorar preço/ }))
    expect(await within(productsRegion()).findByRole('link', { name: 'Ver produto' })).toHaveAttribute('href', '/app/monitoring/tracking-9')
  })

  it('"Carregar mais" traz a página seguinte na página única (AC06)', async () => {
    const { user } = await visit('/app/monitoring', dashboardFixture({ items: [falling], nextCursor: 'page-2', summary: { tracked_count: 2 } }), (url) =>
      url === '/api/tracked-products?cursor=page-2' ? reply(200, { items: [rising], next_cursor: null }) : undefined)
    await user.click(await screen.findByRole('button', { name: 'Carregar mais produtos' }))
    expect(await screen.findByRole('rowgroup', { name: 'Fone Bluetooth' })).toBeInTheDocument()
  })
})
