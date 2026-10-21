import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { formatAxisPrice, PriceHistoryChart } from './PriceHistoryChart'

afterEach(cleanup)

it('orienta quando nenhum preço válido está disponível sem desenhar uma série fictícia', () => {
  render(<PriceHistoryChart history={[]} partial={false} />)
  expect(screen.getByText('O gráfico aparece após o primeiro preço válido registrado.')).toBeInTheDocument()
  expect(screen.queryByRole('img', { name: /Evolução/ })).not.toBeInTheDocument()
})

it('identifica a cobertura parcial e oferece os valores exatos em ordem cronológica', async () => {
  render(<PriceHistoryChart partial history={[
    { id: 'new', price: '299.90', currency: 'BRL', captured_at: '2026-10-21T15:00:00Z' },
    { id: 'old', price: '349.90', currency: 'BRL', captured_at: '2026-10-20T15:00:00Z' },
  ]} />)
  expect(screen.getByText(/Exibindo os registros carregados/)).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Evolução do preço/ })).toBeInTheDocument()
  await userEvent.setup().click(screen.getByText('Ver registros de preço'))
  const prices = screen.getAllByRole('cell').map((cell) => cell.textContent?.replace(/\s/g, ' '))
  expect(prices.filter((text) => text?.includes('R$'))).toEqual(['R$ 349,90', 'R$ 299,90'])
})

it('não converte preços inválidos ou de outra moeda em um ponto de preço zero', () => {
  render(<PriceHistoryChart partial={false} history={[
    { id: 'invalid', price: 'invalid', currency: 'BRL', captured_at: '2026-10-21T15:00:00Z' },
    { id: 'other', price: '10', currency: 'USD', captured_at: '2026-10-21T15:00:00Z' },
  ]} />)
  expect(screen.getByText('O gráfico aparece após o primeiro preço válido registrado.')).toBeInTheDocument()
})

// 0028/AC07: o eixo mostra reais legíveis; nenhum "1,9 mil" sem moeda nem arredondamento enganoso.
it.each([
  [1900, 'R$ 1.900'],
  [1899.9, 'R$ 1.899,90'],
  [1850.5, 'R$ 1.850,50'],
  [279.9, 'R$ 279,90'],
  [299.99999999, 'R$ 300'],
])('formata o eixo %s como %s', (value, text) => {
  const formatted = formatAxisPrice(value).replace(/\s/g, ' ')
  expect(formatted).toBe(text)
  expect(formatted).not.toMatch(/mil/)
})

it('menciona "sem frete" uma única vez, no cabeçalho do detalhe', () => {
  render(<PriceHistoryChart partial={false} history={[{ id: 'a', price: '10.00', currency: 'BRL', captured_at: '2026-10-21T15:00:00Z' }]} />)
  expect(screen.queryByText(/sem frete/)).not.toBeInTheDocument()
})
