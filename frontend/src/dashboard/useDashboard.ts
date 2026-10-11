import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiFailure, type Dashboard } from '../api'

export type DashboardView =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Dashboard; receivedAt: Date; refreshError: string | null }

type Options = {
  clock: () => Date
  /** Chamado só para respostas que prevalecem (não descartadas), com o instante de chegada. */
  onLoaded: (data: Dashboard, receivedAt: Date) => void
  onUnauthenticated: (failure: ApiFailure) => void
}

const fallbackMessage = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Carga do painel com descarte de respostas antigas (plano D4): cada carga recebe um número de
 * sequência e só a mais recente pode alterar o estado. Depois da primeira resposta válida, uma falha
 * de recarga mantém os dados exibidos e expõe `refreshError`.
 */
export function useDashboard({ clock, onLoaded, onUnauthenticated }: Options): { view: DashboardView; reload: () => Promise<void> } {
  const [view, setView] = useState<DashboardView>({ status: 'loading' })
  const sequence = useRef(0)
  const callbacks = useRef({ clock, onLoaded, onUnauthenticated })
  useEffect(() => { callbacks.current = { clock, onLoaded, onUnauthenticated } })

  const reload = useCallback(async () => {
    const current = ++sequence.current
    setView((previous) => previous.status === 'error' ? { status: 'loading' } : previous)
    try {
      const data = await api.dashboard()
      if (current !== sequence.current) return
      const receivedAt = callbacks.current.clock()
      setView({ status: 'ready', data, receivedAt, refreshError: null })
      callbacks.current.onLoaded(data, receivedAt)
    } catch (failure) {
      if (current !== sequence.current) return
      if (failure instanceof ApiFailure && failure.status === 401) { callbacks.current.onUnauthenticated(failure); return }
      const message = failure instanceof ApiFailure ? failure.message : fallbackMessage
      // Depois da primeira carga, a falha não apaga os dados: a região mostra a mensagem e “Tentar novamente” (AC25).
      setView((previous) => previous.status === 'ready' ? { ...previous, refreshError: message } : { status: 'error', message })
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  return { view, reload }
}
