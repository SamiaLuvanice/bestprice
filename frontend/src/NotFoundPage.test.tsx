import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { NotFoundPage } from './NotFoundPage'

afterEach(cleanup)

it.each([false, true])('oferece recuperação adequada à sessão: %s', (authenticated) => {
  render(<MemoryRouter><NotFoundPage authenticated={authenticated} /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Este endereço saiu do radar.' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: authenticated ? 'Ir para Início' : 'Entrar' })).toHaveAttribute('href', authenticated ? '/' : '/login')
})

it('volta à página anterior por ação explícita', async () => {
  render(<MemoryRouter initialEntries={['/origem', '/inexistente']}><Routes>
    <Route path="/origem" element={<h1>Página anterior</h1>} />
    <Route path="*" element={<NotFoundPage authenticated={false} />} />
  </Routes></MemoryRouter>)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Voltar uma página' }))
  expect(screen.getByRole('heading', { name: 'Página anterior' })).toBeInTheDocument()
})
