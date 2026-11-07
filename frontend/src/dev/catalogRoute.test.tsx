import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../App'
import { fakeApi } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

function visitCatalog() {
  fakeApi()
  window.history.replaceState({}, '', '/dev/design-system')
  render(<App />)
}

// 0049/AC06: o catálogo só existe no servidor de desenvolvimento.
it('no servidor de desenvolvimento, /dev/design-system abre o catálogo', async () => {
  vi.stubEnv('DEV', true)
  visitCatalog()
  expect(await screen.findByRole('heading', { level: 1, name: 'Design system BestPrice 2026' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeNull()
})

it('fora do desenvolvimento, o mesmo endereço mostra a página não encontrada', async () => {
  vi.stubEnv('DEV', false)
  visitCatalog()
  expect(await screen.findByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Design system BestPrice 2026' })).toBeNull()
})
