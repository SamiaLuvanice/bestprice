import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Button } from './ui/button'
import { EmptyState } from './EmptyState'
import { PriceChartCard } from './PriceChartCard'

afterEach(cleanup)

it('estado vazio: título, texto e ação; o mascote é decorativo', () => {
  render(<EmptyState title="Nada por aqui" description="Cole um link para começar." action={<Button>Monitorar</Button>} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Nada por aqui' })).toBeInTheDocument()
  expect(screen.getByText('Cole um link para começar.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Monitorar' })).toBeInTheDocument()
  expect(screen.queryByRole('img')).toBeNull()
})

it('card de gráfico mostra título, preço como recebido e o conteúdo', () => {
  render(<PriceChartCard title="Histórico" price="R$ 299,90"><p>gráfico</p></PriceChartCard>)
  expect(screen.getByText('Histórico')).toBeInTheDocument()
  expect(screen.getByText('R$ 299,90')).toHaveClass('text-data-price-m')
  expect(screen.getByText('gráfico')).toBeInTheDocument()
})
