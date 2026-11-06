import { useEffect, useState } from 'react'
import { ApiFailure } from '../../api'
import { researchApi, type Capabilities } from './api'

export type ResearchProps = { onUnauthenticated: (text: string) => void }

export function failureText(error: unknown): string {
  const fallback = 'Não foi possível concluir a operação. Tente novamente.'
  if (!(error instanceof ApiFailure)) return fallback
  if (error.status === 404) return 'Pesquisa não encontrada ou indisponível.'
  if (error.code === 'research_conflict') return 'Esta pesquisa mudou. Reabra pelo histórico antes de continuar a análise.'
  const retry = error.retryAfterSeconds === null ? '' : ` Tente novamente em ${error.retryAfterSeconds} segundos.`
  return `${error.message}${retry}`
}

export function useCapabilities(onUnauthenticated: ResearchProps['onUnauthenticated']) {
  const [data, setData] = useState<Capabilities | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    researchApi.capabilities().then((result) => { if (active) { setData(result); setError(null) } }).catch((failure: unknown) => {
      if (!active) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failureText(failure))
    })
    return () => { active = false }
  }, [attempt, onUnauthenticated])
  return { data, error, retry: () => setAttempt((value) => value + 1) }
}
