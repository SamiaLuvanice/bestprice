import { Button } from '@/components/ui/button'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, matchPath, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiFailure, type User } from './api'
import { LoginForm } from './LoginForm'
import { NotFoundPage } from './NotFoundPage'
import { LandingPage } from './landing/LandingPage'
import { AccountArea } from './dashboard/AccountArea'
import { safeReturnTo } from './navigation/returnTo'
import { discardPendingTrackLink } from './navigation/pendingTrackLink'
import { Brand } from './components/Brand'
import { ResearchArea } from './features/research/ResearchArea'
import { useSignupAvailability } from './auth/useSignupAvailability'
import { SignupForm } from './auth/SignupForm'
import { useSessionCheck } from './auth/useSessionCheck'
import { ServerWakingNotice } from './auth/ServerWakingNotice'
import { isUnavailable } from './auth/wakeRetry'
import { usePageMeta } from './seo/pageMeta'
import { waitText } from './lib/format'

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

/** 0057/AC16: o limite de login mostra a espera em minutos; sem espera, a mensagem do servidor. */
function loginMessage(error: unknown): string {
  if (error instanceof ApiFailure && error.status === 429 && error.code === 'login_rate_limited' && error.retryAfterSeconds !== null) {
    return waitText('Muitas tentativas de login.', error.retryAfterSeconds)
  }
  return message(error)
}

const systemClock = () => new Date()
// 0049/AC06: catálogo do design system só no servidor de desenvolvimento. No build de
// distribuição, DEV é false, o ramo some e nenhum chunk do catálogo é emitido
// (scripts/check-no-catalog.mjs confere o dist/).
const DesignSystemCatalog = import.meta.env.DEV ? lazy(() => import('./dev/DesignSystemCatalog')) : null
const catalogPath = '/dev/design-system'
type Props = { clock?: () => Date }

// 0061: telas em que a verificação de sessão se repete sozinha enquanto a API acorda.
const wakeScope = ['/login', '/cadastro', '/app', '/app/*', '/produtos', '/produtos/:id', '/alertas']
const inWakeScope = (pathname: string) => wakeScope.some((pattern) => matchPath(pattern, pathname) !== null)

function AppRoutes({ clock }: { clock: () => Date }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = matchPath('/login', location.pathname) !== null
  const isSignup = matchPath('/cadastro', location.pathname) !== null
  const session = useSessionCheck(inWakeScope(location.pathname))
  const { state: sessionState, user, settle: settleSession } = session
  // 0061: com a API acordando, Entrar mostra o formulário (com aviso) em vez de esperar a sessão.
  const sessionWaking = sessionState === 'waking' || sessionState === 'unavailable'
  const showLogin = isLogin && (sessionState === 'guest' || sessionWaking)
  // 0061/AC08: Criar conta depende do interruptor, não da sessão, enquanto a API acorda.
  const showSignup = isSignup && (sessionState === 'guest' || sessionWaking)
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
    if (isLogin) {
      document.title = 'Entrar · BestPrice'
      // Foco no título só quando o formulário aparece; passar de "acordando" a "sem sessão" não o move.
      if (!showLogin) return
      const frame = window.requestAnimationFrame(() => document.getElementById('login-title')?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
    if (showSignup) {
      document.title = 'Criar conta · BestPrice'
      const frame = window.requestAnimationFrame(() => document.getElementById('signup-title')?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [isLogin, showLogin, showSignup])

  // 0048: consultado uma vez por carregamento, depois da sessão (a ordem das chamadas é estável).
  // 0061: repetido na janela só em Entrar e Criar conta, onde o resultado aparece.
  const signup = useSignupAvailability(isLogin || isSignup)
  // 0051/AC06: canonical e descrição por rota, independentes do estado da sessão.
  usePageMeta(location.pathname, signup.availability === 'enabled')
  const requestedReturnTo = safeReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const returnToQuery = requestedReturnTo === '/' ? '' : `?returnTo=${encodeURIComponent(requestedReturnTo)}`

  const endSession = useCallback((text: string | null) => {
    // 0050: o link do hero não sobrevive ao fim da sessão (outra conta pode entrar nesta aba).
    discardPendingTrackLink()
    settleSession(null)
    setGuestMessage(text)
    const destination = safeReturnTo(window.location.pathname)
    navigate(`/login${destination === '/' ? '' : `?returnTo=${encodeURIComponent(destination)}`}`, { replace: true })
  }, [navigate, settleSession])

  const loggedOut = useCallback(() => {
    discardPendingTrackLink()
    setLogoutRedirect(true)
    settleSession(null)
    setGuestMessage(null)
    navigate('/login', { replace: true })
  }, [navigate, settleSession])

  async function login(email: string, password: string) {
    setGuestMessage(null)
    setBusy(true)
    try {
      const result = await api.login(email, password)
      const requested = new URLSearchParams(location.search).get('returnTo')
      const target = requested ? safeReturnTo(requested) : '/app/dashboard'
      setPostLoginTarget(target)
      settleSession(result)
    } catch (failure) {
      setGuestMessage(loginMessage(failure))
      // 0061/AC05: resposta da API acordada (ex.: credencial inválida) encerra a espera e o aviso;
      // a verificação em voo ainda pode encontrar a sessão (revisão R1, I1).
      if (!isUnavailable(failure)) session.markAwake()
    }
    finally { setBusy(false) }
  }

  // 0048/AC02: a sessão já veio no 201; segue ao destino válido como o login, sem novo login.
  function signedUp(result: User) {
    setGuestMessage(null)
    setPostLoginTarget(requestedReturnTo === '/' ? '/app/dashboard' : requestedReturnTo)
    settleSession(result)
  }

  const footer = isLogin || isSignup
    ? null : <footer>BestPrice · Acompanhe com clareza</footer>
  if (import.meta.env.DEV && DesignSystemCatalog && location.pathname === catalogPath) {
    return <Suspense fallback={<p role="status">Carregando catálogo…</p>}><DesignSystemCatalog /></Suspense>
  }
  // 0050: "com sessão" só depois da confirmação; carregando ou com falha, a landing age como sem sessão.
  if (location.pathname === '/') return <LandingPage authenticated={sessionState === 'ready' && user !== null}
    signupAvailable={signup.availability === 'enabled'} />
  // 0028/AC14: verificar a sessão não oferece o campo de link; a pessoa ainda não pode monitorar.
  // 0061/AC10–AC11: nas áreas logadas, a espera mostra o aviso; o erro só vem com a janela esgotada.
  const sessionPage = sessionState === 'guest' || sessionState === 'ready' ? null : <div className="page">
    <header className="masthead"><Brand /></header>
    <main className="page-main session-check">
      <div className="content narrow">{sessionState === 'loading' || sessionState === 'waking' ? <>
        {/* Revisão R1, I2: um único status, cujo texto passa a incluir o aviso. */}
        <div role="status"><p>Carregando sua conta…</p>{sessionState === 'waking' && <ServerWakingNotice />}</div>
      </> : <div className="panel">
        <p role="alert" className="error-box">{session.error}</p>
        <Button type="button" className="primary-button" onClick={session.retry}>Tentar novamente</Button>
      </div>}</div>
    </main>{footer}
  </div>

  const loginPage = <div className="page"><main className="page-main">
    <LoginForm busy={busy} error={guestMessage} onSubmit={login} onValidationFail={() => setGuestMessage(null)}
      notice={sessionWaking ? <ServerWakingNotice /> : null}
      signupHref={signup.availability === 'enabled' ? `/cadastro${returnToQuery}` : null} />
  </main>{footer}</div>
  // 0048/AC14: com o interruptor desligado, o endereço do cadastro é só um caminho para o login.
  const signupPage = signup.availability === 'disabled' ? <Navigate to={`/login${returnToQuery}`} replace />
    : <div className="page"><main className="page-main">{signup.availability === 'enabled'
      ? <SignupForm loginHref={`/login${returnToQuery}`} onSignedUp={signedUp} />
      : <div className="content narrow session-check">{signup.availability === 'loading' ? <>
        <div role="status"><p>Carregando…</p>{(sessionWaking || signup.waking) && <ServerWakingNotice />}</div>
      </> : <div className="panel">
        <p role="alert" className="error-box">Não foi possível verificar o cadastro agora. Tente novamente.</p>
        <Button type="button" className="primary-button" onClick={() => {
          // AC09: nova janela do cadastro e, se a sessão também esgotou, dela.
          signup.retry()
          if (sessionState === 'unavailable') session.retry()
        }}>Tentar novamente</Button>
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
    <Route path="/login" element={showLogin ? loginPage : sessionPage ?? <Navigate to={signedInTarget} replace />} />
    <Route path="/cadastro" element={showSignup ? signupPage : sessionPage ?? <Navigate to={signedInTarget} replace />} />
    <Route path="/app" element={sessionPage ?? (user ? <Navigate to="/app/dashboard" replace /> : researchArea)} />
    <Route path="/app/*" element={sessionPage ?? researchArea} />
    <Route path="/" element={sessionPage ?? protectedArea} />
    <Route path="/produtos" element={sessionPage ?? protectedArea} />
    <Route path="/produtos/:id" element={sessionPage ?? protectedArea} />
    <Route path="/alertas" element={sessionPage ?? protectedArea} />
    <Route path="*" element={notFound} />
  </Routes>
}

export function App({ clock = systemClock }: Props) {
  return <BrowserRouter><AppRoutes clock={clock} /></BrowserRouter>
}
