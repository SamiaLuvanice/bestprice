import { createContext, useContext } from 'react'

/** Endereços da área de monitoramento: as rotas legadas ou as da área com barra lateral (0063). */
export type MonitoringPaths = { list: string; alerts: string; backLabel: string; product: (id: string) => string }

export const legacyPaths: MonitoringPaths = { list: '/produtos', alerts: '/alertas', backLabel: 'Ir para Produtos', product: (id) => `/produtos/${id}` }
export const embeddedPaths: MonitoringPaths = {
  list: '/app/monitoring', alerts: '/app/monitoring/alerts', backLabel: 'Voltar ao monitoramento', product: (id) => `/app/monitoring/${id}`,
}

const PathsContext = createContext<MonitoringPaths>(legacyPaths)

export const MonitoringPathsProvider = PathsContext.Provider

export function useMonitoringPaths(): MonitoringPaths {
  return useContext(PathsContext)
}
