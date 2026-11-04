import { failureText, type ResearchProps } from './state'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { researchApi, researchHref, type ResearchItem, type ResearchPage } from './api'
import { DeleteResearchDialog, ResearchError } from './common'
import './history.css'

const dateFormat = new Intl.DateTimeFormat('pt-BR')

export function HistoryPage({ onUnauthenticated }: ResearchProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState({ q: '', offset: 0 })
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
    researchApi.list('conversation', filter.q, filter.offset).then((result) => { if (active) { setPage(result); setError(null) } }).catch((failure) => {
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
      await researchApi.deleteConversation(deleting.id)
      if (!active.current) return
      setDeleting(null); setFilter((old) => ({ ...old, offset: 0 })); reload()
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setDeleteError(failureText(failure))
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  return <main id="research-content" className="research-content history-page">
    <header className="history-heading"><h1 tabIndex={-1}>Suas conversas</h1><p><span className="history-desktop-description">Retome suas conversas e continue de onde parou.</span><span className="history-mobile-description">Retome de onde parou.</span></p></header>
    <form className="history-search" role="search" aria-label="Conversas salvas" onSubmit={(event) => { event.preventDefault(); setPage(null); setError(null); setFilter({ q: query.trim(), offset: 0 }) }}>
      <label className="sr-only" htmlFor="history-search">Buscar pelo título</label>
      <Button type="submit" variant="ghost" size="icon" aria-label="Buscar conversas"><Search aria-hidden="true" /></Button>
      <Input id="history-search" type="search" value={query} maxLength={100} placeholder="Buscar nas conversas" onChange={(event) => setQuery(event.target.value)} />
    </form>
    {error ? <ResearchError text={error} onRetry={reload} /> : page === null ? <p role="status">Carregando histórico…</p> : page.items.length === 0 ? <section className="research-empty"><h2>{filter.q ? 'Nenhuma conversa encontrada.' : 'Seu histórico começa com a primeira ideia.'}</h2><p>{filter.q ? 'Tente buscar por outro título.' : 'Inicie uma conversa para voltar depois.'}</p><Button asChild variant="outline"><Link to="/app/assistant">Iniciar uma conversa</Link></Button></section> : <ul className="history-list" aria-label="Conversas salvas">{page.items.map((item) => <li key={item.id} className="history-card">
      <div className="history-card-summary"><h2>{item.title}</h2><p>Atualizada em <time dateTime={item.updated_at}>{dateFormat.format(new Date(item.updated_at))}</time></p></div>
      <div className="history-card-actions"><Button asChild variant="outline"><Link to={researchHref(item)} aria-label={`Continuar ${item.title}`}>Continuar</Link></Button><Button variant="link" aria-label={`Excluir ${item.title}`} onClick={() => { setDeleting(item); setDeleteError(null) }}>Excluir</Button></div>
    </li>)}</ul>}
    {!error && page && (filter.offset > 0 || page.next_offset !== null) && <nav className="research-actions" aria-label="Páginas de conversas"><Button variant="outline" disabled={filter.offset === 0} onClick={() => { setPage(null); setFilter((old) => ({ ...old, offset: Math.max(0, old.offset - 20) })) }}>Anterior</Button><Button variant="outline" disabled={page.next_offset === null} onClick={() => { if (page.next_offset !== null) { setPage(null); setFilter((old) => ({ ...old, offset: page.next_offset ?? 0 })) } }}>Próxima</Button></nav>}
    <p className="history-retention">Conversas guardadas por até 90 dias da criação.</p>
    {deleting && <DeleteResearchDialog title={deleting.title} busy={busy} error={deleteError} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />}
  </main>
}
