import { describe, expect, it } from 'vitest'
import { formatAbsolute, formatMoney, formatPercentage, formatRelative, retryHint } from './format'

const timeZone = 'America/Sao_Paulo'
// São Paulo está em UTC−3 em outubro de 2026 (sem horário de verão).
const local = (value: string) => new Date(`${value}-03:00`)
const plain = (text: string | null) => text?.replace(/\s/g, ' ') ?? null

describe('formatRelative — tabela do AC26', () => {
  it.each([
    ['2026-10-11T15:00:00', '2026-10-11T14:59:30', 'Agora'],
    ['2026-10-11T15:00:00', '2026-10-11T14:15:00', 'Há 45 min'],
    ['2026-10-11T15:00:00', '2026-10-11T03:00:00', 'Há 12 h'],
    ['2026-10-11T15:00:00', '2026-10-10T20:15:00', 'Há 18 h'],
    ['2026-10-11T09:00:00', '2026-10-10T08:15:00', 'Ontem, 08:15'],
    ['2026-10-11T15:00:00', '2026-10-08T09:05:00', '08/10/2026, 09:05'],
    ['2026-10-11T15:00:00', '2026-10-11T15:02:00', 'Agora'],
  ])('agora %s, instante %s → %s', (now, instant, expected) => {
    expect(formatRelative(local(instant).toISOString(), local(now), timeZone)).toBe(expected)
  })
})

describe('formatRelative — bordas', () => {
  const now = local('2026-10-11T15:00:00')
  it.each([
    ['2026-10-11T14:59:01', 'Agora'],
    ['2026-10-11T14:59:00', 'Há 1 min'],
    ['2026-10-11T14:00:01', 'Há 59 min'],
    ['2026-10-11T14:00:00', 'Há 1 h'],
    ['2026-10-10T15:00:01', 'Há 23 h'],
    ['2026-10-10T15:00:00', 'Ontem, 15:00'],
    ['2026-10-09T23:59:00', '09/10/2026, 23:59'],
  ])('%s → %s', (instant, expected) => {
    expect(formatRelative(local(instant).toISOString(), now, timeZone)).toBe(expected)
  })

  it('usa o dia civil do fuso informado, não o de UTC', () => {
    // 22:00 local de 09/10 é 01:00Z de 10/10: em UTC pareceria “ontem”, no fuso local não é.
    expect(formatRelative('2026-10-10T01:00:00Z', local('2026-10-11T01:00:00'), timeZone)).toBe('09/10/2026, 22:00')
    // 20:00 local de 09/10 é 23:00Z de 09/10 e agora (22:00 local de 10/10) já é 11/10 em UTC.
    expect(formatRelative('2026-10-09T23:00:00Z', local('2026-10-10T22:00:00'), timeZone)).toBe('Ontem, 20:00')
  })

  it('devolve null para instante inválido', () => {
    expect(formatRelative('ontem', now, timeZone)).toBeNull()
  })

  it('formata o instante completo para foco e ponteiro', () => {
    expect(formatAbsolute('2026-10-11T17:59:30Z', timeZone)).toBe('11/10/2026, 14:59:30')
  })
})

describe('retryHint', () => {
  it.each([
    [0, 'Tente novamente agora.'],
    [1, 'Tente novamente em 1 segundo.'],
    [30, 'Tente novamente em 30 segundos.'],
    [59, 'Tente novamente em 59 segundos.'],
    [60, 'Tente novamente em 1 minuto.'],
    [90, 'Tente novamente em 2 minutos.'],
  ])('%i s → %s', (seconds, expected) => {
    expect(retryHint(seconds)).toBe(expected)
  })
})

describe('formatMoney', () => {
  it('formata string decimal em reais sem perder precisão', () => {
    expect(plain(formatMoney('1079.00'))).toBe('R$ 1.079,00')
    expect(plain(formatMoney('99.9'))).toBe('R$ 99,90')
    expect(plain(formatMoney('12345678901234567.89'))).toBe('R$ 12.345.678.901.234.567,89')
  })

  it('não mostra sinal em zero negativo', () => {
    expect(plain(formatMoney('-0.00'))).toBe('R$ 0,00')
    expect(plain(formatMoney('-0'))).toBe('R$ 0,00')
    expect(plain(formatMoney('-0.004'))).toBe('R$ 0,00')
    expect(plain(formatMoney('-10.50'))).toBe('-R$ 10,50')
  })

  it('não formata valor inválido nem transforma ausência em zero', () => {
    expect(formatMoney('abc')).toBeNull()
    expect(formatMoney(null)).toBeNull()
    expect(formatMoney('')).toBeNull()
  })
})

describe('formatPercentage', () => {
  it('mostra sinal e direção de queda e alta', () => {
    expect(formatPercentage('-20.00')).toEqual({ text: '-20,00%', direction: 'down' })
    expect(formatPercentage('5.5')).toEqual({ text: '+5,50%', direction: 'up' })
    expect(formatPercentage('0.00')).toEqual({ text: '0,00%', direction: 'none' })
  })

  it('não mostra sinal nem direção quando o percentual arredonda para zero', () => {
    expect(formatPercentage('-0.004')).toEqual({ text: '0,00%', direction: 'none' })
    expect(formatPercentage('0.004')).toEqual({ text: '0,00%', direction: 'none' })
    expect(formatPercentage('-0.005')).toEqual({ text: '-0,01%', direction: 'down' })
  })

  it('não inventa percentual para ausente ou inválido', () => {
    expect(formatPercentage(null)).toBeNull()
    expect(formatPercentage('x')).toBeNull()
  })
})
