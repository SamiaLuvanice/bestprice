// Preço-alvo digitado no formato brasileiro (0028/AC02). A normalização é feita só com texto:
// o contrato `target_price` continua decimal com ponto e duas casas ("99.90"), validado no backend.

const MAX_INTEGER_DIGITS = 16 // backend: valor < 10^16
// Com separador de milhar, o primeiro grupo não começa com zero: "0.500" não vira 500.
const commaDecimal = /^([1-9]\d{0,2}(?:\.\d{3})+|\d+),(\d{1,2})$/
const dotDecimal = /^(\d+)\.(\d{1,2})$/
const dotThousands = /^([1-9]\d{0,2}(?:\.\d{3})+)$/
const integerOnly = /^(\d+)$/

function parts(text: string): [string, string] | null {
  const comma = commaDecimal.exec(text)
  if (comma) return [comma[1], comma[2]]
  const dot = dotDecimal.exec(text)
  if (dot) return [dot[1], dot[2]]
  const thousands = dotThousands.exec(text) ?? integerOnly.exec(text)
  return thousands ? [thousands[1], ''] : null
}

/**
 * Aceita `99,90`, `99.90`, `1.899,90`, `1899,9` (e prefixo `R$`) e devolve `"99.90"`;
 * devolve null para texto inválido, zero ou acima do limite do contrato.
 */
export function normalizeTargetPrice(typed: string): string | null {
  const text = typed.trim().replace(/^R\$\s*/, '')
  const parsed = parts(text)
  if (!parsed) return null
  const integer = parsed[0].replace(/\./g, '').replace(/^0+(?=\d)/, '')
  const fraction = parsed[1].padEnd(2, '0')
  if (integer.length > MAX_INTEGER_DIGITS) return null
  if (integer === '0' && fraction === '00') return null
  return `${integer}.${fraction}`
}

/** Valor do contrato (`"1899.90"`) exibido no campo como a pessoa digitaria (`"1899,90"`). */
export function targetPriceInput(value: string): string {
  return value.replace('.', ',')
}

export const targetPriceError = 'Informe um valor em reais, como 99,90.'
