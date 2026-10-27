import { failureText, type ResearchProps } from './state'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { researchApi, researchHref, type ResearchItem, type ResearchKind, type ResearchPage } from './api'
import { DeleteResearchDialog, ResearchError } from './common'

export function HistoryPage({ onUnauthenticated }: ResearchProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState({ q: '', kind: 'all' as ResearchKind, offset: 0 })
  const [page, setPage] = useState<ResearchPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [deleting, setDeleting] = useState<ResearchItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const active = useRef(true)
  const lock = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    let active = true
    researchApi.list(filter.kind, filter.q, filter.offset).then((result) => { if (active) { setPage(result); setError(null) } }).catch((failure) => {
      if (!active) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failureText(failure))
    })
    return () => { active = false }
  }, [filter, attempt, onUnauthenticated])
  function reload() { setPage(null); setError(null); setAttempt((value) => value + 1) }
  async function remove() {
    if (!deleting || lock.current) return
    lock.current = true
    setBusy(true); setDeleteError(null)
    try {
      if (deleting.kind === 'conversation') await researchApi.deleteConversation(deleting.id)
      else await researchApi.deleteComparison(deleting.id)
      if (!active.current) return
      setDeleting(null); setFilter((old) => ({ ...old, offset: 0 })); reload()
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setDeleteError(failureText(failure))
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  return <main id="research-content" className="research-content history-page"><h1 tabIndex={-1}>Retome de onde parou.</h1><p>Conversas e comparações guardadas por até 90 dias da criação.</p>
    <form className="research-history-filters" onSubmit={(event) => { event.preventDefault(); setPage(null); setError(null); setFilter((old) => ({ ...old, q: query.trim(), offset: 0 })) }}>
      <div><label htmlFor="history-search">Buscar pelo título</label><input id="history-search" value={query} maxLength={100} onChange={(event) => setQuery(event.target.value)} /></div><div><label htmlFor="history-kind">Tipo de pesquisa</label><select id="history-kind" value={filter.kind} onChange={(event) => { setPage(null); setError(null); setFilter({ q: query.trim(), kind: event.target.value as ResearchKind, offset: 0 }) }}><option value="all">Todas</option><option value="conversation">Conversas</option><option value="comparison">Comparações</option></select></div><Button type="submit"><Search aria-hidden="true" />Buscar</Button>
    </form>
    {error ? <ResearchError text={error} onRetry={reload} /> : page === null ? <p role="status">Carregando histórico…</p> : page.items.length === 0 ? <section className="research-empty"><h2>{filter.q || filter.kind !== 'all' ? 'Nenhuma pesquisa encontrada.' : 'Seu histórico começa com a primeira ideia.'}</h2><p>{filter.q || filter.kind !== 'all' ? 'Tente outro título ou filtro.' : 'Inicie uma conversa ou salve uma comparação para voltar depois.'}</p><Link to="/app/assistant">Iniciar uma conversa</Link></section> : <ul className="research-list">{page.items.map((item) => <li key={`${item.kind}-${item.id}`}><Link to={researchHref(item)}><strong>{item.title}</strong><span>{item.kind === 'conversation' ? 'Conversa' : 'Comparação'} · {new Intl.DateTimeFormat('pt-BR').format(new Date(item.updated_at))}</span></Link><Button size="icon" variant="ghost" aria-label={`Excluir ${item.title}`} onClick={() => { setDeleting(item); setDeleteError(null) }}><Trash2 aria-hidden="true" /></Button></li>)}</ul>}
    {page && <div className="research-actions"><Button variant="outline" disabled={filter.offset === 0} onClick={() => { setPage(null); setFilter((old) => ({ ...old, offset: Math.max(0, old.offset - 20) })) }}>Anterior</Button><Button variant="outline" disabled={page.next_offset === null} onClick={() => { if (page.next_offset !== null) { setPage(null); setFilter((old) => ({ ...old, offset: page.next_offset ?? 0 })) } }}>Próxima</Button></div>}
    {deleting && <DeleteResearchDialog title={deleting.title} busy={busy} error={deleteError} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />}
  </main>
}
