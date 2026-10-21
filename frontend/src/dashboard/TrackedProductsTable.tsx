import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import type { ReactNode, Ref } from 'react'
import { productColumns, type RowState } from './productColumns'
import { TrackedProductRow } from './TrackedProductRow'
import type { TrackedEntry } from './trackedList'

type Props = {
  entries: TrackedEntry[]
  rowStates: Record<string, RowState>
  hasMore: boolean
  loadingMore: boolean
  loadMoreError: string | null
  onLoadMore: () => void
  renderActions?: (entry: TrackedEntry) => ReactNode
  message: string | null
  headingRef: Ref<HTMLHeadingElement>
  skeleton?: ReactNode
  /** Ação compacta "Adicionar anúncio" (ou o convite, sem produtos), logo abaixo do título. */
  toolbar?: ReactNode
}

const idle: RowState = { busy: false, message: null }

/** Seção “Seus produtos”: tabela semântica com papéis explícitos, para manter a semântica empilhada. */
export function TrackedProductsTable({ entries, rowStates, hasMore, loadingMore, loadMoreError, onLoadMore, renderActions, message, headingRef, skeleton, toolbar }: Props) {
  return <section id="seus-produtos" aria-labelledby="tracked-title" aria-busy={Boolean(skeleton)} className="card-section products-section">
    <div className="section-heading">
      {/* Título único da página Produtos (revisão 0028): h1, sem "Produtos" duplicado. */}
      <h1 id="tracked-title" ref={headingRef} tabIndex={-1}>Seus produtos</h1>
      <p className="section-subtitle">Todos os produtos que você está monitorando.</p>
      <p className="section-order">Ordem: mais recentes primeiro</p>
    </div>
    {toolbar}
    <div role="status" data-testid="products-status" className="section-status">{message}</div>
    {skeleton}
    {!skeleton && <>
      <Table role="table" className="products-table" aria-labelledby="tracked-title">
        <thead role="rowgroup">
          <tr role="row">{productColumns.map((column) => <th role="columnheader" scope="col" key={column}>{column}</th>)}</tr>
        </thead>
        {entries.map((entry) => <TrackedProductRow key={entry.tracked.id} entry={entry} state={rowStates[entry.tracked.id] ?? idle}
          actions={renderActions?.(entry)} />)}
      </Table>
      <p className="table-note">Menor e maior preço desde o primeiro registro no BestPrice.</p>
      {loadMoreError && <p role="alert" className="error-box">{loadMoreError}</p>}
      {hasMore && <Button type="button" className="secondary-button" disabled={loadingMore} onClick={onLoadMore}>
        Carregar mais{' '}<span className="sr-only">produtos</span>
      </Button>}
    </>}
  </section>
}
