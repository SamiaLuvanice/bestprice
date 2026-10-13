import { describe, expect, it } from 'vitest'
import { safeHttpsUrl } from './url'

describe('safeHttpsUrl', () => {
  it('aceita somente endereços https', () => {
    expect(safeHttpsUrl('https://produto.mercadolivre.com.br/MLB-1-x-_JM')).toBe('https://produto.mercadolivre.com.br/MLB-1-x-_JM')
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpsUrl('JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeHttpsUrl('http://exemplo.com/a.jpg')).toBeNull()
    expect(safeHttpsUrl('data:image/png;base64,AAAA')).toBeNull()
    expect(safeHttpsUrl('/relativo')).toBeNull()
    expect(safeHttpsUrl(null)).toBeNull()
  })
})
