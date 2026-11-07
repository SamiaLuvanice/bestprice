import { cleanup, render, screen } from '@testing-library/react'
import { cloneElement, isValidElement, type ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { formatAxisPrice } from '../lib/format'
import { PriceHistoryChart } from './PriceHistoryChart'

afterEach(cleanup)

// jsdom não mede layout: o ResponsiveContainer ficaria com 0 px e não desenharia o SVG.
// O dublê entrega uma dimensão fixa ao gráfico; o resto do Recharts é o real.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof import('recharts')>()
  return {
    ...recharts,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement<{ width?: number; height?: number }>(children) ? cloneElement(children, { width: 800, height: 400 }) : children,
  }
})

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

// 0049/AC10: série em degraus, ponto atual só na última leitura e alvo tracejado opcional.
const readings = [
  { id: 'a', price: '349.90', currency: 'BRL', captured_at: '2026-10-01T12:00:00Z' },
  { id: 'b', price: '319.90', currency: 'BRL', captured_at: '2026-10-04T12:00:00Z' },
  { id: 'c', price: '299.90', currency: 'BRL', captured_at: '2026-10-07T12:00:00Z' },
]

it('desenha degraus com área e um único ponto atual, na última leitura', () => {
  const { container } = render(<PriceHistoryChart partial={false} history={readings} />)
  expect(container.querySelector('.recharts-area-area')).not.toBeNull()
  expect(container.querySelector('.recharts-line-curve')).not.toBeNull()
  expect(container.querySelectorAll('.recharts-line-dot, .recharts-dot:not([data-current])')).toHaveLength(0)
  const current = container.querySelectorAll('[data-current="true"]')
  expect(current).toHaveLength(1)
  expect(current[0]).toHaveAttribute('data-price', '299.90')
})

it('sem preço-alvo, não desenha a linha tracejada', () => {
  const { container } = render(<PriceHistoryChart partial={false} history={readings} />)
  expect(container.querySelector('.recharts-reference-line')).toBeNull()
})

it('com preço-alvo, desenha a linha tracejada rosa do alvo', () => {
  const { container } = render(<PriceHistoryChart partial={false} history={readings} targetPrice="279.90" />)
  const line = container.querySelector('.recharts-reference-line-line')
  expect(line).not.toBeNull()
  expect(line).toHaveAttribute('stroke', 'var(--chart-3)')
  expect(line?.getAttribute('stroke-dasharray')).toBeTruthy()
})

it('preço-alvo inválido não vira linha', () => {
  const { container } = render(<PriceHistoryChart partial={false} history={readings} targetPrice="abc" />)
  expect(container.querySelector('.recharts-reference-line')).toBeNull()
})

it('com uma única leitura, mostra só o ponto, sem degrau nem área', () => {
  const { container } = render(<PriceHistoryChart partial={false} history={[readings[0]]} />)
  expect(container.querySelector('.recharts-line-curve')).toBeNull()
  expect(container.querySelector('.recharts-area-area')).toBeNull()
  expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(1)
})
