import { useCallback, useEffect, useState } from 'react'
import { api, ApiFailure, type User } from './api'
import { LoginForm } from './LoginForm'
import { AccountArea } from './dashboard/AccountArea'
import { HeroTrackForm, type TrackFeedback } from './dashboard/HeroTrackForm'
import bestPriceLogo from './assets/logo-bestprice.png'

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
  const [guestTrackError, setGuestTrackError] = useState<TrackFeedback | null>(null)
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

  // No sucesso o LoginForm desmonta e descarta a senha; na falha os valores ficam nele (0017/AC06).
  async function login(email: string, password: string) {
    setGuestMessage(null)
    setBusy(true)
    try {
      const result = await api.login(email, password)
      setUser(result)
      setSessionState('ready')
    } catch (failure) { setGuestMessage(message(failure)) }
    finally { setBusy(false) }
  }

  function trackAsGuest() {
    setGuestTrackError({ message: 'Entre na sua conta para monitorar este anúncio.', trackedProductId: null })
    return false
  }

  if (sessionState === 'ready' && user) {
    return <div className="page">
      <AccountArea user={user} clock={clock} onUnauthenticated={onUnauthenticated} onLoggedOut={onLoggedOut} />
      <footer>BestPrice · Acompanhe com clareza</footer>
    </div>
  }

  return <div className="page">
    <header className="masthead">
      <img className="brand-logo" src={bestPriceLogo} alt="BestPrice" />
      <span className="brand-name" aria-hidden="true">BestPrice</span>
    </header>
    <main className="page-main">

    <HeroTrackForm onSubmit={trackAsGuest} submitting={false} error={guestTrackError} success={null} />

    {sessionState === 'loading' && <section className="content"><p role="status">Carregando sua conta…</p></section>}
    {sessionState === 'unavailable' && <section className="content narrow">
      <div className="panel">
        <p role="alert" className="error-box">{sessionError}</p>
        <button type="button" className="primary-button" onClick={retrySession}>Tentar novamente</button>
      </div>
    </section>}
    {sessionState === 'guest' && <LoginForm busy={busy} error={guestMessage} onSubmit={login} />}
    </main>
    <footer>BestPrice · Acompanhe com clareza</footer>
  </div>
}
