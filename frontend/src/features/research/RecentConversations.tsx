import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Clock3, Plus } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { researchApi, researchHref, type ResearchItem } from './api'
import { ResearchError } from './common'
import { failureText, type ResearchProps } from './state'
import { useDisclosure } from '../../lib/focus'

const activityDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

export function RecentConversations({ onUnauthenticated, revision }: ResearchProps & { revision: number }) {
  const disclosure = useDisclosure()
  const panelId = useId()
  const titleId = useId()
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

  return <div className="assistant-recents-disclosure" ref={disclosure.containerRef} onKeyDown={disclosure.onKeyDown} onBlur={disclosure.onBlur}>
    <Button ref={disclosure.buttonRef} variant="outline" className="assistant-recents-toggle" aria-expanded={disclosure.open} aria-controls={panelId} onClick={disclosure.toggle}><Clock3 aria-hidden="true" />Conversas recentes<ChevronDown aria-hidden="true" /></Button>
    <div ref={disclosure.panelRef} id={panelId} hidden={!disclosure.open}>
    <section className="assistant-recent" aria-labelledby={titleId}>
    <div className="assistant-recent-heading"><h2 id={titleId}>Conversas recentes</h2><Link to="/app/history">Ver todas</Link></div>
    <Button asChild variant="outline"><Link to="/app/assistant"><Plus data-icon="inline-start" aria-hidden="true" />Nova conversa</Link></Button>
    {error ? <ResearchError text={error} onRetry={() => { setError(null); setItems(null); setAttempt((value) => value + 1) }} />
      : items === null ? <p role="status">Carregando conversas recentes…</p>
        : items.length === 0 ? <p className="assistant-recent-empty">Nenhuma conversa ainda.</p>
          : <ul>{items.map((item) => <li key={item.id}><Link to={researchHref(item)}><span><strong>{item.title}</strong><time dateTime={item.updated_at}>{activityDate.format(new Date(item.updated_at))}</time></span><ChevronRight aria-hidden="true" /></Link></li>)}</ul>}
    </section>
    </div>
  </div>
}
