import { failureText, type ResearchProps } from './state'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChartNoAxesCombined, Columns2, History, Home, Laptop, Menu, MessageSquare, Smartphone, Headphones, X } from 'lucide-react'
import { api, ApiFailure, type User } from '../../api'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/button'
import { AccountMenu } from '../../dashboard/AccountMenu'
import { AccountArea } from '../../dashboard/AccountArea'
import { researchApi, researchHref, type ResearchPage } from './api'
import { ResearchError } from './common'
import { AssistantPage } from './AssistantPage'
import { ComparisonPage } from './ComparisonPage'
import { HistoryPage } from './HistoryPage'
import './research.css'

const navigation = [
  { href: '/app/dashboard', label: 'Dashboard', Icon: Home },
  { href: '/app/assistant', label: 'Assistente IA', Icon: MessageSquare },
  { href: '/app/compare', label: 'Comparador', Icon: Columns2 },
  { href: '/app/history', label: 'Histórico', Icon: History },
  { href: '/app/monitoring', label: 'Monitoramento', Icon: ChartNoAxesCombined },
]

function ResearchLayout({ user, children, onUnauthenticated, onLoggedOut, monitoring }: ResearchProps & {
  user: User; children: ReactNode; onLoggedOut: () => void; monitoring: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef(true)
  const lock = useRef(false)
  const location = useLocation()
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (menuOpen) document.querySelector<HTMLElement>('#research-navigation a')?.focus()
  }, [menuOpen])
  const current = navigation.find((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))?.label ?? 'Seu espaço de compras'
  useEffect(() => {
    document.title = `${current} · BestPrice AI`
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('.research-body h1')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, current])
  async function logout() {
    if (lock.current) return
    lock.current = true
    setBusy(true); setError(null)
    try { await api.logout(); if (active.current) onLoggedOut() }
    catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failureText(failure))
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  return <div className={`research-shell${monitoring ? ' research-shell-monitoring' : ''}`}>
    <a className="research-skip" href={monitoring ? '#conteudo' : '#research-content'}>Pular para o conteúdo</a>
    <aside className={`research-sidebar${menuOpen ? ' is-open' : ''}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget?.id !== 'research-menu-toggle') setMenuOpen(false)
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') { setMenuOpen(false); document.getElementById('research-menu-toggle')?.focus() }
    }}>
      <Link className="research-brand" to="/app/dashboard" aria-label="BestPrice AI — Dashboard"><Brand decorative />{' '}<span className="research-ai">AI</span></Link>
      <nav aria-label="Espaço de compras" id="research-navigation">
        {navigation.map(({ href, label, Icon }) => <NavLink key={href} to={href} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}
      </nav>
      <div className="research-sidebar-note"><strong>Escolhas com mais clareza</strong><p>A IA ajuda a decidir.<br />Você escolhe o que faz sentido.</p></div>
    </aside>
    <div className="research-body">
      {monitoring && <Link to="/app/dashboard" className="research-monitoring-return">Espaço de compras</Link>}
      {!monitoring && <header className="research-topbar"><strong className="research-current-section">{current}</strong><Link className="research-mobile-brand research-brand" to="/app/dashboard" aria-label="BestPrice AI — Dashboard"><Brand decorative />{' '}<span className="research-ai">AI</span></Link><div className="research-topbar-actions">
        <AccountMenu email={user.email} loggingOut={busy} onLogout={() => void logout()} />
        <Button id="research-menu-toggle" variant="ghost" size="icon" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} aria-controls="research-navigation" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</Button>
      </div></header>}
      {error && <ResearchError text={error} />}
      {children}
    </div>
    <nav className="research-bottom-nav" aria-label="Atalhos móveis">{navigation.slice(0, 4).map(({ href, label, Icon }) => <NavLink key={href} to={href}><Icon aria-hidden="true" /><span>{label === 'Dashboard' ? 'Início' : label === 'Assistente IA' ? 'Assistente' : label === 'Comparador' ? 'Comparar' : label}</span></NavLink>)}</nav>
  </div>
}

function DashboardPage({ onUnauthenticated, createDraft }: ResearchProps & { createDraft: (text: string) => string }) {
  const [prompt, setPrompt] = useState('')
  const [page, setPage] = useState<ResearchPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    researchApi.list('all', '', 0, 6).then((result) => { if (active) { setPage(result); setError(null) } }).catch((failure) => {
      if (!active) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failureText(failure))
    })
    return () => { active = false }
  }, [attempt, onUnauthenticated])
  function start() {
    if (!prompt.trim()) { setValidation('Conte o que você deseja comprar.'); return }
    navigate('/app/assistant', { state: { draftToken: createDraft(prompt.trim()) } })
  }
  return <main id="research-content" className="research-content">
    <div className="research-welcome"><h1 tabIndex={-1}>Uma boa compra começa<br className="research-desktop-break" /> com uma boa conversa.</h1><p>Conte o que você procura. Vamos organizar as opções com você.</p></div>
    <form className="research-prompt" onSubmit={(event) => { event.preventDefault(); start() }}>
      <label htmlFor="purchase-prompt">O que você deseja comprar hoje?</label>
      <textarea id="purchase-prompt" maxLength={2000} value={prompt} placeholder="Ex.: um notebook para estudar e trabalhar..." aria-describedby={validation ? 'prompt-error' : 'prompt-hint'} onChange={(event) => { setPrompt(event.target.value); setValidation(null) }} />
      {validation && <p id="prompt-error" role="alert">{validation}</p>}
      <div className="research-prompt-footer"><p id="prompt-hint">Inclua seu uso, orçamento e o que é importante.</p><Button type="submit">Conversar com a IA <ArrowRight aria-hidden="true" /></Button></div>
    </form>
    <div className="research-category-shortcuts" aria-label="Sugestões de categoria">{[
      { label: 'Notebooks', Icon: Laptop, draft: 'Quero escolher um notebook para ' },
      { label: 'Celulares', Icon: Smartphone, draft: 'Quero escolher um celular para ' },
      { label: 'Fones de ouvido', Icon: Headphones, draft: 'Quero escolher um fone de ouvido para ' },
    ].map(({ label, Icon, draft }) => <Button key={label} variant="outline" onClick={() => { setPrompt(draft); document.getElementById('purchase-prompt')?.focus() }}><Icon aria-hidden="true" />{label}</Button>)}</div>
    <section aria-labelledby="recent-research-title" className="research-recent"><div className="research-section-heading"><h2 id="recent-research-title">Suas pesquisas</h2><Link to="/app/history">Ver histórico</Link></div>
      {error ? <ResearchError text={error} onRetry={() => setAttempt((value) => value + 1)} /> : page === null ? <p role="status">Carregando suas pesquisas…</p> : page.items.length > 0 ? <ul className="research-list">{page.items.map((item) => <li key={`${item.kind}-${item.id}`}><Link to={researchHref(item)}><strong>{item.title}</strong><span>{item.kind === 'conversation' ? 'Conversa' : 'Comparação'}</span></Link></li>)}</ul> : <div className="research-empty-pair"><div><MessageSquare aria-hidden="true" /><h3>Suas conversas</h3><p>As ideias que você explorar ficam aqui.</p><Link to="/app/assistant">Iniciar uma conversa</Link></div><div><Columns2 aria-hidden="true" /><h3>Suas comparações</h3><p>Coloque até três produtos lado a lado.</p><Link to="/app/compare">Criar comparação</Link></div></div>}
    </section>
    <Link to="/app/monitoring" className="research-monitoring"><ChartNoAxesCombined aria-hidden="true" /><div><strong>Monitoramento em evolução</strong><p>Consulte os dados disponíveis dos produtos que você acompanha.</p></div><ArrowRight aria-hidden="true" /></Link>
  </main>
}

export function ResearchArea({ user, clock, onUnauthenticated, onLoggedOut }: ResearchProps & { user: User; clock: () => Date; onLoggedOut: () => void }) {
  const location = useLocation()
  // Conteúdo efêmero pertence a esta montagem autenticada; o histórico recebe só um token.
  const [drafts] = useState(() => new Map<string, string>())
  function createDraft(text: string) { const token = crypto.randomUUID(); drafts.clear(); drafts.set(token, text); return token }
  const state: unknown = location.state
  const draft = typeof state === 'object' && state !== null && 'draftToken' in state && typeof state.draftToken === 'string' ? drafts.get(state.draftToken) ?? '' : ''
  const monitoring = /^\/app\/monitoring(?:\/[^/]+)?$/.test(location.pathname)
  let page: ReactNode
  if (monitoring) page = <AccountArea user={user} clock={clock} onUnauthenticated={onUnauthenticated} onLoggedOut={onLoggedOut} />
  else if (location.pathname === '/app/dashboard') page = <DashboardPage onUnauthenticated={onUnauthenticated} createDraft={createDraft} />
  else if (/^\/app\/assistant(?:\/[^/]+)?$/.test(location.pathname)) page = <AssistantPage key={location.key} onUnauthenticated={onUnauthenticated} initialDraft={draft} />
  else if (/^\/app\/compare(?:\/[^/]+)?$/.test(location.pathname)) page = <ComparisonPage key={location.key} onUnauthenticated={onUnauthenticated} />
  else if (location.pathname === '/app/history') page = <HistoryPage onUnauthenticated={onUnauthenticated} />
  else page = <main className="research-content" id="research-content"><h1 tabIndex={-1}>Página não encontrada</h1><p>Confira o endereço ou volte para seu espaço.</p><Link to="/app/dashboard">Ir para Dashboard</Link></main>
  return <ResearchLayout user={user} onUnauthenticated={onUnauthenticated} onLoggedOut={onLoggedOut} monitoring={monitoring}>{page}</ResearchLayout>
}
