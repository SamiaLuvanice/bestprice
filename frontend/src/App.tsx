import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiFailure, type User } from './api'
import { AccountArea } from './dashboard/AccountArea'

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

function unauthenticated(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure && error.status === 401
}

const systemClock = () => new Date()

type Props = {
  /** Fonte de tempo injetável: textos relativos usam o instante de chegada de cada resposta. */
  clock?: () => Date
}

/** Portão de sessão (0011): carregando, indisponível, entrada ou área autenticada. */
export function App({ clock = systemClock }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionState, setSessionState] = useState<'loading' | 'guest' | 'ready' | 'unavailable'>('loading')
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionAttempt, setSessionAttempt] = useState(0)
  const [guestMessage, setGuestMessage] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api.me().then((result) => {
      if (active) { setUser(result); setSessionState('ready') }
    }).catch((failure: unknown) => {
      if (!active) return
      if (unauthenticated(failure)) { setSessionState('guest'); return }
      setSessionError(message(failure))
      setSessionState('unavailable')
    })
    return () => { active = false }
  }, [sessionAttempt])

  function retrySession() {
    setSessionError(null)
    setSessionState('loading')
    setSessionAttempt((attempt) => attempt + 1)
  }

  // Somente 401 encerra a sessão local; a mensagem da API aparece na entrada.
  const endSession = useCallback((text: string | null) => {
    setUser(null)
    setGuestMessage(text)
    setSessionState('guest')
  }, [])
  const onUnauthenticated = useCallback((text: string) => endSession(text), [endSession])
  const onLoggedOut = useCallback(() => endSession(null), [endSession])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuestMessage(null)
    setBusy(true)
    try {
      const result = await api.login(email, password)
      setUser(result)
      setPassword('')
      setSessionState('ready')
    } catch (failure) { setGuestMessage(message(failure)) }
    finally { setBusy(false) }
  }

  function trackAsGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuestMessage('Entre na sua conta para monitorar este anúncio.')
  }

  if (sessionState === 'ready' && user) {
    return <main className="page">
      <AccountArea user={user} clock={clock} onUnauthenticated={onUnauthenticated} onLoggedOut={onLoggedOut} />
      <footer>BestPrice · Acompanhe com clareza</footer>
    </main>
  }

  return <main className="page">
    <header className="masthead">
      <span className="brand-mark" aria-hidden="true">B</span>
      <span className="brand-name">BestPrice</span>
    </header>

    <section className="hero" aria-labelledby="page-title">
      <div className="hero-inner">
        <span className="eyebrow">MONITORAMENTO DE PREÇOS</span>
        <h1 id="page-title">Acompanhe o preço. Compre na hora certa.</h1>
        <p className="intro">Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.</p>
        <form onSubmit={trackAsGuest} className="track-form">
          <label htmlFor="product-url" className="sr-only">Link do anúncio do Mercado Livre</label>
          <input id="product-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.mercadolivre.com.br/..." />
          <button type="submit">Monitorar preço</button>
        </form>
        {guestMessage && <p role="alert" className="error-box">{guestMessage}</p>}
        <p className="hero-note">Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.</p>
      </div>
    </section>

    {sessionState === 'loading' && <section className="content"><p role="status">Carregando sua conta…</p></section>}
    {sessionState === 'unavailable' && <section className="content narrow">
      <div className="panel">
        <p role="alert" className="error-box">{sessionError}</p>
        <button type="button" className="primary-button" onClick={retrySession}>Tentar novamente</button>
      </div>
    </section>}
    {sessionState === 'guest' && <section className="content narrow" aria-labelledby="login-title">
      <div className="panel">
        <span className="eyebrow">SUA ÁREA</span>
        <h2 id="login-title">Entre para acompanhar seus anúncios</h2>
        <form onSubmit={login} className="login-form">
          <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          <button disabled={busy} type="submit">Entrar</button>
        </form>
      </div>
    </section>}
    <footer>BestPrice · Acompanhe com clareza</footer>
  </main>
}
