import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, InfoIcon, LinkIcon } from './Icons'

export type TrackFeedback = { message: string; trackedProductId: string | null }

type Props = {
  /** Envia o link digitado; devolve true quando o campo deve ser limpo (cadastro aceito). */
  onSubmit: (value: string) => Promise<boolean> | boolean
  submitting: boolean
  error: TrackFeedback | null
  success: string | null
  successId?: string | null
  headingRef?: Ref<HTMLHeadingElement>
  inputRef?: Ref<HTMLInputElement>
  /** Sem produtos monitorados: o hero ganha prioridade visual (AC23). */
  priority?: boolean
  pageTitle?: string
  /**
   * Produtos com lista (0028/AC05): título curto e a ação compacta “Adicionar anúncio”, que
   * expande o formulário. Sem produtos, o formulário aparece aberto como convite.
   */
  compact?: boolean
  /**
   * Dentro de outra seção que já tem o título da página (Produtos): sem h1, sem região própria
   * e sem introdução. Combinado com `compact`, mostra só a ação "Adicionar anúncio".
   */
  embedded?: boolean
  /** Ao recolher o formulário compacto: limpa erro e sucesso do último envio. */
  onDismissFeedback?: () => void
  /** Conteúdo extra abaixo do formulário (ex.: estado vazio). */
  children?: ReactNode
}

/**
 * Hero com o campo de link. O campo é só obrigatório (sem validação nativa de URL), para que a
 * orientação venha sempre da API (0013); o erro fica junto ao campo e é anunciado.
 */
export function HeroTrackForm({ onSubmit, submitting, error, success, successId, headingRef, inputRef, priority = false, pageTitle, compact = false, embedded = false, onDismissFeedback, children }: Props) {
  const panelId = useId()
  const [expanded, setExpanded] = useState(false)
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
  function setField(element: HTMLInputElement | null) {
    fieldRef.current = element
    if (typeof inputRef === 'function') inputRef(element)
    else if (inputRef) inputRef.current = element
  }
  const hintId = useId()
  const errorId = useId()
  // O valor do campo fica aqui: digitar não re-renderiza a área inteira (tabela, linha do tempo…).
  const [value, setValue] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (await onSubmit(value)) setValue('')
  }
  const classes = ['hero', priority && 'hero-priority', compact && 'hero-compact', embedded && 'hero-embedded'].filter(Boolean).join(' ')
  const addButton = compact && <Button type="button" variant="link" className="add-listing" aria-expanded={open} aria-controls={panelId}
    onClick={toggle}>Adicionar anúncio <span aria-hidden="true">{open ? '−' : '+'}</span></Button>
  const Root = embedded ? 'div' : 'section'
  return <Root className={classes} id={embedded ? undefined : 'inicio'} aria-labelledby={embedded ? undefined : 'page-title'}>
    <div className="hero-inner">
      <div className="hero-copy">
        {embedded ? addButton : <div className="hero-heading">
          <h1 id="page-title" ref={headingRef} tabIndex={-1}>
            {pageTitle ?? 'Seu painel de preços'}
          </h1>
          {addButton}
        </div>}
        {!compact && !embedded && <p className="intro">Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.</p>}
        {/* Sempre no DOM para aria-controls apontar para um id existente; `hidden` quando recolhido. */}
        <Card className="track-panel" id={panelId} hidden={!open}>{!compact && <><h2>Comece por um link</h2><p className="track-description">Cole a URL do anúncio do Mercado Livre para acompanhar automaticamente.</p></>}<form onSubmit={(event) => void submit(event)} className="track-form">
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
        {successId && <Link className="text-button" to={`/produtos/${successId}`}>Ver produto</Link>}
        {error && <div className="hero-error">
          <p id={errorId} role="alert" className="error-box">{error.message}</p>
          {error.trackedProductId && <Link className="text-button" to={`/produtos/${error.trackedProductId}`}>Ver produto</Link>}
        </div>}
        </Card>
        {!compact && <p className="hero-note">Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.</p>}
        {children}
      </div>
    </div>
  </Root>
}
