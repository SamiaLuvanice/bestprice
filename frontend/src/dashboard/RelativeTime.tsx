import { formatAbsolute, formatRelative } from '../lib/format'

type Props = {
  iso: string | null
  /** Instante de chegada da resposta que trouxe o dado: o texto fica fixo e não muda sozinho (AC26). */
  receivedAt: Date
  fallback?: string
}

/**
 * Tempo relativo com o instante completo para leitores de tela (texto oculto) e ao ponteiro (title).
 * Não é parada de Tab: a QA mediu que os instantes eram 56% das paradas da página (decisão M10).
 */
export function RelativeTime({ iso, receivedAt, fallback = 'Desconhecida' }: Props) {
  const relative = iso ? formatRelative(iso, receivedAt) : null
  const absolute = iso ? formatAbsolute(iso) : null
  if (!iso || !relative || !absolute) return <span>{fallback}</span>
  return <time className="relative-time" dateTime={iso} title={absolute} data-full={absolute}>
    <span>{relative}</span><span className="sr-only">, {absolute}</span>
  </time>
}
