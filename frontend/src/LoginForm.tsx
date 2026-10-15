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
  /** Chamado quando a validação local recusa o envio (o App remove o alerta do servidor anterior). */
  onValidationFail?: () => void
}

export type LoginErrors = { email?: string; password?: string }

const EMAIL_EMPTY = 'Informe seu e-mail.'
const EMAIL_INVALID = 'Informe um e-mail válido, como nome@exemplo.com.'
const PASSWORD_EMPTY = 'Informe sua senha.'
// texto@domínio com um único @, sem espaço, domínio com ponto e sem rótulo vazio.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** 0020/AC07: validação do envio. O e-mail ignora espaços nas pontas; a senha só não pode ser vazia. */
// Função pura exportada para teste direto (plan 0020, decisão 3).
// eslint-disable-next-line react-refresh/only-export-components
export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  const trimmed = email.trim()
  if (!trimmed) errors.email = EMAIL_EMPTY
  else if (!EMAIL_PATTERN.test(trimmed)) errors.email = EMAIL_INVALID
  if (!password) errors.password = PASSWORD_EMPTY
  return errors
}

/** Coluna visual (0017/AC02, 0020/AC12): só a logo tem nome acessível; o restante é decorativo e sem dados ilustrativos. */
function LoginVisual() {
  return <div className="login-visual">
    <img className="login-visual-logo" src={bestPriceLogo} alt="BestPrice" />
    <div className="login-visual-copy" aria-hidden="true">
      <p className="login-visual-title">Cole o link uma vez. A BestPrice acompanha o preço.</p>
    </div>
    <div className="login-illustration" aria-hidden="true">
      <span className="login-illustration-icon"><ArrowDownIcon /></span>
      <p>Você é avisado quando o preço cair.</p>
    </div>
  </div>
}

/** Entrada da tela de visitante (spec 0017), com validação própria no envio (0020/AC07). */
export function LoginForm({ busy, error, onSubmit, onValidationFail }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const attempted = useRef(false)
  const emailRef = useRef<HTMLInputElement>(null)
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
    const found = validateLogin(email, password)
    setErrors(found)
    if (found.email || found.password) {
      onValidationFail?.()
      ;(found.email ? emailRef : passwordRef).current?.focus()
      return
    }
    attempted.current = true
    onSubmit(email.trim(), password)
  }

  // A mensagem de um campo só some quando ele volta a ser válido; nunca reaparece fora do envio.
  function changeEmail(value: string) {
    setEmail(value)
    if (errors.email && !validateLogin(value, 'x').email) setErrors((current) => ({ ...current, email: undefined }))
  }

  function changePassword(value: string) {
    setPassword(value)
    if (errors.password && value) setErrors((current) => ({ ...current, password: undefined }))
  }

  return <section className="login-shell" aria-labelledby="login-title">
    <span className="ambient-glow ambient-glow--green" aria-hidden="true" />
    <span className="ambient-glow ambient-glow--pink" aria-hidden="true" />
    <div className="login-card">
      <LoginVisual />
      <div className="login-form-side">
        <img className="login-brand-compact" src={bestPriceLogo} alt="BestPrice" />
        <h1 id="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acesse sua conta para acompanhar seus anúncios e alertas.</p>
        {error && <p role="alert" className="error-box login-error">{error}</p>}
        <form onSubmit={submit} className="login-fields" noValidate>
          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>
            <input id="login-email" ref={emailRef} className="login-input" type="email" value={email}
              onChange={(event) => changeEmail(event.target.value)} required autoComplete="email"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'login-email-error' : undefined} />
            {errors.email && <p id="login-email-error" className="field-error">{errors.email}</p>}
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Senha</label>
            <div className="input-wrap">
              <input id="login-password" ref={passwordRef} className="login-input login-input--password"
                type={passwordVisible ? 'text' : 'password'} value={password}
                onChange={(event) => changePassword(event.target.value)} required autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? 'login-password-error' : undefined} />
              <button type="button" className="password-toggle" aria-label="Mostrar senha" aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}>
                {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p id="login-password-error" className="field-error">{errors.password}</p>}
          </div>
          <button type="submit" className="primary-button btn-pill" aria-disabled={busy || undefined} aria-busy={busy || undefined}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  </section>
}
