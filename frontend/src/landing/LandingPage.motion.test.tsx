import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'
import { landingMotion } from './motion'
import { enterViewport, observers, stubLandingEnvironment } from './landingTestEnv'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

function renderLanding() {
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

// 0050/AC08: os tempos declarados são os das notas do Figma (238:745 a 238:776).
it('os tempos do movimento são os das notas do Figma', () => {
  expect(landingMotion).toMatchObject({
    heroEnterMs: 400, heroEnterOffsetPx: 12, heroEnterEasing: 'ease-out', heroCardDelayMs: 120,
    robotFloatMs: 3000, robotFloatPx: 4, robotFloatEasing: 'ease-in-out',
    beamOpacityMin: 0.35, beamOpacityMax: 0.6, heroChartDrawMs: 900, heroToastDelayMs: 1200,
    sceneStaggerMs: 80, faqToggleMs: 250, orbitTurnMs: 60000, assistantReplyDelayMs: 1200,
  })
  stubLandingEnvironment()
  const { container } = renderLanding()
  const root = container.querySelector<HTMLElement>('.lp')!
  expect(root.style.getPropertyValue('--lp-toast-delay')).toBe('1200ms')
  expect(root.style.getPropertyValue('--lp-orbit')).toBe('60000ms')
  expect(root.style.getPropertyValue('--lp-faq')).toBe('250ms')
})

describe('assistente', () => {
  it('ao chegar à área visível mostra "Preparando uma resposta…" e, 1,2 s depois, a resposta', () => {
    vi.useFakeTimers()
    stubLandingEnvironment()
    renderLanding()
    const chat = screen.getByRole('group', { name: 'Conversa ilustrativa com o assistente' })
    expect(chat).toHaveAttribute('data-phase', 'idle')
    act(() => enterViewport())
    expect(chat).toHaveAttribute('data-phase', 'typing')
    expect(within(chat).getAllByText('Preparando uma resposta…').length).toBeGreaterThan(0)
    act(() => { vi.advanceTimersByTime(landingMotion.assistantReplyDelayMs - 1) })
    expect(chat).toHaveAttribute('data-phase', 'typing')
    act(() => { vi.advanceTimersByTime(1) })
    expect(chat).toHaveAttribute('data-phase', 'done')
    expect(within(chat).queryByText('Preparando uma resposta…')).not.toBeInTheDocument()
  })

  // 0050/AC09: com movimento reduzido, a conversa já aparece completa.
  it('com movimento reduzido a conversa já está completa, sem a etapa "Preparando"', () => {
    stubLandingEnvironment({ reducedMotion: true })
    renderLanding()
    const chat = screen.getByRole('group', { name: 'Conversa ilustrativa com o assistente' })
    expect(chat).toHaveAttribute('data-phase', 'done')
    expect(within(chat).queryByText('Preparando uma resposta…')).not.toBeInTheDocument()
  })
})

// 0050/AC09: tudo no estado final, sem esperar a área visível.
it('com movimento reduzido as cenas e os passos já estão no estado final e os gráficos desenhados', () => {
  stubLandingEnvironment({ reducedMotion: true })
  const { container } = renderLanding()
  expect(container.querySelector('.lp-scenes')).toHaveAttribute('data-shown')
  expect(container.querySelector('.lp-steps')).toHaveAttribute('data-shown')
  for (const element of container.querySelectorAll<HTMLElement>('.lp-steps, .lp-demo__chart')) {
    expect(element.style.getPropertyValue('--progress')).toBe('1')
  }
  expect(container.querySelector('.lp')).toHaveAttribute('data-reduced-motion')
})

it('sem movimento reduzido, as cenas esperam a área visível', () => {
  stubLandingEnvironment()
  const { container } = renderLanding()
  expect(container.querySelector('.lp-scenes')).not.toHaveAttribute('data-shown')
  act(() => enterViewport())
  expect(container.querySelector('.lp-scenes')).toHaveAttribute('data-shown')
})

// 0050/AC10: decorativo, fora da árvore de acessibilidade e do foco; frase por seção.
describe('companheiro de rolagem', () => {
  function cross(section: string) {
    const target = document.querySelector(`[data-companion="${section}"]`)!
    act(() => {
      for (const { callback, targets } of observers) {
        if (targets.includes(target)) callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
      }
    })
  }

  it.each([
    ['problema', 'Tô de olho'], ['como-funciona', 'Tô de olho'], ['demonstracao', 'Achei uma queda'],
    ['por-que', 'Achei uma queda'], ['assistente', 'Pode deixar'], ['perguntas', 'Pode deixar'],
  ])('na seção %s mostra "%s"', (section, phrase) => {
    stubLandingEnvironment()
    const { container } = renderLanding()
    cross(section)
    const companion = container.querySelector('.lp-companion')!
    expect(companion).toHaveAttribute('aria-hidden', 'true')
    expect(companion).not.toHaveAttribute('data-hidden')
    expect(companion).toHaveTextContent(phrase)
    expect(companion.querySelector('a, button, [tabindex]')).toBeNull()
  })

  it.each(['inicio', 'comecar'])('some na seção %s', (section) => {
    stubLandingEnvironment()
    const { container } = renderLanding()
    cross('problema')
    cross(section)
    expect(container.querySelector('.lp-companion')).toHaveAttribute('data-hidden')
  })
})

// 0050/AC11: abre e fecha por clique e teclado; o estado é anunciado (aria-expanded).
it('cada pergunta abre e fecha por clique e por teclado, com aria-expanded', async () => {
  stubLandingEnvironment()
  renderLanding()
  const user = userEvent.setup()
  const first = screen.getByRole('button', { name: 'De onde vêm os preços?' })
  expect(first).toHaveAttribute('aria-expanded', 'true')
  await user.click(first)
  expect(first).toHaveAttribute('aria-expanded', 'false')
  const second = screen.getByRole('button', { name: 'Preciso preencher os dados do produto?' })
  second.focus()
  await user.keyboard('{Enter}')
  expect(second).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(/Você cola o link do anúncio e o BestPrice busca/)).toBeVisible()
  await user.keyboard(' ')
  expect(second).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getAllByRole('button', { name: /\?$/ })).toHaveLength(5)
})

// 0050/AC12: menu mobile — foco preso, Esc, botão de fechar, âncora, devolve o foco.
describe('menu mobile', () => {
  async function openMenu() {
    stubLandingEnvironment({ mobile: true })
    renderLanding()
    const user = userEvent.setup()
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    await user.click(toggle)
    return { user, toggle, menu: await screen.findByRole('dialog') }
  }

  it('mostra as âncoras e as ações e prende o foco enquanto aberto', async () => {
    const { user, menu } = await openMenu()
    const nav = within(menu).getByRole('navigation', { name: 'Menu' })
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Como funciona', 'Demonstração', 'Assistente', 'Perguntas'])
    expect(within(menu).getByRole('link', { name: /Começar a monitorar/ })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    for (let step = 0; step < 12; step += 1) {
      await user.tab()
      expect(menu.contains(document.activeElement)).toBe(true)
    }
  })

  it('fecha com Esc e devolve o foco ao botão', async () => {
    const { user, toggle } = await openMenu()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toggle).toHaveFocus()
  })

  it('fecha com o botão de fechar e devolve o foco ao botão', async () => {
    const { user, toggle, menu } = await openMenu()
    await user.click(within(menu).getByRole('button', { name: 'Fechar menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toggle).toHaveFocus()
  })

  it('fecha ao escolher uma âncora', async () => {
    const { user, menu } = await openMenu()
    const anchor = within(menu).getByRole('link', { name: 'Demonstração' })
    expect(anchor).toHaveAttribute('href', '#demonstracao')
    await user.click(anchor)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
