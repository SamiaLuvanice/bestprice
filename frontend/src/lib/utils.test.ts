import { expect, it } from 'vitest'
import { cn } from './utils'

it('mantém o estilo de texto do Figma junto da cor de texto', () => {
  expect(cn('text-button-m', 'text-action-foreground')).toBe('text-button-m text-action-foreground')
  expect(cn('text-button-m', 'text-button-s')).toBe('text-button-s')
})
