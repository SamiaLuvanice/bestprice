import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiFailure, type User } from '../api'
import { Brand } from '../components/Brand'
import { EyeIcon, EyeOffIcon } from '../dashboard/Icons'
import { accountRuleMessage, validateSignup, type SignupErrors } from './accountRules'

type Props = {
  /** Login com o mesmo `returnTo` válido; usado em "Já tem uma conta?" e no atalho do 409. */
  loginHref: string
  /** A API já iniciou a sessão no 201; o App só segue ao destino. */
  onSignedUp: (user: User) => void
}

type Field = keyof SignupErrors

// Estrutura provisória com as classes do login (spec 0048): o layout final depende do Figma (D1).
const FIELD_ORDER: Field[] = ['email', 'password', 'confirmation']
const GENERIC_FAILURE = 'Não foi possível criar a conta agora. Tente novamente.'
const UNAVAILABLE = 'Cadastro indisponível no momento.'

const FIELD_LABELS: Record<Field, string> = { email: 'E-mail', password: 'Senha', confirmation: 'Confirmar senha' }

/** Resumo anunciado na região polida; o texto de cada erro é lido pelo foco via aria-describedby. */
function fieldSummary(found: SignupErrors): string {
  const labels = FIELD_ORDER.filter((field) => found[field]).map((field) => FIELD_LABELS[field])
  if (labels.length === 0) return ''
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`
  return labels.length === 1 ? `1 campo precisa de correção: ${list}.` : `${labels.length} campos precisam de correção: ${list}.`
}

function waitText(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `Muitas tentativas de cadastro. Tente novamente em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`
}

/** Erros por campo vindos do servidor: texto local pelo `code` estável, senão a mensagem do servidor. */
function serverFieldErrors(failure: ApiFailure): SignupErrors {
  const errors: SignupErrors = {}
  for (const item of failure.fields) {
    if ((item.field === 'email' || item.field === 'password') && !errors[item.field]) {
      errors[item.field] = accountRuleMessage(item.code) ?? item.message
    }
  }
  return errors
}

/** Traduz a falha do envio em erros de campo ou em um único alerta geral. */
function describeFailure(failure: unknown): { errors: SignupErrors; alert: string | null; registered: boolean } {
  if (!(failure instanceof ApiFailure)) return { errors: {}, alert: GENERIC_FAILURE, registered: false }
  if (failure.code === 'email_already_registered') {
    return { errors: { email: accountRuleMessage('email_already_registered') ?? failure.message }, alert: null, registered: true }
  }
  if (failure.status === 422) {
    const errors = serverFieldErrors(failure)
    return { errors, alert: errors.email || errors.password ? null : failure.message, registered: false }
  }
  if (failure.status === 429) {
    return { errors: {}, alert: failure.retryAfterSeconds === null ? failure.message : waitText(failure.retryAfterSeconds), registered: false }
  }
  if (failure.code === 'signup_unavailable') return { errors: {}, alert: UNAVAILABLE, registered: false }
  return { errors: {}, alert: GENERIC_FAILURE, registered: false }
}

type PasswordFieldProps = {
  id: string
  label: string
  toggleLabel: string
  value: string
  error?: string
  hint?: ReactNode
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
}

function PasswordField({ id, label, toggleLabel, value, error, hint, inputRef, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return <div className="login-field">
    <label htmlFor={id}>{label}</label>
    <div className="input-wrap">
      <Input id={id} ref={inputRef} className="login-input login-input--password" type={visible ? 'text' : 'password'}
        value={value} onChange={(event) => onChange(event.target.value)} required autoComplete="new-password"
        aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
      <Button type="button" className="password-toggle" aria-label={toggleLabel} aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}>
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
    {hint && <p id={`${id}-hint`} className="login-note">{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>
}

/** Cadastro self-service (spec 0048): validação própria no envio e erros do servidor por campo. */
export function SignupForm({ loginHref, onSignedUp }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<SignupErrors>({})
  const [alert, setAlert] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  // Só muda no resultado de um envio, para não anunciar a cada tecla.
  const [announcement, setAnnouncement] = useState('')
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const refs: Record<Field, React.RefObject<HTMLInputElement | null>> = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirmation: useRef<HTMLInputElement>(null),
  }

  function focusFirstInvalid(found: SignupErrors, fallback: Field | null) {
    const field = FIELD_ORDER.find((name) => found[name]) ?? fallback
    if (field) refs[field].current?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // A ref barra o segundo envio antes do re-render que marca o botão como ocupado.
    if (sending.current) return
    const found = validateSignup(email, password, confirmation)
    setAlert(null)
    setRegistered(false)
    setErrors(found)
    setAnnouncement(fieldSummary(found))
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found, null)
      return
    }
    sending.current = true
    setBusy(true)
    try {
      // Enviado como digitado: o servidor aplica a mesma normalização e conta o tamanho bruto.
      const user = await api.signup(email, password)
      onSignedUp(user)
    } catch (failure) {
      const outcome = describeFailure(failure)
      // O e-mail nunca é apagado; as senhas sim, depois de qualquer recusa do servidor.
      setPassword('')
      setConfirmation('')
      setErrors(outcome.errors)
      setAnnouncement(fieldSummary(outcome.errors))
      setAlert(outcome.alert)
      setRegistered(outcome.registered)
      focusFirstInvalid(outcome.errors, 'password')
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  function change(field: Field, value: string) {
    if (field === 'email') setEmail(value)
    else if (field === 'password') setPassword(value)
    else setConfirmation(value)
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
    if (field === 'email') setRegistered(false)
  }

  return <section className="login-shell" aria-labelledby="signup-title">
    <div className="login-card">
      <div className="login-visual" aria-hidden="true" />
      <div className="login-form-side">
        <Brand className="login-brand" />
        <h1 id="signup-title" tabIndex={-1}>Criar sua conta</h1>
        <p className="login-subtitle">Comece a acompanhar preços do Mercado Livre em poucos segundos.</p>
        <form onSubmit={submit} className="login-fields" noValidate>
          <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
          <div className="login-field">
            <label htmlFor="signup-email">E-mail</label>
            <Input id="signup-email" ref={refs.email} className="login-input" type="email" value={email}
              onChange={(event) => change('email', event.target.value)} required autoComplete="email"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'signup-email-error' : undefined} />
            {errors.email && <p id="signup-email-error" className="field-error">
              {errors.email}{registered && <> <Link to={loginHref}>Entrar</Link></>}
            </p>}
          </div>
          <PasswordField id="signup-password" label="Senha" toggleLabel="Mostrar senha" value={password}
            error={errors.password} hint="Use pelo menos 12 caracteres." inputRef={refs.password}
            onChange={(value) => change('password', value)} />
          <PasswordField id="signup-confirmation" label="Confirmar senha" toggleLabel="Mostrar confirmação da senha"
            value={confirmation} error={errors.confirmation} inputRef={refs.confirmation}
            onChange={(value) => change('confirmation', value)} />
          <p className="login-note">Usamos seu e-mail só para identificar sua conta e permitir seu acesso. Não enviamos mensagens.</p>
          {alert && <p role="alert" className="error-box login-error">{alert}</p>}
          <Button type="submit" className="primary-button btn-pill" aria-disabled={busy || undefined} aria-busy={busy || undefined}>
            {busy ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
        <p className="login-note">Já tem uma conta? <Link to={loginHref}>Entrar</Link></p>
        <Button asChild variant="link" className="login-back"><a href="/">Voltar para o início</a></Button>
      </div>
    </div>
  </section>
}
