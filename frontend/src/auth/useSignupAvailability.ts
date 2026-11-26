import { api } from '../api'
import { wakeApiOrigin } from './apiWaker'
import { useWakeRetry } from './wakeRetry'

/** Interruptor do cadastro decidido pelo servidor (spec 0048, AC14). */
export type SignupAvailability = 'loading' | 'enabled' | 'disabled' | 'error'

const fetchSignupStatus = () => api.signupStatus()

/**
 * Consulta `GET /api/auth/signup` na montagem. Com `active` (Entrar e Criar conta), uma
 * indisponibilidade é repetida na janela da spec 0061, com `waking` verdadeiro; o erro só aparece
 * quando a janela termina ou quando a API acordada responde um erro definitivo. `retry` abre uma
 * nova janela. Quem consome esconde os links fora de `enabled`.
 */
export function useSignupAvailability(active = true): { availability: SignupAvailability; waking: boolean; retry: () => void } {
  const check = useWakeRetry(fetchSignupStatus, { active, onWindowOpen: wakeApiOrigin })
  const availability: SignupAvailability = check.phase === 'settled'
    ? check.value ? check.value.enabled ? 'enabled' : 'disabled' : 'error'
    : check.phase === 'exhausted' ? 'error' : 'loading'
  return { availability, waking: check.phase === 'waking', retry: check.retry }
}
