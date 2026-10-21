import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lazy, Suspense, useRef, type FormEvent } from 'react'
import { ProductImage } from './ProductImage'

const PriceHistoryChart = lazy(() => import('./PriceHistoryChart').then((module) => ({ default: module.PriceHistoryChart })))
import { Link } from 'react-router-dom'
import type { HistoryEntry, Product, TrackedProduct } from '../api'
import { formatMoney, formatPercentage } from '../lib/format'
import { ExternalListingLink } from './ExternalListingLink'
import { attemptResult, availabilityLabel } from './labels'

// Textos herdados da 0013 (convenção “Abrangência” da 0012): o detalhe mantém seus rótulos atuais.
function money(value: string | null, unknown = 'Preço indisponível'): string {
  return formatMoney(value) ?? unknown
}

function instant(value: string | null, unknown = 'Ainda não consultado'): string {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : unknown
}

function priceState(product: Product): string {
  if (product.current_price === null) return 'Preço ainda não observado'
  if (product.lookup_status === 'not_found') return 'Anúncio não localizado · último preço conhecido'
  if (product.stale) return 'Último preço conhecido · preço desatualizado'
  return `Preço observado em ${instant(product.last_price_observed_at)}`
}

function percentage(value: string | null): string {
  return formatPercentage(value)?.text ?? 'Desconhecida'
}

export type DetailMode = 'detail' | 'confirm'

type Props = {
  tracked: TrackedProduct
  history: HistoryEntry[]
  historyCursor: string | null
  busy: boolean
  error: string | null
  target: string
  onTargetChange: (value: string) => void
  onRefresh: () => void
  onLoadMoreHistory: () => void
  onCreateAlert: (event: FormEvent<HTMLFormElement>) => void
  onUpdateAlert: () => void
  onRemoveAlert: () => void
  onRequestStop: () => void
  stopButtonRef?: (element: HTMLButtonElement | null) => void
}

/**
 * Conteúdo do detalhe como página endereçável. A confirmação de parada usa diálogo separado.
 */
export function ProductDetailDialog(props: Props) {
  const { tracked, history, historyCursor, busy, error, target, onTargetChange } = props
  const product = tracked.product
  const stopButton = useRef<HTMLButtonElement>(null)
  return <section className="detail-panel detail-page" aria-labelledby="detail-title">
          <Link className="text-button" to="/produtos">Ir para Produtos</Link>
          <div className="detail-product-heading"><ProductImage src={product.image_url} /><div>
          <span className="muted">{product.external_id} · Mercado Livre</span>
          <h1 id="detail-title" tabIndex={-1}>{product.title}</h1>
          <p className="muted">{availabilityLabel(product.availability)} · preço unitário sem frete</p></div></div>
          {error && <p role="alert" className="error-box">{error}</p>}
          <p className="product-price">{money(product.current_price)}</p>
          <p className="muted">{priceState(product)}</p>
          <p className="muted">Anterior: {money(product.previous_price, 'Desconhecido')} · Menor: {money(product.min_price, 'Desconhecido')} · Maior: {money(product.max_price, 'Desconhecido')}</p>
          <div className="detail-links">
            {tracked.active && <Button type="button" disabled={busy} className="quiet-button" onClick={props.onRefresh}>Atualizar agora</Button>}
            <ExternalListingLink href={product.canonical_url} />
          </div>
          {!tracked.active && <p role="status" className="empty">Monitoramento interrompido.</p>}
          <div className="detail-workspace"><section className="detail-history" aria-labelledby="history-title"><h2 id="history-title">Histórico de preços</h2>
          <Suspense fallback={<p role="status">Carregando gráfico…</p>}><PriceHistoryChart history={history} partial={historyCursor !== null} /></Suspense>
          {historyCursor && <Button type="button" disabled={busy} className="text-button" onClick={props.onLoadMoreHistory}>Carregar mais preços</Button>}
          </section>{tracked.active && <section className="detail-alert-card" aria-labelledby="price-alert-title"><h2 id="price-alert-title">Alerta de preço</h2>
          {tracked.alert ? <div className="alert-controls">
            <p>Alvo: {money(tracked.alert.target_price)} · {tracked.alert.enabled ? 'Ativo' : 'Pausado'}</p>
            <label htmlFor="edit-target">Novo alvo (opcional)</label>
            <Input id="edit-target" value={target} onChange={(event) => onTargetChange(event.target.value)} inputMode="decimal" placeholder="99.90" />
            <Button disabled={busy} type="button" onClick={props.onUpdateAlert}>{target ? 'Salvar alvo' : tracked.alert.enabled ? 'Pausar alerta' : 'Ativar alerta'}</Button>
            <Button disabled={busy} type="button" className="quiet-button" onClick={props.onRemoveAlert}>Excluir alerta</Button>
          </div> :
            <form className="alert-form" onSubmit={props.onCreateAlert}>
              <label htmlFor="target-price">Avise quando chegar a</label>
              <Input id="target-price" value={target} onChange={(event) => onTargetChange(event.target.value)} inputMode="decimal" placeholder="99.90" required />
              <Button disabled={busy} type="submit">Criar alerta</Button>
            </form>}
          </section>}</div>
          <div className="detail-metadata"><p className="muted">Resultado da última tentativa: {attemptResult(product.last_attempt_status)}</p>
          <p className="muted">Última tentativa: {instant(product.last_attempt_at)}</p>
          <p className="muted">Última leitura válida: {instant(product.last_success_at, 'Desconhecida')}</p>
          <p className="muted">Último preço observado: {instant(product.last_price_observed_at, 'Desconhecido')}</p>
          <p className="muted">Última mudança de preço: {instant(product.price_changed_at, 'Desconhecida')}</p>
          <p className="muted">Disponibilidade observada: {availabilityLabel(product.availability)}</p>
          {product.last_confirmed_availability && <p className="muted">Última disponibilidade confirmada: {availabilityLabel(product.last_confirmed_availability)} · {instant(product.last_confirmed_availability_at)}</p>}
          <p className="muted">Preço unitário no Mercado Livre · BRL</p>
          <p className="muted">Diferença: {money(product.absolute_change, 'Desconhecida')} · Variação: {percentage(product.percentage_change)}</p>
          </div>
          {tracked.active && <div className="detail-actions"><Button ref={(element) => { stopButton.current = element; props.stopButtonRef?.(element) }} disabled={busy} type="button" className="quiet-button" onClick={props.onRequestStop}>Parar de monitorar</Button></div>}
    </section>
}
