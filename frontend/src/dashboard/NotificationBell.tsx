import { Button } from '@/components/ui/button'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import { useDisclosure } from '../lib/focus'
import { BellIcon } from './Icons'
import { RelativeTime } from './RelativeTime'
import type { UnreadView } from './useNotifications'

const PANEL_LIMIT = 5

type Props = {
  unread: UnreadView
  onRetry: () => Promise<void>
  onMarkRead: (id: string) => Promise<string | null>
}

function counterOf(unread: UnreadView): { text: string | null; label: string } {
  if (unread.status === 'error') return { text: null, label: 'Notificações indisponíveis' }
  if (unread.status === 'loading' || unread.items.length === 0) return { text: null, label: 'Notificações' }
  // O contrato não tem contagem: a página de não lidas tem até 100 itens; mais que 99 vira “99+”.
  if (unread.items.length > 99 || unread.hasMore) return { text: '99+', label: 'Notificações, mais de 99 não lidas' }
  const count = unread.items.length
  return { text: String(count), label: `Notificações, ${count} ${count === 1 ? 'não lida' : 'não lidas'}` }
}

type FocusRequest = { previous: string[]; index: number } | 'title' | null

/** Sino com contador de não lidas e painel (disclosure) com as 5 mais recentes. */
export function NotificationBell({ unread, onRetry, onMarkRead }: Props) {
  const panel = useDisclosure()
  const panelId = useId()
  const titleId = useId()
  const title = useRef<HTMLHeadingElement>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null)
  const counter = counterOf(unread)
  const visible = useMemo(() => unread.status === 'ready' ? unread.items.slice(0, PANEL_LIMIT) : [], [unread])

  // Após marcar como lida: foco no próximo item da lista atual; sem itens, no título do painel.
  useEffect(() => {
    if (!focusRequest) return
    setFocusRequest(null)
    // Painel fechado antes de a ação terminar: o pedido é descartado e não move o foco ao reabrir.
    if (!panel.open) return
    const remaining = new Set(visible.map((item) => item.id))
    const candidates = focusRequest === 'title' ? [] : [
      ...focusRequest.previous.slice(focusRequest.index + 1),
      ...focusRequest.previous.slice(0, focusRequest.index).reverse(),
    ]
    const next = candidates.find((id) => remaining.has(id))
    const buttons = Array.from(panel.panelRef.current?.querySelectorAll<HTMLElement>('[data-notification-id]') ?? [])
    const button = next ? buttons.find((element) => element.dataset.notificationId === next) : undefined
    if (button) button.focus()
    else title.current?.focus()
  }, [focusRequest, panel.open, panel.panelRef, visible])

  async function markRead(id: string) {
    if (pending) return
    const previous = visible.map((item) => item.id)
    setPending(id)
    setError(null)
    const failure = await onMarkRead(id)
    setPending(null)
    if (failure) { setError(failure); return }
    setFocusRequest({ previous, index: previous.indexOf(id) })
  }

  async function retry() {
    await onRetry()
    setFocusRequest('title')
  }

  return <div className="disclosure bell" ref={panel.containerRef} onKeyDown={panel.onKeyDown} onBlur={panel.onBlur}>
    <Button ref={panel.buttonRef} type="button" className="icon-button bell-button" aria-expanded={panel.open} aria-controls={panelId} onClick={panel.toggle}>
      <BellIcon />
      <span className="sr-only">{counter.label}</span>
      {counter.text && <span className="bell-count" aria-hidden="true">{counter.text}</span>}
    </Button>
    {panel.open && <section id={panelId} ref={panel.panelRef} className="disclosure-panel bell-panel" aria-labelledby={titleId}>
      <h2 id={titleId} ref={title} tabIndex={-1} className="panel-title">Notificações não lidas</h2>
      {error && <p role="alert" className="inline-error">{error}</p>}
      {unread.status === 'loading' && <p role="status" className="panel-note">Carregando notificações…</p>}
      {unread.status === 'error' && <div className="panel-note">
        <p>Notificações indisponíveis</p>
        <Button type="button" className="text-button" onClick={() => void retry()}>Tentar novamente</Button>
      </div>}
      {unread.status === 'ready' && (visible.length === 0
        ? <p className="panel-note">Nenhuma notificação não lida.</p>
        : <ul className="bell-list">{visible.map((item) => <li key={item.id}>
          <span className="bell-item-title">{item.product_title}</span>
          <span className="bell-item-prices">
            Preço observado: {formatMoney(item.observed_price) ?? 'Desconhecido'} · Alvo: {formatMoney(item.target_price) ?? 'Desconhecido'}
          </span>
          <RelativeTime iso={item.created_at} receivedAt={unread.receivedAt} />
          <Link className="link-button" to={`/produtos/${item.tracked_product_id}`} onClick={() => panel.close()}>Abrir produto</Link>
          <Button type="button" className="link-button" data-notification-id={item.id} aria-disabled={pending === item.id || undefined}
            onClick={() => void markRead(item.id)}>
            Marcar como lida<span className="sr-only">: {item.product_title}</span>
          </Button>
        </li>)}</ul>)}
      <Link className="panel-link" to="/alertas" onClick={() => panel.close()}>Ver todas as notificações</Link>
    </section>}
  </div>
}
