import type { TrackedProduct } from '../api'

// Lista “Seus produtos” (plano D3): inicializada pela primeira carga do painel e, depois, alterada
// só pelo item afetado. Recargas do painel para recalcular indicadores não descartam páginas carregadas.

export type TrackedEntry = { tracked: TrackedProduct; receivedAt: Date }
export type TrackedListState = { loaded: boolean; items: TrackedEntry[]; nextCursor: string | null }
type Page = { items: TrackedProduct[]; next_cursor: string | null }
export type TrackedListAction =
  | { type: 'load'; page: Page; receivedAt: Date }
  | { type: 'append'; page: Page; receivedAt: Date }
  | { type: 'replace'; tracked: TrackedProduct; receivedAt: Date }
  | { type: 'remove'; id: string }
  | { type: 'upsert'; tracked: TrackedProduct; receivedAt: Date }
  | { type: 'mergeFromDashboard'; items: TrackedProduct[]; receivedAt: Date }

export const initialTrackedList: TrackedListState = { loaded: false, items: [], nextCursor: null }

function entries(items: TrackedProduct[], receivedAt: Date): TrackedEntry[] {
  return items.map((tracked) => ({ tracked, receivedAt }))
}

export function trackedListReducer(state: TrackedListState, action: TrackedListAction): TrackedListState {
  switch (action.type) {
    case 'load':
      return { loaded: true, items: entries(action.page.items, action.receivedAt), nextCursor: action.page.next_cursor }
    case 'append': {
      const known = new Set(state.items.map((entry) => entry.tracked.id))
      const fresh = action.page.items.filter((tracked) => !known.has(tracked.id))
      return { ...state, items: [...state.items, ...entries(fresh, action.receivedAt)], nextCursor: action.page.next_cursor }
    }
    case 'replace': {
      if (!state.items.some((entry) => entry.tracked.id === action.tracked.id)) return state
      return {
        ...state,
        items: state.items.map((entry) => entry.tracked.id === action.tracked.id ? { tracked: action.tracked, receivedAt: action.receivedAt } : entry),
      }
    }
    case 'remove':
      return { ...state, items: state.items.filter((entry) => entry.tracked.id !== action.id) }
    case 'upsert':
      return {
        ...state,
        items: [{ tracked: action.tracked, receivedAt: action.receivedAt }, ...state.items.filter((entry) => entry.tracked.id !== action.tracked.id)],
      }
    case 'mergeFromDashboard': {
      const latest = new Map(action.items.map((tracked) => [tracked.id, tracked]))
      return {
        ...state,
        items: state.items.map((entry) => {
          const tracked = latest.get(entry.tracked.id)
          return tracked ? { tracked, receivedAt: action.receivedAt } : entry
        }),
      }
    }
  }
}
