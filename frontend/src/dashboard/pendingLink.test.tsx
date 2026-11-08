import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { savePendingTrackLink, takePendingTrackLink } from '../navigation/pendingTrackLink'
import { dashboardWith, fakeApi, reply, trackedFixture } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.sessionStorage.clear()
})

const clock = () => new Date('2026-10-11T18:00:00Z')
const link = 'https://produto.mercadolivre.com.br/MLB-3333333333-liquidificador-_JM'

function field() {
  return screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre', hidden: true })
}

async function openMonitoring(strict = false, dashboard: unknown = dashboardWith([trackedFixture()])) {
  window.history.replaceState(null, '', '/app/monitoring')
  const mockFetch = fakeApi(() => undefined, dashboard)
  const app = <App clock={clock} />
  render(strict ? <StrictMode>{app}</StrictMode> : app)
  await screen.findByRole('heading', { level: 1, name: 'Seus produtos' })
  await waitFor(() => expect(screen.getByRole('region', { name: 'Seus produtos' })).toHaveAttribute('aria-busy', 'false'))
  return mockFetch
}

describe('link trazido da landing no monitoramento', () => {
  it.each([false, true])('abre preenchido, com foco e sem enviar (StrictMode: %s)', async (strict) => {
    savePendingTrackLink(link)
    const mockFetch = await openMonitoring(strict)
    expect(field()).toBeVisible()
    expect(field()).toHaveValue(link)
    await waitFor(() => expect(field()).toHaveFocus())
    // Espera os quadros de foco já agendados pela página (rAF do jsdom em ordem de chegada): dois
    // quadros depois deles, o campo continua com o foco. Sem relógio real, o teste não depende da carga.
    await act(() => new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))))
    expect(field()).toHaveFocus()
    expect(mockFetch.mock.calls.some(([, init]) => (init?.method ?? 'GET') !== 'GET')).toBe(false)
    expect(mockFetch.mock.calls.some(([url, init]) => String(url).includes('MLB-3333333333') || String(init?.body ?? '').includes('MLB-3333333333'))).toBe(false)
  })

  it('sem produtos, o convite aberto também vem preenchido', async () => {
    savePendingTrackLink(link)
    await openMonitoring(false, dashboardWith([]))
    expect(field()).toHaveValue(link)
    await waitFor(() => expect(field()).toHaveFocus())
  })

  it('um segundo acesso ao monitoramento vem vazio', async () => {
    savePendingTrackLink(link)
    await openMonitoring()
    expect(field()).toHaveValue(link)
    cleanup()
    vi.unstubAllGlobals()
    await openMonitoring()
    expect(field()).toHaveValue('')
    expect(screen.getByRole('button', { name: /Adicionar anúncio/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('ao sair e voltar para Produtos na mesma sessão, o campo vem vazio e o título recebe o foco', async () => {
    savePendingTrackLink(link)
    await openMonitoring()
    expect(field()).toHaveValue(link)
    const user = userEvent.setup()
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: /Alertas/ }))
    await screen.findByRole('heading', { level: 1, name: 'Alertas' })
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: /Produtos/ }))
    await screen.findByRole('heading', { level: 1, name: 'Seus produtos' })
    expect(field()).toHaveValue('')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Seus produtos' })).toHaveFocus())
  })

  // Revisão (rodada 4): no endereço legado /produtos (área não embutida no shell) o link também é
  // mostrado, preenchido e com foco — ele não é consumido sem aparecer.
  it('no endereço legado /produtos o link também aparece preenchido', async () => {
    savePendingTrackLink(link)
    window.history.replaceState(null, '', '/produtos')
    fakeApi(() => undefined, dashboardWith([trackedFixture()]))
    render(<App clock={clock} />)
    await screen.findByRole('heading', { level: 1, name: 'Seus produtos' })
    await waitFor(() => expect(field()).toHaveValue(link))
    await waitFor(() => expect(field()).toHaveFocus())
  })

  it('sem link pendente, nada muda', async () => {
    await openMonitoring()
    expect(field()).toHaveValue('')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Seus produtos' })).toHaveFocus())
  })

  // Revisão (rodada 4): Sair descarta o link pendente; outra conta na mesma aba não o recebe.
  it('Sair descarta o link pendente da aba', async () => {
    window.history.replaceState(null, '', '/app/monitoring/alerts')
    fakeApi((url) => url === '/api/auth/logout' ? reply(204, null) : undefined, dashboardWith([trackedFixture()]))
    render(<App clock={clock} />)
    await screen.findByRole('heading', { level: 1, name: 'Alertas' })
    savePendingTrackLink(link)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Conta:/ }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    await screen.findByRole('heading', { name: 'Entrar na sua conta' })
    expect(takePendingTrackLink()).toBeNull()
  })
})
