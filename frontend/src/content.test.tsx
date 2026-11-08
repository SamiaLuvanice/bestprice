import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { emptyDashboard, fakeApi } from './test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const sourceRoot = join(process.cwd(), 'src')

// Código da interface: exclui testes e o apoio de testes, onde dados de exemplo são permitidos.
function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return name === 'test' ? [] : sourceFiles(path)
    return /\.(ts|tsx|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

// “prime” com limite de palavra: “primeiro/primeira” são textos legítimos da interface.
const forbidden: [string, RegExp][] = [
  ['Amazon', /amazon/i],
  ['prime', /\bprime\b/i],
  ['estrelas/avaliações', /estrela|★|☆|avalia[çc]|\brating|\bstars?\b/i],
  ['preço fixo', /R\$\s*\d/],
]

/** Achados proibidos de um arquivo; a regra das exceções fica isolada para ser testada. */
function findingsFor(file: string, text: string): string[] {
  return forbidden.filter(([label, pattern]) => {
    // Orçamento ilustrativo aprovado na 0044; não é preço de oferta/produto.
    // A exceção exata não libera outros valores nem outras superfícies.
    const content = label === 'preço fixo' && file === join(sourceRoot, 'features', 'research', 'AssistantPage.tsx')
      ? text.replace("'Ex.: notebook para estudar, até R$ 3.500'", "''")
      : label === 'preço fixo' && file === join(sourceRoot, 'landing', 'content.ts')
        ? withoutApprovedLandingPrices(text)
        : text
    return pattern.test(content)
  }).map(([label]) => `${relative(sourceRoot, file)}: ${label}`)
}

// 0050: valores ilustrativos da landing, iguais aos dos quadros do Figma (snapshot
// designsystem/landing/figma-landing-texts-2026-11.json). Lista fechada: cada valor é retirado do
// texto de landing/content.ts antes da regra; qualquer outro "R$ …" (mesmo nesse arquivo) falha.
const approvedLandingPrices = [
  'R$ 1.849,00', 'R$ 1.949,00', 'R$ 2.199,00', 'R$ 1.900,00', 'R$ 2.049,00', 'R$ 100,00',
  'R$ 1.849', 'R$ 1.900', 'R$ 2.049', 'R$ 1.949', 'R$ 1.999', 'R$ 2.189', 'R$ 2.099',
  'R$ 4.000', 'R$ 3.599', 'R$ 3.999', 'R$ 300',
]

function withoutApprovedLandingPrices(text: string): string {
  // Valores mais longos primeiro, para "R$ 1.849,00" não virar ",00" depois de tirar "R$ 1.849".
  return [...approvedLandingPrices].sort((a, b) => b.length - a.length)
    .reduce((content, value) => content.split(value).join(''), text)
}

describe('conteúdo da interface', () => {
  it('não cita Amazon, prime, estrelas, avaliações nem preços fixos no código da interface', () => {
    const files = sourceFiles(sourceRoot)
    expect(files.length).toBeGreaterThan(10)
    const findings = files.flatMap((file) => findingsFor(file, readFileSync(file, 'utf-8')))
    expect(findings).toEqual([])
  })

  it('a exceção da landing aceita só os valores do Figma: um preço novo em landing/content.ts falha', () => {
    const file = join(sourceRoot, 'landing', 'content.ts')
    const text = readFileSync(file, 'utf-8')
    expect(findingsFor(file, text)).toEqual([])
    const withNewPrice = [text, "export const extra = 'R$ 9,99'"].join('\n')
    expect(findingsFor(file, withNewPrice)).toEqual([expect.stringMatching(/content\.ts: preço fixo$/)])
  })

  it('não confunde “primeiro” com o termo proibido', () => {
    const prime = forbidden.find(([label]) => label === 'prime')?.[1]
    expect(prime?.test('desde o primeiro registro no BestPrice')).toBe(false)
    expect(prime?.test('frete Prime')).toBe(true)
  })

  it('não mostra nenhum produto, preço ou evento quando a API devolve lista vazia', async () => {
    fakeApi(() => undefined, emptyDashboard)
    window.history.replaceState(null, '', '/app/monitoring/overview')
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Você ainda não está acompanhando nenhum produto.')
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Alertas' }))
    await waitFor(() => expect(screen.getByText('Nenhuma notificação por enquanto.')).toBeInTheDocument())
    expect(screen.queryAllByRole('rowgroup')).toHaveLength(0)
    expect(document.body).not.toHaveTextContent(/R\$|Amazon|\bprime\b/i)
  })
})
