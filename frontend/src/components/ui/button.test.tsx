import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Button } from './button'

afterEach(cleanup)

// 0049/AC05: variantes do Figma 2026 pela correspondência action → default, default → brand.
it.each(['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const)('renderiza a variante %s em data-variant', (variant) => {
  render(<Button variant={variant}>Salvar</Button>)
  expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('data-variant', variant)
})

it.each([
  ['default', 'h-11'],
  ['sm', 'h-9'],
  ['lg', 'h-13'],
  ['icon', 'size-11'],
] as const)('o tamanho %s usa a altura do Figma (%s)', (size, height) => {
  render(<Button size={size} aria-label="Ação">A</Button>)
  const button = screen.getByRole('button', { name: 'Ação' })
  expect(button).toHaveAttribute('data-size', size)
  expect(button.className).toContain(height)
  expect(button.className).toContain('rounded-full')
})

it('carregando: anuncia ocupado, fica indisponível e mostra o indicador sem trocar o rótulo', async () => {
  const onClick = vi.fn()
  render(<Button loading onClick={onClick}>Entrar</Button>)
  const button = screen.getByRole('button', { name: 'Entrar' })
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('data-loading', 'true')
  expect(button.querySelector('[data-slot="button-spinner"]')).toBeInTheDocument()
  await userEvent.setup().click(button)
  expect(onClick).not.toHaveBeenCalled()
})

it('sem carregar: não anuncia ocupado nem mostra o indicador', () => {
  render(<Button>Entrar</Button>)
  const button = screen.getByRole('button', { name: 'Entrar' })
  expect(button).not.toHaveAttribute('aria-busy')
  expect(button).toBeEnabled()
  expect(button.querySelector('[data-slot="button-spinner"]')).toBeNull()
})

it('a ação principal tem o brilho do Figma no hover', () => {
  render(<Button>Monitorar</Button>)
  expect(screen.getByRole('button', { name: 'Monitorar' }).className).toContain('hover:shadow-[var(--shadow-action-glow)]')
})
