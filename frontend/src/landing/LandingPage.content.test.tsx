import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'
import { stubLandingEnvironment } from './landingTestEnv'

// 0050/AC01: o texto renderizado de cada seção contém os textos do quadro do Figma (snapshot
// conferido por hash em designsystem/landing/), com o selo ajustado de `approvedChanges`.
type Section = { section: string; nodeId: string; texts: string[] }
type Snapshot = {
  approvedChanges: { figma: string; product: string }[]
  faqAnswers: Record<string, string>
  desktop: { sections: Section[] }
  mobile: { sections: Section[] }
  mobileMenu: { texts: string[] }
}
const snapshot = JSON.parse(readFileSync(join(process.cwd(), '../designsystem/landing/figma-landing-texts-2026-11.json'), 'utf-8')) as Snapshot
const approved = new Map(snapshot.approvedChanges.map((change) => [change.figma, change.product]))
const removedHeroLead = 'Cole o link de um anúncio do Mercado Livre uma única vez.'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

function occurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1
}

/** Texto visível de um quadro: tira as versões da outra largura e inclui os placeholders. */
function renderedText(attribute: 'data-figma-desktop' | 'data-figma-mobile', nodeId: string, hide: string) {
  return Array.from(document.querySelectorAll(`[${attribute}="${nodeId}"]`)).map((root) => {
    const copy = root.cloneNode(true) as Element
    copy.querySelectorAll(hide).forEach((element) => element.remove())
    const placeholders = Array.from(copy.querySelectorAll('[placeholder]'), (element) => element.getAttribute('placeholder'))
    return normalize(`${copy.textContent ?? ''} ${placeholders.join(' ')}`)
  }).join(' ')
}

function missingTexts(sections: Section[], attribute: 'data-figma-desktop' | 'data-figma-mobile', hide: string) {
  const missing: string[] = []
  for (const section of sections) {
    const text = renderedText(attribute, section.nodeId, hide)
    const expected = new Map<string, number>()
    for (const raw of section.texts) {
      if (raw.startsWith(removedHeroLead)) continue
      const value = normalize(approved.get(raw) ?? raw)
      expected.set(value, (expected.get(value) ?? 0) + 1)
    }
    for (const [value, count] of expected) {
      if (occurrences(text, value) < count) missing.push(`${section.section}: "${value}" (${count}×)`)
    }
  }
  return missing
}

function renderLanding() {
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

it.each([
  ['desktop (238:294)', false, 'data-figma-desktop', '.lp-mobile'],
  ['mobile (239:180)', true, 'data-figma-mobile', '.lp-desktop'],
] as const)('a landing %s segue a ordem do quadro e os textos aprovados', (_frame, mobile, attribute, hide) => {
  stubLandingEnvironment({ mobile })
  renderLanding()
  const sections = mobile ? snapshot.mobile.sections : snapshot.desktop.sections
  const order = [...new Set(Array.from(document.querySelectorAll(`[${attribute}]`), (element) => element.getAttribute(attribute)))]
  expect(order).toEqual(sections.map((section) => section.nodeId))
  expect(missingTexts(sections, attribute, hide)).toEqual([])
  expect(screen.queryByText(removedHeroLead, { exact: false })).not.toBeInTheDocument()
})

it('o selo do hero usa o texto ajustado, não o do Figma', () => {
  stubLandingEnvironment()
  renderLanding()
  expect(screen.getByText('Só o link, nada para preencher')).toBeInTheDocument()
  expect(screen.queryByText('Só o link, nenhum cadastro')).not.toBeInTheDocument()
})

it('as respostas da FAQ são as do snapshot', async () => {
  stubLandingEnvironment()
  renderLanding()
  const user = userEvent.setup()
  for (const [question, answer] of Object.entries(snapshot.faqAnswers)) {
    const trigger = screen.getByRole('button', { name: question })
    if (trigger.getAttribute('aria-expanded') !== 'true') await user.click(trigger)
    expect(screen.getByText(answer)).toBeVisible()
  }
})

it('o menu aberto do mobile mostra os itens do quadro 239:856', async () => {
  stubLandingEnvironment({ mobile: true })
  renderLanding()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Abrir menu' }))
  const menu = await screen.findByRole('dialog')
  const text = normalize(menu.textContent ?? '')
  expect(snapshot.mobileMenu.texts.filter((value) => !text.includes(value))).toEqual([])
})

it('o título da aba é o da spec 0051 e a marca é "BestPrice", sem "AI"', () => {
  document.title = 'BestPrice'
  stubLandingEnvironment()
  renderLanding()
  expect(document.title).toBe('Monitor de preços do Mercado Livre · BestPrice')
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pare de dar F5 no preço.')
  expect(screen.getByRole('link', { name: 'BestPrice — Início' })).toBeInTheDocument()
  expect(document.body.textContent).not.toMatch(/BestPrice AI\b/)
})
