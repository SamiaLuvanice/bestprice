import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import { RelativeTime } from './RelativeTime'
import type { AllNotifications } from './useNotifications'

type Props = {
  notifications: AllNotifications
  headingRef: Ref<HTMLHeadingElement>
  focusHeading: () => void
  onMarkRead: (id: string) => Promise<string | null>
  onLoadMore: () => Promise<{ added: string[]; hasMore: boolean } | null>
  onRetry: () => void
}

/**
 * Seção Alertas, sempre exibida: notificações de preço-alvo atingido com estado de leitura. Após
 * “Marcar como lida”, o foco vai ao próximo item ainda não lido (ou ao título, se não restar nenhum).
 */
export function AlertsSection({ notifications, headingRef, focusHeading, onMarkRead, onLoadMore, onRetry }: Props) {
  const list = useRef<HTMLUListElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<{ candidates: string[] } | null>(null)

  useEffect(() => {
    if (!focusRequest) return
    setFocusRequest(null)
    const buttons = Array.from(list.current?.querySelectorAll<HTMLElement>('[data-notification-id]') ?? [])
    for (const id of focusRequest.candidates) {
      const button = buttons.find((element) => element.dataset.notificationId === id)
      if (button) { button.focus(); return }
    }
    focusHeading()
  }, [focusRequest, focusHeading])

  async function markRead(id: string) {
    if (pending) return
    const unread = notifications.items.filter((entry) => !entry.notification.read_at).map((entry) => entry.notification.id)
    const index = unread.indexOf(id)
    setPending(id)
    setError(null)
    const failure = await onMarkRead(id)
    setPending(null)
    if (failure) { setError(failure); return }
    setFocusRequest({ candidates: [...unread.slice(index + 1), ...unread.slice(0, index).reverse()] })
  }

  // Mesmo critério de “Seus produtos”: o botão fica desabilitado na carga (e some na última página),
  // então o foco vai ao primeiro item novo com botão, em qualquer página (ou ao título).
  async function loadMore() {
    const result = await onLoadMore()
    if (result) setFocusRequest({ candidates: result.added })
  }

  return <section id="alertas" aria-labelledby="alerts-title" className="card-section alerts-section">
    <div className="section-heading">
      <h2 id="alerts-title" ref={headingRef} tabIndex={-1}>Notificações recebidas</h2>
      <p className="section-subtitle">Notificações de preço-alvo atingido.</p>
    </div>
    {notifications.status === 'loading' && <p role="status" className="loading-status">Carregando notificações…</p>}
    {notifications.status === 'error' && <div className="region-error">
      <p role="alert" className="error-box">{notifications.message}</p>
      <Button type="button" className="secondary-button" onClick={onRetry}>Tentar novamente</Button>
    </div>}
    {error && <p role="alert" className="error-box">{error}</p>}
    {notifications.status === 'ready' && notifications.items.length === 0 && <p className="empty">Nenhuma notificação por enquanto.</p>}
    {notifications.items.length > 0 && <ul ref={list} className="alerts-list">
      {notifications.items.map(({ notification, receivedAt }) => <li key={notification.id} className={notification.read_at ? 'alert-item is-read' : 'alert-item'}>
        <div className="alert-main">
          <strong className="alert-title">{notification.product_title}</strong>
          <span className="alert-prices">
            Preço observado: {formatMoney(notification.observed_price) ?? 'Desconhecido'} · Alvo: {formatMoney(notification.target_price) ?? 'Desconhecido'}
          </span>
          <RelativeTime iso={notification.created_at} receivedAt={receivedAt} />
        </div>
        <span className="read-state">{notification.read_at ? 'Lida' : 'Não lida'}</span>
        <Link className="text-button" to={`/produtos/${notification.tracked_product_id}`}>Abrir produto</Link>
        {!notification.read_at && <Button type="button" className="secondary-button" data-notification-id={notification.id}
          aria-disabled={pending === notification.id || undefined} onClick={() => void markRead(notification.id)}>
          Marcar como lida<span className="sr-only">: {notification.product_title}</span>
        </Button>}
      </li>)}
    </ul>}
    {notifications.status !== 'error' && notifications.message && <p role="alert" className="error-box">{notifications.message}</p>}
    {notifications.nextCursor && <Button type="button" className="secondary-button" disabled={notifications.loadingMore} onClick={() => void loadMore()}>
      Carregar mais notificações
    </Button>}
  </section>
}
