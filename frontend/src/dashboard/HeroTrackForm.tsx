import { useId, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { ArrowRightIcon, InfoIcon, LinkIcon } from './Icons'

export type TrackFeedback = { message: string; trackedProductId: string | null }

type Props = {
  /** Envia o link digitado; devolve true quando o campo deve ser limpo (cadastro aceito). */
  onSubmit: (value: string) => Promise<boolean> | boolean
  submitting: boolean
  error: TrackFeedback | null
  success: string | null
  onViewProduct?: (id: string) => void
  headingRef?: Ref<HTMLHeadingElement>
  inputRef?: Ref<HTMLInputElement>
  /** Sem produtos monitorados: o hero ganha prioridade visual (AC23). */
  priority?: boolean
  /** Conteúdo extra abaixo do formulário (ex.: estado vazio). */
  children?: ReactNode
}

/** Ilustração abstrata, sem texto, número, preço, data, produto ou logotipo; oculta de tecnologias assistivas. */
function HeroIllustration() {
  return <svg className="hero-illustration" viewBox="0 0 320 220" aria-hidden="true" focusable="false">
    <rect x="34" y="28" width="220" height="150" rx="22" className="shape-card" />
    <rect x="66" y="52" width="232" height="140" rx="22" className="shape-card shape-card-front" />
    <path d="M92 156 C120 150 132 112 160 118 S204 160 230 128 S262 92 278 96" className="shape-line" />
    <circle cx="230" cy="128" r="7" className="shape-dot" />
    <circle cx="70" cy="36" r="10" className="shape-bubble" />
    <circle cx="292" cy="48" r="6" className="shape-bubble" />
  </svg>
}

/**
 * Hero com o campo de link. O campo é só obrigatório (sem validação nativa de URL), para que a
 * orientação venha sempre da API (0013); o erro fica junto ao campo e é anunciado.
 */
export function HeroTrackForm({ onSubmit, submitting, error, success, onViewProduct, headingRef, inputRef, priority = false, children }: Props) {
  const hintId = useId()
  const errorId = useId()
  // O valor do campo fica aqui: digitar não re-renderiza a área inteira (tabela, linha do tempo…).
  const [value, setValue] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (await onSubmit(value)) setValue('')
  }
  return <section className={priority ? 'hero hero-priority' : 'hero'} id="inicio" aria-labelledby="page-title">
    <div className="hero-inner">
      <div className="hero-copy">
        <h1 id="page-title" ref={headingRef} tabIndex={-1}>
          <span className="hero-line">Acompanhe o preço.</span>{' '}
          <span className="hero-line hero-highlight">Compre na hora certa.</span>
        </h1>
        <p className="intro">Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.</p>
        <form onSubmit={(event) => void submit(event)} className="track-form">
          <div className="track-field">
            <LinkIcon className="field-icon" />
            <label htmlFor="product-url" className="sr-only">Link do anúncio do Mercado Livre</label>
            <input id="product-url" ref={inputRef} type="text" inputMode="url" autoComplete="url" required value={value}
              onChange={(event) => setValue(event.target.value)} placeholder="https://www.mercadolivre.com.br/..."
              aria-invalid={error ? true : undefined} aria-describedby={error ? `${errorId} ${hintId}` : hintId} />
          </div>
          <button disabled={submitting} type="submit" className="primary-button">Monitorar preço <ArrowRightIcon /></button>
        </form>
        <p id={hintId} className="hero-hint"><InfoIcon /> Copie o link do anúncio no Mercado Livre e cole aqui.</p>
        <div role="status" className="hero-status">{submitting ? 'Localizando produto...' : success}</div>
        {error && <div className="hero-error">
          <p id={errorId} role="alert" className="error-box">{error.message}</p>
          {error.trackedProductId && onViewProduct && <button type="button" className="text-button" onClick={() => {
            if (error.trackedProductId) onViewProduct(error.trackedProductId)
          }}>Ver produto</button>}
        </div>}
        <p className="hero-note">Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.</p>
        {children}
      </div>
      <HeroIllustration />
    </div>
  </section>
}
