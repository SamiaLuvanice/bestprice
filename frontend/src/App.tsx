import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiFailure, type User } from './api'
import { LoginForm } from './LoginForm'
import { NotFoundPage } from './NotFoundPage'
import { LandingPage } from './landing/LandingPage'
import { AccountArea } from './dashboard/AccountArea'
import { HeroTrackForm, type TrackFeedback } from './dashboard/HeroTrackForm'
import { safeReturnTo } from './navigation/returnTo'
import bestPriceLogo from './assets/logo-bestprice.png'

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

const systemClock = () => new Date()
type Props = { clock?: () => Date }

function AppRoutes({ clock }: { clock: () => Date }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [sessionState, setSessionState] = useState<'loading' | 'guest' | 'ready' | 'unavailable'>('loading')
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionAttempt, setSessionAttempt] = useState(0)
  const [guestMessage, setGuestMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [guestTrackError, setGuestTrackError] = useState<TrackFeedback | null>(null)
  const [postLoginTarget, setPostLoginTarget] = useState<string | null>(null)
  const [logoutRedirect, setLogoutRedirect] = useState(false)
  useEffect(() => {
    if (location.pathname !== '/login') setPostLoginTarget(null)
  }, [location.pathname])
  useEffect(() => {
    if (logoutRedirect && location.pathname === '/login') setLogoutRedirect(false)
  }, [logoutRedirect, location.pathname])
  useEffect(() => {
    if (sessionState === 'guest' && location.pathname === '/login') {
      document.title = 'Entrar · BestPrice'
      const frame = window.requestAnimationFrame(() => document.getElementById('login-title')?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
    if (!['/', '/produtos', '/alertas'].includes(location.pathname) &&
      !/^\/produtos\/[^/]+$/.test(location.pathname)) {
      document.title = 'Página não encontrada · BestPrice'
      const frame = window.requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [location.pathname, sessionState])

  useEffect(() => {
    let active = true
    api.me().then((result) => {
      if (active) { setUser(result); setSessionState('ready') }
    }).catch((failure: unknown) => {
      if (!active) return
      if (failure instanceof ApiFailure && failure.status === 401) {
        setUser(null)
        setSessionState('guest')
        return
      }
      setSessionError(message(failure))
      setSessionState('unavailable')
    })
    return () => { active = false }
  }, [sessionAttempt])

  useEffect(() => {
    function revalidate(event: PageTransitionEvent) {
      if (event.persisted) {
        setUser(null)
        setSessionState('loading')
        setSessionAttempt((attempt) => attempt + 1)
      }
    }
    window.addEventListener('pageshow', revalidate)
    return () => window.removeEventListener('pageshow', revalidate)
  }, [])

  const endSession = useCallback((text: string | null) => {
    setUser(null)
    setGuestMessage(text)
    setSessionState('guest')
    const destination = safeReturnTo(window.location.pathname)
    navigate(`/login${destination === '/' ? '' : `?returnTo=${encodeURIComponent(destination)}`}`, { replace: true })
  }, [navigate])

  const loggedOut = useCallback(() => {
    setLogoutRedirect(true)
    setUser(null)
    setGuestMessage(null)
    setSessionState('guest')
    navigate('/login', { replace: true })
  }, [navigate])

  async function login(email: string, password: string) {
    setGuestMessage(null)
    setBusy(true)
    try {
      const result = await api.login(email, password)
      const target = safeReturnTo(new URLSearchParams(location.search).get('returnTo'))
      setPostLoginTarget(target)
      setUser(result)
      setSessionState('ready')
    } catch (failure) { setGuestMessage(message(failure)) }
    finally { setBusy(false) }
  }

  const footer = <footer>BestPrice · Acompanhe com clareza</footer>
  function trackAsGuest() {
    setGuestTrackError({ message: 'Entre na sua conta para monitorar este anúncio.', trackedProductId: null })
    return false
  }
  if (location.pathname === '/' && sessionState !== 'ready') return <LandingPage />
  if (sessionState === 'loading' || sessionState === 'unavailable') return <div className="page">
    <header className="masthead"><img className="brand-logo" src={bestPriceLogo} alt="BestPrice" /></header>
    <main className="page-main">
      <HeroTrackForm onSubmit={trackAsGuest} submitting={false} error={guestTrackError} success={null} />
      <div className="content narrow">{sessionState === 'loading' ? <p role="status">Carregando sua conta…</p> : <div className="panel">
        <p role="alert" className="error-box">{sessionError}</p>
        <Button type="button" className="primary-button" onClick={() => {
          setSessionError(null)
          setSessionState('loading')
          setSessionAttempt((attempt) => attempt + 1)
        }}>Tentar novamente</Button>
      </div>}</div>
    </main>{footer}
  </div>

  const loginPage = <div className="page"><main className="page-main">
    <LoginForm busy={busy} error={guestMessage} onSubmit={login} onValidationFail={() => setGuestMessage(null)} />
  </main>{footer}</div>
  const notFound = <div className="page"><NotFoundPage authenticated={user !== null} />{footer}</div>

  const protectedArea = user ? <div className="page">
    <AccountArea key={user.id} user={user} clock={clock} onUnauthenticated={endSession} onLoggedOut={loggedOut} />{footer}
  </div> : <Navigate to={logoutRedirect ? '/login' : `/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />

  return <Routes>
    <Route path="/login" element={user ? <Navigate to={postLoginTarget ?? '/'} replace /> : loginPage} />
    <Route path="/" element={protectedArea} />
    <Route path="/produtos" element={protectedArea} />
    <Route path="/produtos/:id" element={protectedArea} />
    <Route path="/alertas" element={protectedArea} />
    <Route path="*" element={notFound} />
  </Routes>
}

export function App({ clock = systemClock }: Props) {
  return <BrowserRouter><AppRoutes clock={clock} /></BrowserRouter>
}
