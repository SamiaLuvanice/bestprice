import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../App'
import { fakeApi } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function visitCatalog() {
  // jsdom não tem matchMedia; a Sidebar do catálogo consulta a largura (hooks/use-mobile).
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
  fakeApi()
  window.history.replaceState({}, '', '/dev/design-system')
  render(<App />)
}

// 0049/AC06: o catálogo só existe no servidor de desenvolvimento.
it('no servidor de desenvolvimento, /dev/design-system abre o catálogo', async () => {
  vi.stubEnv('DEV', true)
  visitCatalog()
  // O catálogo é um chunk grande carregado por lazy import; sob a suíte paralela leva mais que 6 s.
  expect(await screen.findByRole('heading', { level: 1, name: 'Design system BestPrice 2026' }, { timeout: 14_000 })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeNull()
})

it('fora do desenvolvimento, o mesmo endereço mostra a página não encontrada', async () => {
  vi.stubEnv('DEV', false)
  visitCatalog()
  expect(await screen.findByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Design system BestPrice 2026' })).toBeNull()
})
