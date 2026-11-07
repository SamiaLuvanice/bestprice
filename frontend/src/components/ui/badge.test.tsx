import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Badge } from './badge'

afterEach(cleanup)

// 0049/AC05: dez variantes do Figma; as seis de status têm ícone decorativo e texto (a cor não é o único sinal).
it.each(['default', 'secondary', 'destructive', 'outline'] as const)('renderiza a variante %s sem ícone', (variant) => {
  render(<Badge variant={variant}>Ativo</Badge>)
  const badge = screen.getByText('Ativo')
  expect(badge).toHaveAttribute('data-variant', variant)
  expect(badge.querySelector('svg')).toBeNull()
})

it.each(['down', 'up', 'stable', 'target', 'stale', 'unverified'] as const)('a variante de status %s mostra ícone decorativo e texto', (variant) => {
  render(<Badge variant={variant}>Situação</Badge>)
  const badge = screen.getByText('Situação')
  expect(badge).toHaveAttribute('data-variant', variant)
  const icon = badge.querySelector('svg')
  expect(icon).not.toBeNull()
  expect(icon).toHaveAttribute('aria-hidden', 'true')
  expect(badge).toHaveTextContent('Situação')
})
