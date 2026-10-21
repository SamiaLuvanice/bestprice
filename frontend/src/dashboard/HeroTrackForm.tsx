import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useId, useState, type FormEvent, type ReactNode, type Ref } from 'react'
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
  /** Conteúdo extra abaixo do formulário (ex.: estado vazio). */
  children?: ReactNode
}

/**
 * Hero com o campo de link. O campo é só obrigatório (sem validação nativa de URL), para que a
 * orientação venha sempre da API (0013); o erro fica junto ao campo e é anunciado.
 */
export function HeroTrackForm({ onSubmit, submitting, error, success, successId, headingRef, inputRef, priority = false, pageTitle, children }: Props) {
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
          {pageTitle ?? 'Seu painel de preços'}
        </h1>
        <p className="intro">Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.</p>
        <Card className="track-panel"><h2>Comece por um link</h2><p className="track-description">Cole a URL do anúncio do Mercado Livre para acompanhar automaticamente.</p><form onSubmit={(event) => void submit(event)} className="track-form">
          <div className="track-field">
            <LinkIcon className="field-icon" />
            <label htmlFor="product-url" className="track-label">Link do anúncio do Mercado Livre</label>
            <Input id="product-url" ref={inputRef} type="text" inputMode="url" autoComplete="url" required value={value}
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
        <p className="hero-note">Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.</p>
        {children}
      </div>
    </div>
  </section>
}
