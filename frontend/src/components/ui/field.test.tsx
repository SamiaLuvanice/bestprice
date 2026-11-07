import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Field } from './field'
import { Input } from './input'

afterEach(cleanup)

// 0049/AC05 (Input/Field do Figma): rótulo, descrição, erro e contador ligados ao controle.
it('liga rótulo e descrição ao controle', () => {
  render(<Field label="E-mail" description="Usamos só para entrar."><Input type="email" /></Field>)
  const input = screen.getByRole('textbox', { name: 'E-mail' })
  expect(input).toHaveAccessibleDescription('Usamos só para entrar.')
  expect(input).not.toHaveAttribute('aria-invalid')
})

it('com erro: marca o controle inválido e descreve pelo erro, além da descrição', () => {
  render(<Field label="E-mail" description="Usamos só para entrar." error="Informe um e-mail válido."><Input type="email" /></Field>)
  const input = screen.getByRole('textbox', { name: 'E-mail' })
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Usamos só para entrar. Informe um e-mail válido.')
  expect(screen.getByText('Informe um e-mail válido.').closest('[data-slot="field"]')).toHaveAttribute('data-invalid', 'true')
})

it('preserva id e descrição próprios do controle', () => {
  render(<><p id="extra">Dica externa.</p><Field label="Nome"><Input id="name" aria-describedby="extra" /></Field></>)
  const input = screen.getByRole('textbox', { name: 'Nome' })
  expect(input).toHaveAttribute('id', 'name')
  expect(input).toHaveAccessibleDescription('Dica externa.')
})

it.each([
  [100, 2000, false],
  [1599, 2000, false],
  [1600, 2000, true],
  [2000, 2000, true],
])('contador com %s de %s caracteres aparece: %s', (length, max, visible) => {
  render(<Field label="Mensagem" count={{ length, max }}><Input /></Field>)
  const counter = screen.queryByText(`${length.toLocaleString('pt-BR')} de ${max.toLocaleString('pt-BR')} caracteres`)
  if (visible) {
    expect(counter).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveAccessibleDescription(counter!.textContent!)
  } else expect(counter).toBeNull()
})
