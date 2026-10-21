import { describe, expect, it } from 'vitest'
import { normalizeTargetPrice, targetPriceInput } from './targetPrice'

describe('normalizeTargetPrice (0028/AC02)', () => {
  it.each([
    ['99,90', '99.90'],
    ['99.90', '99.90'],
    ['1.899,90', '1899.90'],
    ['1899,9', '1899.90'],
    ['1899', '1899.00'],
    ['1.899', '1899.00'],
    ['  R$ 279,90 ', '279.90'],
    ['R$ 1.234.567,8', '1234567.80'],
    ['0,50', '0.50'],
    ['007,10', '7.10'],
  ])('aceita %j e envia %j', (typed, sent) => {
    expect(normalizeTargetPrice(typed)).toBe(sent)
  })

  it.each([
    '', 'abc', '99,999', '9,9,9', '1.89,90', '12.3456', '-5,00', '0', '0,00', '1e3', '99,', ',90', '1 899,90',
    '12345678901234567,00',
  ])('recusa %j sem converter para number', (typed) => {
    expect(normalizeTargetPrice(typed)).toBeNull()
  })
})

describe('targetPriceInput', () => {
  it('exibe o alvo da API com vírgula, sem separador de milhar', () => {
    expect(targetPriceInput('1899.90')).toBe('1899,90')
    expect(targetPriceInput('99.90')).toBe('99,90')
  })
})
