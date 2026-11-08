import { createContext, useContext } from 'react'

/**
 * Destinos das ações da landing (spec 0050, tabela "Para onde cada ação leva").
 * Sessão ou cadastro ainda em verificação, ou com falha, chegam aqui como false: as ações seguem
 * como "sem sessão" e "cadastro desligado", o caminho que nunca bloqueia o visitante.
 */
export type LandingDestinations = {
  /** "Começar a monitorar", "Começar", "Monitorar um anúncio" e o envio do campo com link. */
  monitor: string
  /** "Entrar" e "Já tenho conta". */
  login: string
}

const monitoringReturn = `?returnTo=${encodeURIComponent('/app/monitoring')}`

export function landingDestinations(authenticated: boolean, signupAvailable: boolean): LandingDestinations {
  if (authenticated) return { monitor: '/app/monitoring', login: '/app/dashboard' }
  return {
    monitor: signupAvailable ? `/cadastro${monitoringReturn}` : `/login${monitoringReturn}`,
    login: '/login',
  }
}

export const DestinationsContext = createContext<LandingDestinations>(landingDestinations(false, false))

export function useDestinations(): LandingDestinations {
  return useContext(DestinationsContext)
}
