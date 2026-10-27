import { failureText, useCapabilities, type ResearchProps } from './state'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Send } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { researchApi, type Message } from './api'
import { AIInformation, ResearchError } from './common'

export function AssistantPage({ onUnauthenticated, initialDraft }: ResearchProps & { initialDraft: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const id = location.pathname.split('/')[3] ?? null
  const [input, setInput] = useState(initialDraft.slice(0, 2000))
  const [messages, setMessages] = useState<Message[]>([])
  const [title, setTitle] = useState('Assistente de compras')
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const active = useRef(true)
  const lock = useRef(false)
  const request = useRef<{ id: string; message: string; at: number } | null>(null)
  const capabilities = useCapabilities(onUnauthenticated)
  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])
  useEffect(() => {
    if (!id) return
    let current = true
    researchApi.conversation(id).then((result) => {
      if (current) { setMessages(result.messages); setTitle(result.title); setLoading(false); setError(null) }
    }).catch((failure) => {
      if (!current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else { setError(failureText(failure)); setLoading(false) }
    })
    return () => { current = false }
  }, [id, attempt, onUnauthenticated])
  async function send() {
    const text = input.trim()
    if (lock.current || !capabilities.data?.enabled || loading) return
    if (!text) { setError('Escreva uma mensagem para continuar.'); return }
    if (text.length > 2000) { setError('Sua mensagem pode ter até 2.000 caracteres.'); return }
    if (!request.current || request.current.message !== text || Date.now() - request.current.at >= 86_400_000) {
      request.current = { id: crypto.randomUUID(), message: text, at: Date.now() }
    }
    lock.current = true; setBusy(true); setError(null)
    try {
      const result = await researchApi.chat(id, request.current.id, text)
      if (!active.current) return
      setMessages((old) => [...old, result.user_message, result.assistant_message])
      setInput(''); request.current = null
      if (!id) navigate(`/app/assistant/${encodeURIComponent(result.conversation_id)}`, { replace: true })
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else {
        setError(failureText(failure))
        if (failure instanceof ApiFailure && failure.status !== 0 && failure.code !== 'request_in_progress') request.current = null
      }
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  return <main id="research-content" className="research-content assistant-page">
    <div className="research-section-heading"><div><h1 tabIndex={-1}>{title}</h1><p>Uma pergunta de cada vez, a partir do que importa para você.</p></div><Button asChild variant="outline"><Link to="/app/assistant"><Plus aria-hidden="true" />Nova conversa</Link></Button></div>
    {loading && <p role="status">Carregando conversa…</p>}
    {!loading && messages.length === 0 && !error && <section className="assistant-empty"><h2>O que você está pensando em comprar?</h2><p>Conte como pretende usar, o que é importante e seu orçamento, se já tiver um.</p><div className="research-category-shortcuts">{['Um notebook para estudar', 'Um celular para fotografar', 'Um fone para trabalhar'].map((suggestion) => <Button key={suggestion} variant="outline" onClick={() => setInput(suggestion)}>{suggestion}</Button>)}</div></section>}
    <section className="assistant-messages" aria-label="Mensagens da conversa" aria-live="polite">{messages.map((message) => <article key={message.id} className={message.role === 'assistant' ? 'ai-message' : 'user-message'}><strong>{message.role === 'assistant' ? 'BestPrice AI' : 'Você'}</strong><p>{message.content}</p>{message.role === 'assistant' && <span className="research-meta">Resposta de IA. Dados de mercado não verificados.</span>}</article>)}</section>
    {busy && <p role="status">Preparando uma resposta…</p>}
    {error && <ResearchError text={error} onRetry={id && messages.length === 0 ? () => setAttempt((value) => value + 1) : undefined} />}
    {capabilities.error && <ResearchError text={capabilities.error} onRetry={capabilities.retry} />}
    {capabilities.data && !capabilities.data.enabled && <p className="research-notice" role="status">O assistente está indisponível no momento. Suas pesquisas salvas continuam acessíveis.</p>}
    <AIInformation />
    <form className="research-prompt" onSubmit={(event) => { event.preventDefault(); void send() }}>
      <label htmlFor="assistant-message">Sua mensagem</label><textarea id="assistant-message" value={input} maxLength={2000} disabled={busy || loading} rows={3} placeholder="Conte o que você procura..." onChange={(event) => { setInput(event.target.value); request.current = null }} />
      <div className="research-prompt-footer"><p>Até 2.000 caracteres. Limite inicial: 20 análises por dia. Conversas longas usam o contexto mais recente.</p><Button disabled={busy || loading || !capabilities.data?.enabled} type="submit"><Send aria-hidden="true" />{busy ? 'Enviando…' : 'Enviar mensagem'}</Button></div>
    </form>
  </main>
}
