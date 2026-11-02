import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock3, Plus } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { researchApi, researchHref, type ResearchItem } from './api'
import { ResearchError } from './common'
import { failureText, type ResearchProps } from './state'

const activityDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

export function RecentConversations({ onUnauthenticated, revision }: ResearchProps & { revision: number }) {
  const [items, setItems] = useState<ResearchItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    researchApi.list('conversation', '', 0, 4).then((page) => {
      if (active) { setItems(page.items); setError(null) }
    }).catch((failure: unknown) => {
      if (!active) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failureText(failure))
    })
    return () => { active = false }
  }, [attempt, revision, onUnauthenticated])

  return <section className="assistant-recent" aria-labelledby="assistant-recent-title">
    <div className="assistant-recent-heading"><h2 id="assistant-recent-title"><Clock3 aria-hidden="true" />Conversas recentes</h2><Link to="/app/history">Ver todas</Link></div>
    <Button asChild variant="outline"><Link to="/app/assistant"><Plus data-icon="inline-start" aria-hidden="true" />Nova conversa</Link></Button>
    {error ? <ResearchError text={error} onRetry={() => { setError(null); setItems(null); setAttempt((value) => value + 1) }} />
      : items === null ? <p role="status">Carregando conversas recentes…</p>
        : items.length === 0 ? <p className="assistant-recent-empty">Sua próxima compra começa com uma conversa. Escreva uma mensagem para iniciar a primeira.</p>
          : <ul>{items.map((item) => <li key={item.id}><Link to={researchHref(item)}><span><strong>{item.title}</strong><time dateTime={item.updated_at}>{activityDate.format(new Date(item.updated_at))}</time></span><ChevronRight aria-hidden="true" /></Link></li>)}</ul>}
    <div className="assistant-recent-note"><h3>Volte quando quiser.</h3><p>Suas conversas ficam salvas por 90 dias desde a criação.</p></div>
  </section>
}
