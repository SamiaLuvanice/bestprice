import { describe, expect, it } from 'vitest'
import { compareDecimal, isDecimal, parseDecimal } from './decimal'

describe('compareDecimal', () => {
  it.each([
    ['99.90', '100.00', -1],
    ['100.10', '100.09', 1],
    ['1079.00', '1079.0', 0],
    ['1079', '1079.00', 0],
    ['-0.00', '0', 0],
    ['007.50', '7.5', 0],
    ['-5.00', '-4.99', -1],
    ['-10', '2', -1],
    ['3', '-3', 1],
    ['0.001', '0.0009', 1],
    ['123456789012345678901234567890.01', '123456789012345678901234567890.02', -1],
  ] as const)('%s comparado a %s = %i', (a, b, expected) => {
    expect(compareDecimal(a, b)).toBe(expected)
  })

  it.each([['abc', '1.00'], ['1.00', ''], ['1,00', '1.00'], ['1e3', '1000'], [' 1', '1'], ['.5', '0.5'], ['5.', '5']])(
    'devolve null quando algum valor não é decimal (%s, %s)', (a, b) => {
      expect(compareDecimal(a, b)).toBeNull()
    })
})

describe('isDecimal e parseDecimal', () => {
  it('aceita somente notação decimal simples', () => {
    expect(isDecimal('1079.00')).toBe(true)
    expect(isDecimal('-20.00')).toBe(true)
    expect(isDecimal('abc')).toBe(false)
    expect(isDecimal('NaN')).toBe(false)
    expect(isDecimal('Infinity')).toBe(false)
  })

  it('normaliza sinal e zeros sem converter para ponto flutuante', () => {
    expect(parseDecimal('-0.00')).toEqual({ negative: false, integer: '0', fraction: '' })
    expect(parseDecimal('0012.3400')).toEqual({ negative: false, integer: '12', fraction: '34' })
    expect(parseDecimal('-1.50')).toEqual({ negative: true, integer: '1', fraction: '5' })
    expect(parseDecimal('x')).toBeNull()
  })
})
