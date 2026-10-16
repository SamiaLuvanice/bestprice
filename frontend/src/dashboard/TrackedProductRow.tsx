import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney, formatPercentage } from '../lib/format'
import { ArrowDownIcon, ArrowUpIcon } from './Icons'
import { attemptResult, availabilityLabel } from './labels'
import { ProductImage } from './ProductImage'
import { productColumns, type RowState } from './productColumns'
import { RelativeTime } from './RelativeTime'
import type { TrackedEntry } from './trackedList'


type Props = {
  entry: TrackedEntry
  state: RowState
  /** Conteúdo da coluna Ações além de “Ver detalhes” (menu da linha). */
  actions?: ReactNode
}

function Variation({ value }: { value: string | null }) {
  const formatted = formatPercentage(value)
  if (!formatted) return <>Desconhecida</>
  const Arrow = formatted.direction === 'up' ? ArrowUpIcon : ArrowDownIcon
  return <span className={`variation variation-${formatted.direction}`}>
    {formatted.direction !== 'none' && <Arrow />}
    {formatted.direction !== 'none' && <span className="sr-only">{formatted.direction === 'down' ? 'queda' : 'alta'} </span>}
    {formatted.text} <span className="variation-note">vs. preço anterior</span>
  </span>
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="row-detail"><dt>{label}</dt><dd>{children}</dd></div>
}

/**
 * Um produto em “Seus produtos”: linha principal (colunas) e linha secundária (anterior, maior,
 * horários, alerta, avisos e região anunciada da própria linha). Empilhado por CSS em telas estreitas.
 */
export function TrackedProductRow({ entry, state, actions }: Props) {
  const titleId = useId()
  const { tracked, receivedAt } = entry
  const product = tracked.product
  const notFound = product.lookup_status === 'not_found'
  const label = (index: number) => ({ 'data-label': productColumns[index] })
  return <tbody role="rowgroup" aria-labelledby={titleId} data-busy={state.busy || undefined} className={state.busy ? 'product-group is-busy' : 'product-group'}>
    <tr role="row" className="product-main">
      <td role="cell" {...label(0)} className="cell-product">
        <ProductImage src={product.image_url} className="row-image" />
        <span id={titleId} className="row-title">{product.title}</span>
      </td>
      <td role="cell" {...label(1)} className="cell-price">
        <strong>{formatMoney(product.current_price) ?? 'Preço indisponível'}</strong>
        {notFound && product.current_price !== null && <span className="price-flag">Último preço conhecido</span>}
        {product.stale && !notFound && product.current_price !== null && <span className="price-flag">Preço desatualizado</span>}
      </td>
      <td role="cell" {...label(2)}><Variation value={product.percentage_change} /></td>
      <td role="cell" {...label(3)}>{formatMoney(product.min_price) ?? 'Desconhecido'}</td>
      <td role="cell" {...label(4)}><span className={`availability availability-${product.availability}`}>{availabilityLabel(product.availability)}</span></td>
      <td role="cell" {...label(5)}><RelativeTime iso={product.last_price_observed_at} receivedAt={receivedAt} /></td>
      <td role="cell" {...label(6)} className="cell-actions">
        <Link className="secondary-button" to={`/produtos/${tracked.id}`} data-row-details={tracked.id}>
          Ver detalhes{' '}<span className="sr-only">de {product.title}</span>
        </Link>
        {actions}
      </td>
    </tr>
    <tr role="row" className="product-secondary">
      <td role="cell" colSpan={productColumns.length}>
        <dl className="row-details">
          <Detail label="Preço anterior">{formatMoney(product.previous_price) ?? 'Desconhecido'}</Detail>
          <Detail label="Maior preço">{formatMoney(product.max_price) ?? 'Desconhecido'}</Detail>
          <Detail label="Última consulta"><RelativeTime iso={product.last_attempt_at} receivedAt={receivedAt} /></Detail>
          <Detail label="Última alteração"><RelativeTime iso={product.price_changed_at} receivedAt={receivedAt} /></Detail>
        </dl>
        <div className="row-flags">
          {tracked.alert?.enabled && <span className="small-badge">Alerta em {formatMoney(tracked.alert.target_price) ?? 'Desconhecido'}</span>}
          {notFound && <span className="row-warning">Anúncio não localizado no Mercado Livre</span>}
          {/* Com anúncio não localizado, o aviso acima já diz o resultado; não repete em “Última tentativa”. */}
          {product.last_attempt_status !== 'ok' && !(notFound && product.last_attempt_status === 'not_found') && <span className="row-warning">Última tentativa: {attemptResult(product.last_attempt_status)}</span>}
        </div>
        <div role="status" aria-live="polite" className="row-status">{state.busy ? 'Atualizando…' : state.message}</div>
      </td>
    </tr>
  </tbody>
}
