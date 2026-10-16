import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiFailure, type Notification } from '../api'

export type NotificationEntry = { notification: Notification; receivedAt: Date }

export type UnreadView =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: Notification[]; hasMore: boolean; receivedAt: Date }

export type AllNotifications = {
  status: 'loading' | 'error' | 'ready'
  message: string | null
  items: NotificationEntry[]
  nextCursor: string | null
  loadingMore: boolean
}

type Options = { clock: () => Date; onUnauthenticated: (failure: ApiFailure) => void; loadAll?: boolean }

const fallbackMessage = 'Não foi possível concluir a operação. Tente novamente.'

function messageOf(failure: unknown): string {
  return failure instanceof ApiFailure ? failure.message : fallbackMessage
}

function isUnauthenticated(failure: unknown): failure is ApiFailure {
  return failure instanceof ApiFailure && failure.status === 401
}

/**
 * Notificações: `unread` vem de uma única consulta de não lidas (limite 100) e alimenta contador e
 * painel do sino; `all` são as páginas da seção Alertas. O contador é sempre recalculado pela API.
 */
export function useNotifications({ clock, onUnauthenticated, loadAll = true }: Options) {
  const [unread, setUnread] = useState<UnreadView>({ status: 'loading' })
  const [all, setAll] = useState<AllNotifications>({ status: 'loading', message: null, items: [], nextCursor: null, loadingMore: false })
  const unreadSequence = useRef(0)
  const allSequence = useRef(0)
  const callbacks = useRef({ clock, onUnauthenticated })
  useEffect(() => { callbacks.current = { clock, onUnauthenticated } })

  const reloadUnread = useCallback(async () => {
    const current = ++unreadSequence.current
    try {
      const page = await api.unreadNotifications()
      if (current !== unreadSequence.current) return
      setUnread({ status: 'ready', items: page.items, hasMore: page.next_cursor !== null, receivedAt: callbacks.current.clock() })
    } catch (failure) {
      if (current !== unreadSequence.current) return
      if (isUnauthenticated(failure)) { callbacks.current.onUnauthenticated(failure); return }
      setUnread({ status: 'error' })
    }
  }, [])

  /** Primeira página da seção. Com `merge`, itens novos entram no topo e as páginas já carregadas permanecem. */
  const reloadAll = useCallback(async (merge = false) => {
    // Só a carga mais recente da primeira página altera a seção (respostas antigas são descartadas).
    const current = ++allSequence.current
    if (!merge) setAll((state) => state.status === 'error' ? { ...state, status: 'loading', message: null } : state)
    try {
      const page = await api.notifications()
      if (current !== allSequence.current) return
      const receivedAt = callbacks.current.clock()
      setAll((state) => {
        const fresh = page.items.map((notification) => ({ notification, receivedAt }))
        if (!merge || state.status !== 'ready') return { status: 'ready', message: null, items: fresh, nextCursor: page.next_cursor, loadingMore: false }
        const latest = new Map(fresh.map((entry) => [entry.notification.id, entry]))
        const known = new Set(state.items.map((entry) => entry.notification.id))
        return {
          ...state,
          items: [...fresh.filter((entry) => !known.has(entry.notification.id)), ...state.items.map((entry) => latest.get(entry.notification.id) ?? entry)],
        }
      })
    } catch (failure) {
      if (current !== allSequence.current) return
      if (isUnauthenticated(failure)) { callbacks.current.onUnauthenticated(failure); return }
      // Recarga com merge só preserva a seção já carregada; se ela ainda não estava pronta (a carga
      // inicial foi descartada por esta), a falha vira estado de erro em vez de “carregando” para sempre.
      setAll((state) => merge && state.status === 'ready' ? state : { ...state, status: 'error', message: messageOf(failure) })
    }
  }, [])

  /** Próxima página da seção; devolve os ids novos e se ainda há mais páginas (null em falha). */
  const loadMoreAll = useCallback(async (): Promise<{ added: string[]; hasMore: boolean } | null> => {
    const cursor = all.nextCursor
    if (!cursor) return null
    setAll((state) => ({ ...state, loadingMore: true, message: null }))
    try {
      const page = await api.notifications(cursor)
      const receivedAt = callbacks.current.clock()
      const known = new Set(all.items.map((entry) => entry.notification.id))
      setAll((state) => {
        const loaded = new Set(state.items.map((entry) => entry.notification.id))
        const fresh = page.items.filter((notification) => !loaded.has(notification.id)).map((notification) => ({ notification, receivedAt }))
        return { ...state, items: [...state.items, ...fresh], nextCursor: page.next_cursor, loadingMore: false }
      })
      return { added: page.items.filter((notification) => !known.has(notification.id)).map((notification) => notification.id), hasMore: page.next_cursor !== null }
    } catch (failure) {
      if (isUnauthenticated(failure)) { callbacks.current.onUnauthenticated(failure); return null }
      setAll((state) => ({ ...state, loadingMore: false, message: messageOf(failure) }))
      return null
    }
  }, [all.nextCursor, all.items])

  /** Marca como lida e recalcula as não lidas; devolve a mensagem de erro, se houver. */
  const markRead = useCallback(async (id: string): Promise<string | null> => {
    try {
      const updated = await api.readNotification(id)
      const receivedAt = callbacks.current.clock()
      setAll((state) => ({
        ...state,
        items: state.items.map((entry) => entry.notification.id === id ? { notification: updated, receivedAt } : entry),
      }))
      await reloadUnread()
      return null
    } catch (failure) {
      if (isUnauthenticated(failure)) { callbacks.current.onUnauthenticated(failure); return null }
      return messageOf(failure)
    }
  }, [reloadUnread])

  /** Após ações que podem gerar ou resolver notificações (alerta, Atualizar agora). */
  const refreshAfterAction = useCallback(async () => {
    await Promise.all([reloadUnread(), ...(loadAll ? [reloadAll(true)] : [])])
  }, [reloadUnread, reloadAll, loadAll])

  useEffect(() => {
    void reloadUnread()
  }, [reloadUnread])
  useEffect(() => { if (loadAll) void reloadAll() }, [reloadAll, loadAll])

  return { unread, all, reloadUnread, reloadAll, loadMoreAll, markRead, refreshAfterAction }
}
