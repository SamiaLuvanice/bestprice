import type { TrackedProduct } from '../api'
import { formatMoney, formatPercentage } from '../lib/format'
import { ArrowDownIcon } from './Icons'
import { ProductImage } from './ProductImage'
import { RelativeTime } from './RelativeTime'

type Props = { items: TrackedProduct[]; receivedAt: Date; onOpen: (id: string) => void }

// Valor absoluto do percentual formatado, só para o texto do selo de queda (sem cálculo numérico).
function dropText(percentage: string | null): string | null {
  const formatted = formatPercentage(percentage)
  return formatted ? formatted.text.replace(/^[-+]/, '') : null
}

/** Cards de “Boas oportunidades” na ordem recebida da API (até 5); ativar o título abre o detalhe. */
export function OpportunityList({ items, receivedAt, onOpen }: Props) {
  if (items.length === 0) return <p className="empty">Nenhuma oportunidade de queda nas últimas 24 horas.</p>
  return <ul className="opportunities">
    {items.map((item) => {
      const product = item.product
      const drop = dropText(product.percentage_change)
      return <li key={item.id} className="opportunity-card">
        <div className="opportunity-media">
          <ProductImage src={product.image_url} />
          <span className="drop-badge"><ArrowDownIcon /><span className="sr-only">Queda de </span>{drop ?? ''}</span>
        </div>
        <h3 className="opportunity-title">
          <button type="button" className="card-link" onClick={() => onOpen(item.id)}>{product.title}</button>
        </h3>
        <p className="opportunity-prices">
          {product.previous_price && <s className="previous-price"><span className="sr-only">Preço anterior: </span>{formatMoney(product.previous_price) ?? 'Desconhecido'}</s>}{' '}
          <strong className="current-price">{formatMoney(product.current_price) ?? 'Preço indisponível'}</strong>
        </p>
        <p className="min-price">Menor preço: <strong>{formatMoney(product.min_price) ?? 'Desconhecido'}</strong>{' '}
          <span className="min-note">desde o primeiro registro no BestPrice</span></p>
        <p className="observed">Preço observado: <RelativeTime iso={product.last_price_observed_at} receivedAt={receivedAt} /></p>
      </li>
    })}
  </ul>
}
