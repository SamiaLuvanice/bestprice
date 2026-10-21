import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lazy, Suspense, useId, useRef, useState, type FormEvent } from 'react'
import { ProductImage } from './ProductImage'

const PriceHistoryChart = lazy(() => import('./PriceHistoryChart').then((module) => ({ default: module.PriceHistoryChart })))
import { Link } from 'react-router-dom'
import type { HistoryEntry, Product, TrackedProduct } from '../api'
import { formatMoney, formatPercentage } from '../lib/format'
import { normalizeTargetPrice, targetPriceError } from '../lib/targetPrice'
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
  /** Texto do campo de preço-alvo, como a pessoa digita (vírgula ou ponto). */
  target: string
  onTargetChange: (value: string) => void
  onRefresh: () => void
  onLoadMoreHistory: () => void
  /** Recebem o alvo já normalizado para o contrato (`"99.90"`). */
  onCreateAlert: (targetPrice: string) => void
  onSaveTarget: (targetPrice: string) => void
  onToggleAlert: () => void
  onRemoveAlert: () => void
  onRequestStop: () => void
  stopButtonRef?: (element: HTMLButtonElement | null) => void
}

type TargetFormProps = {
  id: string
  label: string
  submitLabel: string
  value: string
  busy: boolean
  onChange: (value: string) => void
  onSubmit: (targetPrice: string) => void
}

/** Campo de preço-alvo com validação local: entrada inválida não chega à API (0028/AC02). */
function TargetForm({ id, label, submitLabel, value, busy, onChange, onSubmit }: TargetFormProps) {
  const errorId = useId()
  const [invalid, setInvalid] = useState(false)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeTargetPrice(value)
    setInvalid(normalized === null)
    if (normalized !== null) onSubmit(normalized)
  }
  return <form className="alert-form" onSubmit={submit} noValidate>
    <label htmlFor={id}>{label}</label>
    <Input id={id} value={value} inputMode="decimal" placeholder="99,90" autoComplete="off" required
      aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined}
      onChange={(event) => { setInvalid(false); onChange(event.target.value) }} />
    {invalid && <p id={errorId} className="field-error">{targetPriceError}</p>}
    <Button disabled={busy} type="submit">{submitLabel}</Button>
  </form>
}

/**
 * Conteúdo do detalhe como página endereçável. A confirmação de parada usa diálogo separado.
 * Cada controle do alerta tem uma única função (0028/AC06): salvar alvo, pausar/retomar e excluir.
 */
export function ProductDetailDialog(props: Props) {
  const { tracked, history, historyCursor, busy, error, target, onTargetChange } = props
  const product = tracked.product
  const alert = tracked.alert
  const stopButton = useRef<HTMLButtonElement>(null)
  return <section className="detail-page" aria-labelledby="detail-title">
    <Link className="text-button detail-back" to="/produtos">Ir para Produtos</Link>
    <div className="detail-product-heading"><ProductImage src={product.image_url} /><div className="detail-product-copy">
      <span className="detail-eyebrow">{product.external_id} · Mercado Livre</span>
      <h1 id="detail-title" tabIndex={-1}>{product.title}</h1>
      <p className="muted">{availabilityLabel(product.availability)} · preço unitário sem frete</p></div></div>
    {error && <p role="alert" className="error-box">{error}</p>}
    <p className="product-price">{money(product.current_price)}</p>
    <p className="muted">{priceState(product)}</p>
    <p className="detail-range">Anterior: {money(product.previous_price, 'Desconhecido')} · Menor: {money(product.min_price, 'Desconhecido')} · Maior: {money(product.max_price, 'Desconhecido')}</p>
    <div className="detail-links">
      {tracked.active && <Button type="button" variant="outline" disabled={busy} onClick={props.onRefresh}>Atualizar agora</Button>}
      <ExternalListingLink href={product.canonical_url} />
    </div>
    {!tracked.active && <p role="status" className="empty">Monitoramento interrompido.</p>}
    <div className="detail-workspace"><section className="detail-history" aria-labelledby="history-title"><h2 id="history-title">Histórico de preços</h2>
      <Suspense fallback={<p role="status">Carregando gráfico…</p>}><PriceHistoryChart history={history} partial={historyCursor !== null} /></Suspense>
      {historyCursor && <Button type="button" variant="outline" disabled={busy} onClick={props.onLoadMoreHistory}>Carregar mais preços</Button>}
    </section>{tracked.active && <section className="detail-alert-card" aria-labelledby="price-alert-title"><h2 id="price-alert-title">Alerta de preço</h2>
      {alert ? <>
        <p className="alert-current">Alvo: {money(alert.target_price)} · {alert.enabled ? 'Ativo' : 'Pausado'}</p>
        <TargetForm id="edit-target" label="Novo valor desejado" submitLabel="Salvar alvo" value={target} busy={busy}
          onChange={onTargetChange} onSubmit={props.onSaveTarget} />
        <div className="alert-secondary-actions">
          <Button disabled={busy} type="button" variant="outline" onClick={props.onToggleAlert}>{alert.enabled ? 'Pausar alerta' : 'Retomar alerta'}</Button>
          <Button disabled={busy} type="button" variant="outline" className="alert-delete" onClick={props.onRemoveAlert}>Excluir alerta</Button>
        </div>
      </> : <TargetForm id="target-price" label="Avise quando chegar a" submitLabel="Criar alerta" value={target} busy={busy}
        onChange={onTargetChange} onSubmit={props.onCreateAlert} />}
    </section>}</div>
    <details className="detail-metadata"><summary>Detalhes da consulta</summary><dl>
      <div><dt>Resultado da última tentativa</dt><dd>{attemptResult(product.last_attempt_status)}</dd></div>
      <div><dt>Última tentativa</dt><dd>{instant(product.last_attempt_at)}</dd></div>
      <div><dt>Última leitura válida</dt><dd>{instant(product.last_success_at, 'Desconhecida')}</dd></div>
      <div><dt>Último preço observado</dt><dd>{instant(product.last_price_observed_at, 'Desconhecido')}</dd></div>
      <div><dt>Última mudança de preço</dt><dd>{instant(product.price_changed_at, 'Desconhecida')}</dd></div>
      {product.last_confirmed_availability && <div><dt>Última disponibilidade confirmada</dt><dd>{availabilityLabel(product.last_confirmed_availability)} · {instant(product.last_confirmed_availability_at)}</dd></div>}
      <div><dt>Diferença e variação</dt><dd>{money(product.absolute_change, 'Desconhecida')} · {percentage(product.percentage_change)}</dd></div>
    </dl></details>
    {tracked.active && <div className="detail-actions"><Button ref={(element) => { stopButton.current = element; props.stopButtonRef?.(element) }} disabled={busy} type="button" variant="destructive" onClick={props.onRequestStop}>Parar de monitorar</Button></div>}
  </section>
}
