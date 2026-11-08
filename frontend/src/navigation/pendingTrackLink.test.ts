import { afterEach, describe, expect, it, vi } from 'vitest'
import { savePendingTrackLink, takePendingTrackLink } from './pendingTrackLink'

describe('link pendente do hero', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.sessionStorage.clear()
  })

  it('guarda o link aparado e entrega uma única vez', () => {
    savePendingTrackLink('  https://produto.mercadolivre.com.br/MLB-1  ')
    expect(takePendingTrackLink()).toBe('https://produto.mercadolivre.com.br/MLB-1')
    expect(takePendingTrackLink()).toBeNull()
  })

  it('um novo envio substitui o anterior', () => {
    savePendingTrackLink('https://produto.mercadolivre.com.br/MLB-1')
    savePendingTrackLink('https://produto.mercadolivre.com.br/MLB-2')
    expect(takePendingTrackLink()).toBe('https://produto.mercadolivre.com.br/MLB-2')
  })

  it('não guarda o link no localStorage, só na aba', () => {
    savePendingTrackLink('https://produto.mercadolivre.com.br/MLB-1')
    expect(window.localStorage.length).toBe(0)
  })

  it('devolve null quando não há link', () => {
    expect(takePendingTrackLink()).toBeNull()
  })

  it('ignora armazenamento indisponível sem lançar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(() => savePendingTrackLink('https://produto.mercadolivre.com.br/MLB-1')).not.toThrow()
    expect(takePendingTrackLink()).toBeNull()
  })
})
