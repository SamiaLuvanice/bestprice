import { useEffect, useId, useRef, type FormEvent } from 'react'
import type { HistoryEntry, Product, TrackedProduct } from '../api'
import { useModalFocus } from '../lib/focus'
import { formatMoney, formatPercentage } from '../lib/format'
import { ExternalListingLink } from './ExternalListingLink'
import { attemptResult, availabilityLabel } from './labels'
import { StopTrackingConfirm } from './StopTrackingConfirm'

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
  onClose: () => void
  onRefresh: () => void
  onLoadMoreHistory: () => void
  onCreateAlert: (event: FormEvent<HTMLFormElement>) => void
  onUpdateAlert: () => void
  onRemoveAlert: () => void
  mode: DetailMode
  stopBusy: boolean
  onRequestStop: () => void
  onCancelStop: () => void
  onConfirmStop: () => void
}

/**
 * Detalhe da 0013 (histórico, instantes, alerta e Atualizar agora). “Parar de monitorar” troca o
 * conteúdo deste mesmo diálogo pela confirmação (um único diálogo aberto); cancelar volta ao detalhe.
 */
export function ProductDetailDialog(props: Props) {
  const { tracked, history, historyCursor, busy, error, target, onTargetChange, onClose, mode } = props
  const product = tracked.product
  const dialog = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const stopButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const fallback = useRef<HTMLElement | null>(null)
  const previousMode = useRef<DetailMode | null>(null)
  const confirmTitle = useId()
  const confirmDescription = useId()
  const cancelOrClose = mode === 'confirm' ? props.onCancelStop : onClose

  useModalFocus(true, dialog, fallback, cancelOrClose)

  // Foco: ao abrir, no botão de fechar; na confirmação, em Cancelar; ao voltar dela, em “Parar de monitorar”.
  useEffect(() => {
    const before = previousMode.current
    previousMode.current = mode
    fallback.current = mode === 'confirm' ? cancelButton.current : closeButton.current
    if (before === null) closeButton.current?.focus()
    else if (mode === 'confirm') cancelButton.current?.focus()
    else if (before === 'confirm') stopButton.current?.focus()
  }, [mode])

  return <div className="detail-backdrop" role="presentation" data-testid="detail-backdrop" onMouseDown={cancelOrClose}>
    <section className="detail-panel" role="dialog" aria-modal="true" ref={dialog}
      {...(mode === 'confirm'
        ? { 'aria-labelledby': confirmTitle, 'aria-describedby': confirmDescription }
        : { 'aria-label': `Detalhes de ${product.title}` })}
      onMouseDown={(event) => event.stopPropagation()}>
      {mode === 'confirm'
        ? <StopTrackingConfirm title={product.title} alertActive={Boolean(tracked.alert?.enabled)} busy={props.stopBusy}
          cancelRef={cancelButton} onCancel={props.onCancelStop} onConfirm={props.onConfirmStop}
          ids={{ title: confirmTitle, description: confirmDescription }} />
        : <>
          <button ref={closeButton} className="close-button" type="button" onClick={onClose} aria-label="Fechar detalhes">×</button>
          <span className="eyebrow">{product.external_id}</span>
          <h2>{product.title}</h2>
          {error && <p role="alert" className="error-box">{error}</p>}
          <p className="product-price">{money(product.current_price)}</p>
          <p className="muted">{priceState(product)}</p>
          <p className="muted">Resultado da última tentativa: {attemptResult(product.last_attempt_status)}</p>
          <p className="muted">Última tentativa: {instant(product.last_attempt_at)}</p>
          <p className="muted">Última leitura válida: {instant(product.last_success_at, 'Desconhecida')}</p>
          <p className="muted">Último preço observado: {instant(product.last_price_observed_at, 'Desconhecido')}</p>
          <p className="muted">Última mudança de preço: {instant(product.price_changed_at, 'Desconhecida')}</p>
          <p className="muted">Disponibilidade observada: {availabilityLabel(product.availability)}</p>
          {product.last_confirmed_availability && <p className="muted">Última disponibilidade confirmada: {availabilityLabel(product.last_confirmed_availability)} · {instant(product.last_confirmed_availability_at)}</p>}
          <p className="muted">Preço unitário no Mercado Livre · BRL</p>
          <p className="muted">Anterior: {money(product.previous_price, 'Desconhecido')} · Diferença: {money(product.absolute_change, 'Desconhecida')} · Variação: {percentage(product.percentage_change)}</p>
          <p className="muted">Menor: {money(product.min_price, 'Desconhecido')} · Maior: {money(product.max_price, 'Desconhecido')}</p>
          <div className="detail-links">
            <button type="button" disabled={busy} className="quiet-button" onClick={props.onRefresh}>Atualizar agora</button>
            <ExternalListingLink href={product.canonical_url} />
          </div>
          <h3>Histórico de preços</h3>
          {history.length ? <ul className="feed">{history.map((entry) => <li key={entry.id}>{money(entry.price)} · {instant(entry.captured_at)}</li>)}</ul> : <p className="empty">Ainda não há preço válido registrado.</p>}
          {historyCursor && <button type="button" disabled={busy} className="text-button" onClick={props.onLoadMoreHistory}>Carregar mais preços</button>}
          <h3>Alerta de preço</h3>
          {tracked.alert ? <div className="alert-controls">
            <p>Alvo: {money(tracked.alert.target_price)} · {tracked.alert.enabled ? 'Ativo' : 'Pausado'}</p>
            <label htmlFor="edit-target">Novo alvo (opcional)</label>
            <input id="edit-target" value={target} onChange={(event) => onTargetChange(event.target.value)} inputMode="decimal" placeholder="99.90" />
            <button disabled={busy} type="button" onClick={props.onUpdateAlert}>{target ? 'Salvar alvo' : tracked.alert.enabled ? 'Pausar alerta' : 'Ativar alerta'}</button>
            <button disabled={busy} type="button" className="quiet-button" onClick={props.onRemoveAlert}>Excluir alerta</button>
          </div> :
            <form className="alert-form" onSubmit={props.onCreateAlert}>
              <label htmlFor="target-price">Avise quando chegar a</label>
              <input id="target-price" value={target} onChange={(event) => onTargetChange(event.target.value)} inputMode="decimal" placeholder="99.90" required />
              <button disabled={busy} type="submit">Criar alerta</button>
            </form>}
          <div className="detail-actions"><button ref={stopButton} disabled={busy} type="button" className="quiet-button" onClick={props.onRequestStop}>Parar de monitorar</button></div>
        </>}
    </section>
  </div>
}
