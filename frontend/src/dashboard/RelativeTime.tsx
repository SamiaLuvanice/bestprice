import { formatAbsolute, formatRelative } from '../lib/format'

type Props = {
  iso: string | null
  /** Instante de chegada da resposta que trouxe o dado: o texto fica fixo e não muda sozinho (AC26). */
  receivedAt: Date
  fallback?: string
}

/** Tempo relativo com o instante completo acessível ao foco (texto oculto e dica) e ao ponteiro (title). */
export function RelativeTime({ iso, receivedAt, fallback = 'Desconhecida' }: Props) {
  const relative = iso ? formatRelative(iso, receivedAt) : null
  const absolute = iso ? formatAbsolute(iso) : null
  if (!iso || !relative || !absolute) return <span>{fallback}</span>
  return <time className="relative-time" dateTime={iso} tabIndex={0} title={absolute} data-full={absolute}>
    <span>{relative}</span><span className="sr-only">, {absolute}</span>
  </time>
}
