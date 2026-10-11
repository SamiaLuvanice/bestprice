import { describe, expect, it } from 'vitest'
import type { TrackedProduct } from '../api'
import { trackedFixture } from '../test/fakeApi'
import { initialTrackedList, trackedListReducer, type TrackedListState } from './trackedList'

const first = new Date('2026-10-11T18:00:00Z')
const later = new Date('2026-10-11T18:05:00Z')

function item(id: string, title = `Produto ${id}`): TrackedProduct {
  return trackedFixture({ id: `product-${id}`, title }, { id }) as TrackedProduct
}

function ids(state: TrackedListState) { return state.items.map((entry) => entry.tracked.id) }

function loaded(...list: TrackedProduct[]): TrackedListState {
  return trackedListReducer(initialTrackedList, { type: 'load', page: { items: list, next_cursor: 'page-2' }, receivedAt: first })
}

describe('trackedListReducer', () => {
  it('carrega a primeira página com cursor e instante de chegada', () => {
    const state = loaded(item('a'), item('b'))
    expect(state.loaded).toBe(true)
    expect(ids(state)).toEqual(['a', 'b'])
    expect(state.nextCursor).toBe('page-2')
    expect(state.items[0].receivedAt).toBe(first)
  })

  it('acrescenta a página seguinte sem repetir IDs', () => {
    const state = trackedListReducer(loaded(item('a'), item('b')), {
      type: 'append', page: { items: [item('b'), item('c')], next_cursor: null }, receivedAt: later,
    })
    expect(ids(state)).toEqual(['a', 'b', 'c'])
    expect(state.nextCursor).toBeNull()
    expect(state.items[2].receivedAt).toBe(later)
  })

  it('substitui somente o item afetado, com o novo instante de chegada', () => {
    const state = trackedListReducer(loaded(item('a'), item('b')), { type: 'replace', tracked: item('b', 'Novo título'), receivedAt: later })
    expect(state.items[1].tracked.product.title).toBe('Novo título')
    expect(state.items[1].receivedAt).toBe(later)
    expect(state.items[0].receivedAt).toBe(first)
  })

  it('ignora substituição de item que não está carregado', () => {
    const before = loaded(item('a'))
    expect(trackedListReducer(before, { type: 'replace', tracked: item('z'), receivedAt: later })).toEqual(before)
  })

  it('remove somente o item informado e preserva o cursor', () => {
    const state = trackedListReducer(loaded(item('a'), item('b'), item('c')), { type: 'remove', id: 'b' })
    expect(ids(state)).toEqual(['a', 'c'])
    expect(state.nextCursor).toBe('page-2')
  })

  it('insere no topo ao monitorar e não duplica produto retomado', () => {
    const created = trackedListReducer(loaded(item('a'), item('b')), { type: 'upsert', tracked: item('n'), receivedAt: later })
    expect(ids(created)).toEqual(['n', 'a', 'b'])
    const resumed = trackedListReducer(created, { type: 'upsert', tracked: item('b', 'Retomado'), receivedAt: later })
    expect(ids(resumed)).toEqual(['b', 'n', 'a'])
    expect(resumed.items[0].tracked.product.title).toBe('Retomado')
  })

  it('atualiza com o painel somente os itens existentes, sem inserir nem remover', () => {
    const withPage2 = trackedListReducer(loaded(item('a'), item('b')), {
      type: 'append', page: { items: [item('c')], next_cursor: null }, receivedAt: first,
    })
    const state = trackedListReducer(withPage2, {
      type: 'mergeFromDashboard', items: [item('x'), item('a', 'A atualizado')], receivedAt: later,
    })
    expect(ids(state)).toEqual(['a', 'b', 'c'])
    expect(state.items[0].tracked.product.title).toBe('A atualizado')
    expect(state.items[0].receivedAt).toBe(later)
    expect(state.items[1].receivedAt).toBe(first)
    expect(state.nextCursor).toBeNull()
  })

  it('usa a resposta do painel como carga inicial e, depois, só para atualizar itens existentes', () => {
    const page = { items: [item('a')], next_cursor: 'page-2' }
    const initial = trackedListReducer(initialTrackedList, { type: 'dashboard', page, receivedAt: first })
    expect(ids(initial)).toEqual(['a'])
    expect(initial.loaded).toBe(true)
    const afterRemoval = trackedListReducer(initial, { type: 'remove', id: 'a' })
    const recalculated = trackedListReducer(afterRemoval, { type: 'dashboard', page: { items: [item('a'), item('b')], next_cursor: 'outro' }, receivedAt: later })
    expect(ids(recalculated)).toEqual([])
    expect(recalculated.nextCursor).toBe('page-2')
  })
})
