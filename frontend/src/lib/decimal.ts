// Comparação decimal exata para valores monetários recebidos como string.
// Nunca converte para number: a UI só valida e compara; aritmética monetária fica no backend.

export type ParsedDecimal = { negative: boolean; integer: string; fraction: string }

const decimalPattern = /^(-?)(\d+)(?:\.(\d+))?$/

export function parseDecimal(value: string): ParsedDecimal | null {
  const match = decimalPattern.exec(value)
  if (!match) return null
  const integer = match[2].replace(/^0+(?=\d)/, '')
  const fraction = (match[3] ?? '').replace(/0+$/, '')
  const zero = integer === '0' && fraction === ''
  return { negative: match[1] === '-' && !zero, integer, fraction }
}

export function isDecimal(value: string): boolean {
  return decimalPattern.test(value)
}

function compareMagnitude(a: ParsedDecimal, b: ParsedDecimal): -1 | 0 | 1 {
  if (a.integer.length !== b.integer.length) return a.integer.length < b.integer.length ? -1 : 1
  const width = Math.max(a.fraction.length, b.fraction.length)
  const left = a.integer + a.fraction.padEnd(width, '0')
  const right = b.integer + b.fraction.padEnd(width, '0')
  // Mesmo comprimento e só dígitos: a ordem lexicográfica coincide com a numérica.
  if (left === right) return 0
  return left < right ? -1 : 1
}

/** -1 se a < b, 0 se iguais, 1 se a > b; null se algum valor não for decimal simples. */
export function compareDecimal(a: string, b: string): -1 | 0 | 1 | null {
  const left = parseDecimal(a)
  const right = parseDecimal(b)
  if (!left || !right) return null
  if (left.negative !== right.negative) return left.negative ? -1 : 1
  const magnitude = compareMagnitude(left, right)
  return left.negative ? (magnitude === 0 ? 0 : magnitude === 1 ? -1 : 1) : magnitude
}
