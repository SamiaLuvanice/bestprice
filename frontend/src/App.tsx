import { Button } from '@/components/ui/button'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, matchPath, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiFailure, type User } from './api'
import { LoginForm } from './LoginForm'
import { NotFoundPage } from './NotFoundPage'
import { LandingPage } from './landing/LandingPage'
import { AccountArea } from './dashboard/AccountArea'
import { safeReturnTo } from './navigation/returnTo'
import { Brand } from './components/Brand'
import { ResearchArea } from './features/research/ResearchArea'
import { useSignupAvailability } from './auth/useSignupAvailability'
import { SignupForm } from './auth/SignupForm'

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

const systemClock = () => new Date()
// 0049/AC06: catálogo do design system só no servidor de desenvolvimento. No build de
// distribuição, DEV é false, o ramo some e nenhum chunk do catálogo é emitido
// (scripts/check-no-catalog.mjs confere o dist/).
const DesignSystemCatalog = import.meta.env.DEV ? lazy(() => import('./dev/DesignSystemCatalog')) : null
const catalogPath = '/dev/design-system'
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
  const [postLoginTarget, setPostLoginTarget] = useState<string | null>(null)
  const [logoutRedirect, setLogoutRedirect] = useState(false)
  useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/cadastro') setPostLoginTarget(null)
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
    if (sessionState === 'guest' && location.pathname === '/cadastro') {
      document.title = 'Criar conta · BestPrice'
      const frame = window.requestAnimationFrame(() => document.getElementById('signup-title')?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
    if (import.meta.env.DEV && location.pathname === catalogPath) return
    if (!/^\/app(?:\/|$)/.test(location.pathname) && !['/', '/produtos', '/alertas', '/cadastro'].includes(location.pathname) &&
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

  // 0048: consultado uma vez por carregamento, depois da sessão (a ordem das chamadas é estável).
  const signup = useSignupAvailability()
  const requestedReturnTo = safeReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const returnToQuery = requestedReturnTo === '/' ? '' : `?returnTo=${encodeURIComponent(requestedReturnTo)}`

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
      const requested = new URLSearchParams(location.search).get('returnTo')
      const target = requested ? safeReturnTo(requested) : '/app/dashboard'
      setPostLoginTarget(target)
      setUser(result)
      setSessionState('ready')
    } catch (failure) { setGuestMessage(message(failure)) }
    finally { setBusy(false) }
  }

  // 0048/AC02: a sessão já veio no 201; segue ao destino válido como o login, sem novo login.
  function signedUp(result: User) {
    setGuestMessage(null)
    setPostLoginTarget(requestedReturnTo === '/' ? '/app/dashboard' : requestedReturnTo)
    setUser(result)
    setSessionState('ready')
  }

  const footer = matchPath('/login', location.pathname) || matchPath('/cadastro', location.pathname)
    ? null : <footer>BestPrice · Acompanhe com clareza</footer>
  if (import.meta.env.DEV && DesignSystemCatalog && location.pathname === catalogPath) {
    return <Suspense fallback={<p role="status">Carregando catálogo…</p>}><DesignSystemCatalog /></Suspense>
  }
  // 0050: "com sessão" só depois da confirmação; carregando ou com falha, a landing age como sem sessão.
  if (location.pathname === '/') return <LandingPage authenticated={sessionState === 'ready' && user !== null}
    signupAvailable={signup.availability === 'enabled'} />
  // 0028/AC14: verificar a sessão não oferece o campo de link; a pessoa ainda não pode monitorar.
  if (sessionState === 'loading' || sessionState === 'unavailable') return <div className="page">
    <header className="masthead"><Brand /></header>
    <main className="page-main session-check">
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
    <LoginForm busy={busy} error={guestMessage} onSubmit={login} onValidationFail={() => setGuestMessage(null)}
      signupHref={signup.availability === 'enabled' ? `/cadastro${returnToQuery}` : null} />
  </main>{footer}</div>
  // 0048/AC14: com o interruptor desligado, o endereço do cadastro é só um caminho para o login.
  const signupPage = signup.availability === 'disabled' ? <Navigate to={`/login${returnToQuery}`} replace />
    : <div className="page"><main className="page-main">{signup.availability === 'enabled'
      ? <SignupForm loginHref={`/login${returnToQuery}`} onSignedUp={signedUp} />
      : <div className="content narrow session-check">{signup.availability === 'loading' ? <p role="status">Carregando…</p> : <div className="panel">
        <p role="alert" className="error-box">Não foi possível verificar o cadastro agora. Tente novamente.</p>
        <Button type="button" className="primary-button" onClick={signup.retry}>Tentar novamente</Button>
      </div>}</div>}
    </main>{footer}</div>
  const notFound = <div className="page"><NotFoundPage authenticated={user !== null} />{footer}</div>

  const protectedArea = user ? <div className="page">
    <AccountArea key={user.id} user={user} clock={clock} onUnauthenticated={endSession} onLoggedOut={loggedOut} />{footer}
  </div> : <Navigate to={logoutRedirect ? '/login' : `/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />
  const researchArea = user ? <ResearchArea key={user.id} user={user} clock={clock} onUnauthenticated={endSession} onLoggedOut={loggedOut} />
    : <Navigate to={logoutRedirect ? '/login' : `/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />

  // 0050: quem já tem sessão em Entrar ou Criar conta segue ao returnTo seguro, ou ao destino padrão.
  const signedInTarget = postLoginTarget ?? (requestedReturnTo === '/' ? '/app/dashboard' : requestedReturnTo)
  return <Routes>
    <Route path="/login" element={user ? <Navigate to={signedInTarget} replace /> : loginPage} />
    <Route path="/cadastro" element={user ? <Navigate to={signedInTarget} replace /> : signupPage} />
    <Route path="/app" element={user ? <Navigate to="/app/dashboard" replace /> : researchArea} />
    <Route path="/app/*" element={researchArea} />
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
