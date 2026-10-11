import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, callsTo, dashboardWith, deferred, fakeApi, notificationFixture, reply, trackedFixture, unreadUrl, type Route } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

function unread(count: number) {
  return Array.from({ length: count }, (_, index) => notificationFixture(`n-${index + 1}`, {
    product_title: `Produto ${index + 1}`, created_at: `2026-10-11T17:${String(50 - index).padStart(2, '0')}:00Z`,
  }))
}

type UnreadSource = () => unknown

/** Pessoa autenticada; `unreadSource` decide a resposta de cada consulta de não lidas. */
async function renderWithUnread(unreadSource: UnreadSource, extra: Route = () => undefined) {
  const mockFetch = fakeApi((url, init) => {
    const custom = extra(url, init)
    if (custom !== undefined) return custom
    if (url === unreadUrl) return unreadSource()
    return undefined
  }, dashboardWith([trackedFixture()]))
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await screen.findByRole('heading', { name: 'Seus produtos' })
  return { user, mockFetch }
}

function page(items: unknown[], nextCursor: string | null = null) {
  return reply(200, { items, next_cursor: nextCursor })
}

function bell() {
  return within(screen.getByRole('banner')).getByRole('button', { name: /^Notificações/ })
}

function panel() {
  return within(screen.getByRole('region', { name: 'Notificações não lidas' }))
}

describe('contador do sino', () => {
  it('mostra a quantidade de não lidas no texto e no nome acessível', async () => {
    await renderWithUnread(() => page(unread(3)))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 3 não lidas'))
    expect(within(bell()).getByText('3')).toBeInTheDocument()
  })

  it('não mostra contador sem não lidas', async () => {
    await renderWithUnread(() => page([]))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações'))
    expect(bell()).not.toHaveTextContent(/\d/)
  })

  it('limita o contador a 99+', async () => {
    await renderWithUnread(() => page(unread(100)))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, mais de 99 não lidas'))
    expect(within(bell()).getByText('99+')).toBeInTheDocument()
  })

  it('informa indisponibilidade sem número quando a consulta falha e permite tentar de novo', async () => {
    let fail = true
    const { user } = await renderWithUnread(() => fail ? reply(500, apiError('internal_error', 'Falhou.')) : page(unread(2)))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações indisponíveis'))
    expect(bell()).not.toHaveTextContent(/\d/)
    await user.click(bell())
    expect(panel().getByText('Notificações indisponíveis')).toBeInTheDocument()
    fail = false
    await user.click(panel().getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 2 não lidas'))
  })

  it('recalcula pela API após marcar como lida, sem decrementar localmente', async () => {
    let items = unread(3)
    const { user } = await renderWithUnread(() => page(items), (url, init) => {
      if (url === '/api/notifications/n-1' && init?.method === 'PATCH') {
        items = [unread(3)[2]]
        return reply(200, { ...unread(3)[0], read_at: '2026-10-11T18:00:00Z' })
      }
      return undefined
    })
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 3 não lidas'))
    await user.click(bell())
    await user.click(panel().getAllByRole('button', { name: /Marcar como lida/ })[0])
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 1 não lida'))
    expect(within(bell()).getByText('1')).toBeInTheDocument()
  })
})

describe('painel do sino', () => {
  it('mostra as 5 não lidas mais recentes e leva à seção Alertas', async () => {
    const { user } = await renderWithUnread(() => page(unread(7)))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 7 não lidas'))
    await user.click(bell())
    const items = panel().getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items.map((item) => within(item).getByText(/^Produto \d$/).textContent)).toEqual(['Produto 1', 'Produto 2', 'Produto 3', 'Produto 4', 'Produto 5'])
    expect(items[0]).toHaveTextContent(/R\$\s*80,00/)
    expect(items[0]).toHaveTextContent(/R\$\s*90,00/)
    expect(within(items[0]).getByText('Há 10 min')).toBeInTheDocument()
    await user.click(panel().getByRole('link', { name: 'Ver todas as notificações' }))
    expect(screen.getByRole('heading', { name: 'Alertas' })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Notificações não lidas' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Alertas' })).toHaveAttribute('aria-current', 'location')
  })

  it('informa quando não há não lidas', async () => {
    const { user } = await renderWithUnread(() => page([]))
    await user.click(bell())
    expect(panel().getByText('Nenhuma notificação não lida.')).toBeInTheDocument()
  })

  it('move o foco ao item seguinte ao marcar e ao título quando não resta item', async () => {
    let items = unread(3)
    const read = (id: string) => {
      items = items.filter((item) => item.id !== id)
      return reply(200, { ...unread(3).find((item) => item.id === id), read_at: '2026-10-11T18:00:00Z' })
    }
    const { user } = await renderWithUnread(() => page(items), (url, init) => {
      const match = /^\/api\/notifications\/(n-\d)$/.exec(url)
      return match && init?.method === 'PATCH' ? read(match[1]) : undefined
    })
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 3 não lidas'))
    await user.click(bell())
    await user.click(panel().getByRole('button', { name: 'Marcar como lida: Produto 2' }))
    await waitFor(() => expect(panel().getByRole('button', { name: 'Marcar como lida: Produto 3' })).toHaveFocus())
    await user.click(panel().getByRole('button', { name: 'Marcar como lida: Produto 1' }))
    await user.click(await panel().findByRole('button', { name: 'Marcar como lida: Produto 3' }))
    await waitFor(() => expect(panel().getByRole('heading', { name: 'Notificações não lidas' })).toHaveFocus())
    expect(panel().getByText('Nenhuma notificação não lida.')).toBeInTheDocument()
  })

  it('reflete na seção Alertas o item marcado como lido no painel', async () => {
    const notice = unread(1)[0]
    let readAt: string | null = null
    const { user } = await renderWithUnread(() => page(readAt ? [] : [notice]), (url, init) => {
      if (url === '/api/notifications') return page([{ ...notice, read_at: readAt }])
      if (url === '/api/notifications/n-1' && init?.method === 'PATCH') {
        readAt = '2026-10-11T18:00:00Z'
        return reply(200, { ...notice, read_at: readAt })
      }
      return undefined
    })
    const section = within(screen.getByRole('region', { name: 'Alertas' }))
    expect(await section.findByText('Não lida')).toBeInTheDocument()
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 1 não lida'))
    await user.click(bell())
    await user.click(panel().getByRole('button', { name: 'Marcar como lida: Produto 1' }))
    expect(await section.findByText('Lida')).toBeInTheDocument()
    expect(section.queryByRole('button', { name: /Marcar como lida/ })).not.toBeInTheDocument()
    expect(panel().queryByText('Produto 1')).not.toBeInTheDocument()
  })

  it('abre pelo teclado e fecha com Esc devolvendo o foco ao sino', async () => {
    const { user, mockFetch } = await renderWithUnread(() => page(unread(2)))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 2 não lidas'))
    bell().focus()
    await user.keyboard('{Enter}')
    expect(bell()).toHaveAttribute('aria-expanded', 'true')
    // O instante não é parada de Tab (QA 0012, M10): a primeira parada é o botão do item.
    await user.tab()
    expect(panel().getAllByText('Há 10 min')[0].closest('time')).not.toHaveAttribute('tabindex')
    expect(panel().getByRole('button', { name: 'Marcar como lida: Produto 1' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(panel().getByRole('button', { name: 'Marcar como lida: Produto 1' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(bell()).toHaveFocus()
    expect(bell()).toHaveAttribute('aria-expanded', 'false')
    // Abrir o painel não faz nova consulta: as 5 primeiras vêm da mesma resposta do contador.
    expect(callsTo(mockFetch, unreadUrl)).toHaveLength(1)
  })

  it('descarta o pedido de foco quando o painel fecha antes de a marcação terminar', async () => {
    const pending = deferred()
    let items = unread(2)
    const { user } = await renderWithUnread(() => page(items), (url, init) => {
      if (url === '/api/notifications/n-1' && init?.method === 'PATCH') return pending.promise
      return undefined
    })
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 2 não lidas'))
    await user.click(bell())
    await user.click(panel().getByRole('button', { name: 'Marcar como lida: Produto 1' }))
    await user.keyboard('{Escape}')
    expect(bell()).toHaveFocus()
    items = [unread(2)[1]]
    pending.resolve(reply(200, { ...unread(2)[0], read_at: '2026-10-11T18:00:00Z' }))
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notificações, 1 não lida'))
    await user.keyboard('{Enter}')
    expect(bell()).toHaveAttribute('aria-expanded', 'true')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(bell()).toHaveFocus()
  })
})
