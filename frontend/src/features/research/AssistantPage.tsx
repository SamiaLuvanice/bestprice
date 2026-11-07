import { failureText, useCapabilities, type ResearchProps } from './state'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { researchApi, type Message } from './api'
import { ResearchError, webSearchNotice } from './common'
import { MessageGrounding } from './MessageGrounding'
import { RecentConversations } from './RecentConversations'
import assistantRobot from '../../assets/research/assistant-robot.png'

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
  const [revision, setRevision] = useState(0)
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
      setRevision((value) => value + 1)
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
  const welcoming = !id && messages.length === 0
  const remaining = 2000 - input.length
  return <main id="research-content" className="research-content assistant-page">
    <div className={`assistant-stage${welcoming ? ' assistant-stage-welcome' : ''}`}>
    {welcoming ? <section className="assistant-welcome" aria-labelledby="assistant-greeting">
      <div className="assistant-greeting"><h1 id="assistant-greeting" tabIndex={-1}>O que você quer comprar?</h1><p>Se quiser, diga seu orçamento e como pretende usar.</p></div>
      <img className="assistant-robot" src={assistantRobot} alt="Robô do assistente BestPrice IA" width="1248" height="1280" />
    </section> : <div className="assistant-conversation-heading"><h1 tabIndex={-1}>{title}</h1></div>}
    {loading && <p role="status">Carregando conversa…</p>}
    {messages.length > 0 && <section className="assistant-messages" aria-label="Mensagens da conversa" aria-live="polite">{messages.map((message) => <article key={message.id} className={message.role === 'assistant' ? 'ai-message' : 'user-message'} aria-label={message.role === 'assistant' ? 'Resposta de BestPrice IA. Dados de mercado não verificados.' : 'Mensagem de você'}><div className="assistant-author">{message.role === 'assistant' && <img src={assistantRobot} alt="" width="48" height="49" />}<strong title={message.role === 'assistant' ? 'Resposta de IA. Preços, estoque e especificações não verificados.' : undefined}>{message.role === 'assistant' ? 'BestPrice IA' : 'Você'}</strong></div><p>{message.content}</p>{message.role === 'assistant' && <MessageGrounding grounding={message.grounding} />}</article>)}</section>}
    {busy && <p role="status">Preparando uma resposta…</p>}
    {error && <ResearchError text={error} onRetry={id && messages.length === 0 ? () => setAttempt((value) => value + 1) : undefined} />}
    {capabilities.error && <ResearchError text={capabilities.error} onRetry={capabilities.retry} />}
    {!capabilities.data && !capabilities.error && <p role="status">Verificando disponibilidade do assistente…</p>}
    {capabilities.data && !capabilities.data.enabled && <p className="research-notice" role="status">O assistente está indisponível no momento. Suas pesquisas salvas continuam acessíveis.</p>}
    <form className="research-prompt assistant-composer" onSubmit={(event) => { event.preventDefault(); void send() }} aria-busy={busy}>
      <label htmlFor="assistant-message">Sua mensagem</label><textarea id="assistant-message" value={input} maxLength={2000} disabled={busy || loading} rows={2} aria-describedby={`assistant-message-hint${remaining <= 200 ? ' assistant-character-count' : ''}`} placeholder={welcoming ? 'Ex.: notebook para estudar, até R$ 3.500' : 'Continue sua conversa…'} onChange={(event) => { setInput(event.target.value); request.current = null }} />
      <p className="assistant-essential-notice">O Google processa suas mensagens. Na modalidade gratuita, o conteúdo pode ser usado para melhorar seus produtos. Não envie dados pessoais ou confidenciais.{capabilities.data?.web_search && <> {webSearchNotice}</>}</p>
      <div className="assistant-composer-footer"><div><p id="assistant-message-hint">Até 2.000 caracteres</p>{remaining <= 200 && <p id="assistant-character-count" className="assistant-character-count">{remaining} caracteres restantes</p>}</div><Button size="icon" disabled={busy || loading || !capabilities.data?.enabled} type="submit" aria-label={busy ? 'Enviando…' : 'Enviar mensagem'}><ArrowUp aria-hidden="true" /></Button></div>
    </form>
    </div>
    <RecentConversations onUnauthenticated={onUnauthenticated} revision={revision} />
  </main>
}
