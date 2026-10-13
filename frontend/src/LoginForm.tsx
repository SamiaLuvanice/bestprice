import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowDownIcon, EyeIcon, EyeOffIcon } from './dashboard/Icons'
import bestPriceLogo from './assets/logo-bestprice.png'

type Props = {
  /** O App controla o envio em curso. */
  busy: boolean
  /** Erro de login ou aviso de sessão encerrada; renderizado como o único alerta. */
  error: string | null
  /** O App chama api.login; os valores ficam aqui para sobreviver a uma falha. */
  onSubmit: (email: string, password: string) => void
}

/** Coluna decorativa (spec 0017, AC02): fora da árvore de acessibilidade e sem dados ilustrativos. */
function LoginVisual() {
  return <div className="login-visual" aria-hidden="true">
    <img className="login-visual-logo" src={bestPriceLogo} alt="" />
    <div className="login-visual-copy">
      <p className="login-visual-title">Acompanhe preços com a calma de uma vitrine.</p>
      <p className="login-visual-text">Cole o link do anúncio uma vez e o acompanhamento do preço passa a ser automático.</p>
    </div>
    <div className="login-illustration">
      <span className="login-illustration-icon"><ArrowDownIcon /></span>
      <p>Avisamos quando o preço cair.</p>
    </div>
  </div>
}

/** Entrada da tela de visitante (spec 0017), com a validação nativa da 0011. */
export function LoginForm({ busy, error, onSubmit }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const attempted = useRef(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Só uma tentativa que falhou devolve o foco à senha; o aviso de sessão na montagem não move o foco.
  useEffect(() => {
    if (busy || !error || !attempted.current) return
    attempted.current = false
    passwordRef.current?.focus()
  }, [busy, error])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setPasswordVisible(false)
    attempted.current = true
    onSubmit(email, password)
  }

  return <section className="login-shell" aria-labelledby="login-title">
    <span className="ambient-glow ambient-glow--green" aria-hidden="true" />
    <span className="ambient-glow ambient-glow--pink" aria-hidden="true" />
    <div className="login-card">
      <LoginVisual />
      <div className="login-form-side">
        <h2 id="login-title">Bem-vindo de volta</h2>
        <p className="login-subtitle">Acesse sua conta para acompanhar seus anúncios e alertas.</p>
        {error && <p role="alert" className="error-box login-error">{error}</p>}
        <form onSubmit={submit} className="login-fields">
          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>
            <input id="login-email" className="login-input" type="email" value={email}
              onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Senha</label>
            <div className="input-wrap">
              <input id="login-password" ref={passwordRef} className="login-input login-input--password"
                type={passwordVisible ? 'text' : 'password'} value={password}
                onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
              <button type="button" className="password-toggle" aria-label="Mostrar senha" aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}>
                {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <button type="submit" className="primary-button btn-pill" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  </section>
}
