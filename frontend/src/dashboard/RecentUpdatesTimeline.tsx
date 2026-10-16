import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { RecentUpdate } from '../api'
import { compareDecimal } from '../lib/decimal'
import { formatMoney } from '../lib/format'
import { ArrowDownIcon, ArrowUpIcon, BoxIcon } from './Icons'
import { ProductImage } from './ProductImage'
import { RelativeTime } from './RelativeTime'

export type KnownProduct = { title: string; imageUrl: string | null }

type Props = {
  events: RecentUpdate[]
  receivedAt: Date
  /** Produtos já carregados (lista e oportunidades), por id do vínculo: o evento não traz título nem imagem. */
  known: Map<string, KnownProduct>
}

type Description = { text: ReactNode; direction: 'up' | 'down' | null }

function describe(event: RecentUpdate): Description {
  if (event.type === 'availability_changed') {
    if (event.current_value === 'available') return { text: ' voltou a ficar disponível.', direction: null }
    if (event.current_value === 'unavailable') return { text: ' ficou indisponível.', direction: null }
    return { text: ' teve a disponibilidade alterada.', direction: null }
  }
  // Direção por comparação decimal exata; iguais ou não numéricos viram “teve o preço alterado.”
  const comparison = compareDecimal(event.current_value, event.previous_value)
  const previous = formatMoney(event.previous_value)
  const current = formatMoney(event.current_value)
  if (comparison === null || comparison === 0 || !previous || !current) return { text: ' teve o preço alterado.', direction: null }
  return comparison < 0
    ? { text: ` caiu de ${previous} para ${current}.`, direction: 'down' }
    : { text: ` aumentou de ${previous} para ${current}.`, direction: 'up' }
}

/** Linha do tempo de recent_updates, na ordem da API (mais recentes primeiro), sem “Ver todas”. */
export function RecentUpdatesTimeline({ events, receivedAt, known }: Props) {
  if (events.length === 0) return <p className="empty">As mudanças confirmadas de preço e disponibilidade aparecerão aqui.</p>
  return <ol className="timeline">
    {events.map((event) => {
      const productInfo = known.get(event.tracked_product_id)
      const { text, direction } = describe(event)
      return <li key={event.id} className="timeline-item">
        <span className={`timeline-marker${direction ? ` marker-${direction}` : ''}`} {...(direction ? { 'data-direction': direction } : {})}>
          {direction === 'down' ? <ArrowDownIcon /> : direction === 'up' ? <ArrowUpIcon /> : <BoxIcon />}
        </span>
        {productInfo && <ProductImage src={productInfo.imageUrl} className="timeline-image" />}
        <div className="timeline-body">
          <p><strong>{productInfo?.title ?? 'Um produto monitorado'}</strong>{text}</p>
          <RelativeTime iso={event.observed_at} receivedAt={receivedAt} />
          <Link className="link-button" to={`/produtos/${event.tracked_product_id}`}>Ver produto</Link>
        </div>
      </li>
    })}
  </ol>
}
