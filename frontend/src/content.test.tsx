import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

describe('conteúdo da interface', () => {
  it('não cita Amazon, prime, estrelas, avaliações nem preços fixos no código da interface', () => {
    const files = sourceFiles(sourceRoot)
    expect(files.length).toBeGreaterThan(10)
    const findings = files.flatMap((file) => {
      const text = readFileSync(file, 'utf-8')
      return forbidden.filter(([, pattern]) => pattern.test(text)).map(([label]) => `${relative(sourceRoot, file)}: ${label}`)
    })
    expect(findings).toEqual([])
  })

  it('não confunde “primeiro” com o termo proibido', () => {
    const prime = forbidden.find(([label]) => label === 'prime')?.[1]
    expect(prime?.test('desde o primeiro registro no BestPrice')).toBe(false)
    expect(prime?.test('frete Prime')).toBe(true)
  })

  it('não mostra nenhum produto, preço ou evento quando a API devolve lista vazia', async () => {
    fakeApi(() => undefined, emptyDashboard)
    render(<App />)
    await screen.findByText('Você ainda não está acompanhando nenhum produto.')
    await waitFor(() => expect(screen.getByText('Nenhuma notificação por enquanto.')).toBeInTheDocument())
    expect(screen.queryAllByRole('rowgroup')).toHaveLength(0)
    expect(document.body).not.toHaveTextContent(/R\$|Amazon|\bprime\b/i)
  })
})
