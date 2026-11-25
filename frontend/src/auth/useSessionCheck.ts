import { useCallback, useEffect } from 'react'
import { api, ApiFailure, type User } from '../api'
import { useWakeRetry } from './wakeRetry'

/**
 * Estado da verificação de sessão (spec 0061):
 * - `loading`: consulta em voo há menos de 5 s;
 * - `waking`: API indisponível, janela de novas tentativas em curso;
 * - `unavailable`: a janela terminou sem a API acordar;
 * - `failed`: a API acordou e respondeu um erro definitivo (4xx com envelope, exceto 401);
 * - `guest` / `ready`: decidida, sem ou com sessão.
 */
export type SessionState = 'loading' | 'waking' | 'unavailable' | 'failed' | 'guest' | 'ready'

const genericMessage = 'Não foi possível concluir a operação. Tente novamente.'

// 401 é "sem sessão": decide a consulta como `null` em vez de falha.
function fetchSession(): Promise<User | null> {
  return api.me().catch((failure: unknown) => {
    if (failure instanceof ApiFailure && failure.status === 401) return null
    throw failure
  })
}

export function useSessionCheck(active: boolean) {
  const check = useWakeRetry(fetchSession, { active })
  const { retry, settle, markAwake: markCheckAwake } = check

  // Voltar pelo histórico (bfcache) refaz a verificação desde o início.
  useEffect(() => {
    function revalidate(event: PageTransitionEvent) { if (event.persisted) retry() }
    window.addEventListener('pageshow', revalidate)
    return () => window.removeEventListener('pageshow', revalidate)
  }, [retry])

  const state: SessionState = check.phase === 'loading' ? 'loading'
    : check.phase === 'waking' ? 'waking'
      : check.phase === 'exhausted' ? 'unavailable'
        : check.value ? 'ready' : check.value === null ? 'guest' : 'failed'
  const failure = state === 'unavailable' || state === 'failed' ? check.error : undefined
  const error = state === 'unavailable' || state === 'failed'
    ? failure instanceof ApiFailure ? failure.message : genericMessage : null

  return {
    state,
    user: state === 'ready' ? check.value ?? null : null,
    error,
    retry,
    /** Decide a sessão por fora (login, cadastro, logout): `null` é sem sessão. */
    settle,
    /** A API acordou por outra chamada (login): sem sessão até a verificação em voo dizer o contrário. */
    markAwake: useCallback(() => markCheckAwake(null), [markCheckAwake]),
  }
}
