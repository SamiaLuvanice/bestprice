import { isDecimal } from './decimal'

export type Direction = 'down' | 'up' | 'none'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

type CivilParts = { year: string; month: string; day: string; hour: string; minute: string; second: string }

// Um formatador por fuso: criar Intl.DateTimeFormat a cada instante exibido é caro em listas.
const civilFormatters = new Map<string, Intl.DateTimeFormat>()

function civilFormatter(timeZone?: string): Intl.DateTimeFormat {
  const key = timeZone ?? ''
  let formatter = civilFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    civilFormatters.set(key, formatter)
  }
  return formatter
}

function civilParts(date: Date, timeZone?: string): CivilParts {
  const parts = civilFormatter(timeZone).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return { year: pick('year'), month: pick('month'), day: pick('day'), hour: pick('hour'), minute: pick('minute'), second: pick('second') }
}

// Número do dia civil (no fuso) para saber se o instante foi “ontem”; datas são inteiras, sem dinheiro envolvido.
function civilDayNumber(parts: CivilParts): number {
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / DAY
}

function parseInstant(iso: string): Date | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Texto relativo da spec 0012: Agora, Há N min, Há N h, Ontem, HH:mm ou dd/mm/aaaa, HH:mm.
 * `now` é o instante em que a resposta da API chegou, para o texto não mudar sozinho depois.
 */
export function formatRelative(iso: string, now: Date, timeZone?: string): string | null {
  const instant = parseInstant(iso)
  if (!instant) return null
  const elapsed = now.getTime() - instant.getTime()
  if (elapsed < MINUTE) return 'Agora'
  if (elapsed < HOUR) return `Há ${Math.floor(elapsed / MINUTE)} min`
  if (elapsed < DAY) return `Há ${Math.floor(elapsed / HOUR)} h`
  const at = civilParts(instant, timeZone)
  if (civilDayNumber(civilParts(now, timeZone)) - civilDayNumber(at) === 1) return `Ontem, ${at.hour}:${at.minute}`
  return `${at.day}/${at.month}/${at.year}, ${at.hour}:${at.minute}`
}

/** Instante completo (com segundos) no fuso local, para foco e ponteiro. */
export function formatAbsolute(iso: string, timeZone?: string): string | null {
  const instant = parseInstant(iso)
  if (!instant) return null
  const at = civilParts(instant, timeZone)
  return `${at.day}/${at.month}/${at.year}, ${at.hour}:${at.minute}:${at.second}`
}

export function retryHint(seconds: number): string {
  if (seconds <= 0) return 'Tente novamente agora.'
  if (seconds < 60) return `Tente novamente em ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}.`
  const minutes = Math.ceil(seconds / 60)
  return `Tente novamente em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`
}

// signDisplay 'negative': valores que arredondam para zero ("-0.00", "-0.004") não ganham sinal.
const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'negative' })
const percentFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' })

// Intl.NumberFormat formata a string decimal como decimal exato (sem conversão para number).
type DecimalString = Intl.StringNumericLiteral

/** Reais a partir da string decimal da API; null para ausente ou inválido (o chamador escolhe o rótulo). */
export function formatMoney(value: string | null): string | null {
  if (value === null || !isDecimal(value)) return null
  return moneyFormat.format(value as DecimalString)
}

/** Percentual com sinal; a direção vem do texto já arredondado (0,00% não tem sinal nem seta). */
export function formatPercentage(value: string | null): { text: string; direction: Direction } | null {
  if (value === null || !isDecimal(value)) return null
  // A direção segue o valor exibido: percentual que arredonda para 0,00 não tem sinal nem seta.
  const text = percentFormat.format(value as DecimalString)
  const direction: Direction = text.startsWith('-') ? 'down' : text.startsWith('+') ? 'up' : 'none'
  return { text: `${text}%`, direction }
}
