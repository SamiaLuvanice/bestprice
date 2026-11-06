import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

/** Interruptor do cadastro decidido pelo servidor (spec 0048, AC14). */
export type SignupAvailability = 'loading' | 'enabled' | 'disabled' | 'error'

/**
 * Consulta `GET /api/auth/signup` uma vez por montagem. Erro de rede, HTTP ou corpo fora do
 * contrato vira `error`; `retry` consulta de novo. Quem consome esconde os links fora de `enabled`.
 */
export function useSignupAvailability(): { availability: SignupAvailability; retry: () => void } {
  const [availability, setAvailability] = useState<SignupAvailability>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api.signupStatus()
      .then((status) => { if (active) setAvailability(status.enabled ? 'enabled' : 'disabled') })
      .catch(() => { if (active) setAvailability('error') })
    return () => { active = false }
  }, [attempt])

  const retry = useCallback(() => {
    setAvailability('loading')
    setAttempt((current) => current + 1)
  }, [])

  return { availability, retry }
}
