import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { useMonitoringPaths } from './monitoringPaths'
import { ArrowRightIcon, InfoIcon, LinkIcon } from './Icons'

export type TrackFeedback = { message: string; trackedProductId: string | null }

type Props = {
  /** Envia o link digitado; devolve true quando o campo deve ser limpo (cadastro aceito). */
  onSubmit: (value: string) => Promise<boolean> | boolean
  submitting: boolean
  error: TrackFeedback | null
  success: string | null
  successId?: string | null
  inputRef?: Ref<HTMLInputElement>
  /** Sem produtos monitorados: o formulário ganha prioridade visual (AC23). */
  priority?: boolean
  /**
   * Produtos com lista (0028/AC05): a ação compacta “Adicionar anúncio”, que expande o
   * formulário. Sem produtos, o formulário aparece aberto como convite.
   */
  compact?: boolean
  /** Ao recolher o formulário compacto: limpa erro e sucesso do último envio. */
  onDismissFeedback?: () => void
  /** Conteúdo extra abaixo do formulário (ex.: estado vazio). */
  children?: ReactNode
  /**
   * Link trazido da landing (0050): abre o formulário já preenchido e com foco, sem enviar;
   * a pessoa confirma com "Monitorar preço".
   */
  initialValue?: string
}

/**
 * Campo de link dentro de uma seção que já tem título (lista ou cartão vazio; 0063 removeu o hero
 * com h1 da antiga Início). O campo é só obrigatório (sem validação nativa de URL), para que a
 * orientação venha sempre da API (0013); o erro fica junto ao campo e é anunciado.
 */
export function HeroTrackForm({ onSubmit, submitting, error, success, successId, inputRef, priority = false, compact = false, onDismissFeedback, children, initialValue }: Props) {
  const paths = useMonitoringPaths()
  const panelId = useId()
  const [expanded, setExpanded] = useState(Boolean(initialValue))
  const focusOnOpen = useRef(false)
  const fieldRef = useRef<HTMLInputElement | null>(null)
  // Fonte única do painel: no modo compacto só `expanded` decide; recolher fecha e limpa o retorno.
  const open = !compact || expanded
  function toggle() {
    if (expanded) onDismissFeedback?.()
    focusOnOpen.current = !expanded
    setExpanded(!expanded)
  }
  useEffect(() => {
    if (expanded && focusOnOpen.current) { focusOnOpen.current = false; fieldRef.current?.focus() }
  }, [expanded])
  // Valor trazido da landing: foco no próximo quadro, depois do foco de título da página.
  const focusInitial = useRef(Boolean(initialValue))
  useEffect(() => {
    if (!focusInitial.current) return
    const frame = window.requestAnimationFrame(() => { focusInitial.current = false; fieldRef.current?.focus() })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  function setField(element: HTMLInputElement | null) {
    fieldRef.current = element
    if (typeof inputRef === 'function') inputRef(element)
    else if (inputRef) inputRef.current = element
  }
  const hintId = useId()
  const errorId = useId()
  // O valor do campo fica aqui: digitar não re-renderiza a área inteira (tabela, linha do tempo…).
  const [value, setValue] = useState(initialValue ?? '')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (await onSubmit(value)) setValue('')
  }
  const classes = ['hero', 'hero-embedded', priority && 'hero-priority', compact && 'hero-compact'].filter(Boolean).join(' ')
  return <div className={classes}>
    <div className="hero-inner">
      <div className="hero-copy">
        <div className="hero-intro">
        {compact && <Button type="button" variant="link" className="add-listing" aria-expanded={open} aria-controls={panelId}
          onClick={toggle}>Adicionar anúncio <span aria-hidden="true">{open ? '−' : '+'}</span></Button>}
        </div>
        <div className="hero-entry">
        {/* Sempre no DOM para aria-controls apontar para um id existente; `hidden` quando recolhido. */}
        <Card className="track-panel" id={panelId} hidden={!open}>
          {!compact && <h2>Comece por um link</h2>}
          <form onSubmit={(event) => void submit(event)} className="track-form">
          <div className="track-field">
            <LinkIcon className="field-icon" />
            <label htmlFor="product-url" className="track-label">Link do anúncio do Mercado Livre</label>
            <Input id="product-url" ref={setField} type="text" inputMode="url" autoComplete="url" required value={value}
              onChange={(event) => setValue(event.target.value)} placeholder="https://www.mercadolivre.com.br/..."
              aria-invalid={error ? true : undefined} aria-describedby={error ? `${errorId} ${hintId}` : hintId} />
          </div>
          <Button disabled={submitting} type="submit" className="primary-button">Monitorar preço <ArrowRightIcon /></Button>
        </form>
        <p id={hintId} className="hero-hint"><InfoIcon /> Copie o link do anúncio no Mercado Livre e cole aqui.</p>
        <div role="status" className="hero-status">{submitting ? 'Localizando produto...' : success}</div>
        {successId && <Link className="text-button" to={paths.product(successId)}>Ver produto</Link>}
        {error && <div className="hero-error">
          <p id={errorId} role="alert" className="error-box">{error.message}</p>
          {error.trackedProductId && <Link className="text-button" to={paths.product(error.trackedProductId)}>Ver produto</Link>}
        </div>}
        </Card>
        {children}
        </div>
      </div>
    </div>
  </div>
}
