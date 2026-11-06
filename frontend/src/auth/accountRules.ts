// Regra única de conta (spec 0048), espelho de backend/app/auth/accounts.py.
// Os comprimentos contam code points, como `len` no Python, e não unidades UTF-16.

export const EMAIL_MAX_CHARS = 320
export const PASSWORD_MIN_CHARS = 12
export const PASSWORD_MAX_CHARS = 1024
// Classe proibida idêntica a backend/app/auth/accounts.py: `@`, controles C0/C1, espaço e os
// separadores Unicode. Não usa `\s` nem `trim()`, cujas definições diferem entre JS e Python.
const FORBIDDEN = '@\u0000-\u0020\u007F-\u009F\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF'
// nome@domínio.tld: partes sem caractere proibido, com pelo menos um ponto depois do @.
export const EMAIL_PATTERN = new RegExp(`^[^${FORBIDDEN}]+@[^${FORBIDDEN}]+\\.[^${FORBIDDEN}]+$`)
// Só espaço, tabulação, quebras de linha, form feed e tab vertical ASCII saem das pontas.
const ASCII_EDGE_SPACE = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g

function stripAsciiSpace(value: string): string {
  return value.replace(ASCII_EDGE_SPACE, '')
}

/** E-mail como o servidor grava: sem espaços ASCII nas pontas e em minúsculas. */
export function normalizeEmail(raw: string): string {
  return stripAsciiSpace(raw).toLowerCase()
}

const MESSAGES: Record<string, string> = {
  email_required: 'Informe seu e-mail.',
  email_too_long: `O e-mail pode ter no máximo ${EMAIL_MAX_CHARS} caracteres.`,
  email_invalid: 'Informe um e-mail válido, como nome@exemplo.com.',
  password_too_short: `A senha precisa ter pelo menos ${PASSWORD_MIN_CHARS} caracteres.`,
  password_too_long: `A senha pode ter no máximo ${PASSWORD_MAX_CHARS} caracteres.`,
  email_already_registered: 'Já existe uma conta com este e-mail.',
}

const CONFIRMATION_MISMATCH = 'As senhas não conferem.'

export type SignupErrors = { email?: string; password?: string; confirmation?: string }

/** Texto local para um `code` estável do contrato; `null` quando o código não é conhecido. */
export function accountRuleMessage(code: string): string | null {
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : null
}

function charCount(value: string): number {
  return Array.from(value).length
}

/** Primeira regra violada do e-mail, na ordem do contrato: tamanho bruto → vazio → formato. */
function emailViolation(email: string): string | null {
  if (charCount(email) > EMAIL_MAX_CHARS) return 'email_too_long'
  const normalized = normalizeEmail(email)
  if (!normalized) return 'email_required'
  if (!EMAIL_PATTERN.test(normalized)) return 'email_invalid'
  return null
}

function passwordViolation(password: string): string | null {
  const length = charCount(password)
  if (length < PASSWORD_MIN_CHARS) return 'password_too_short'
  if (length > PASSWORD_MAX_CHARS) return 'password_too_long'
  return null
}

/** Validação local do cadastro: todos os campos inválidos de uma vez, com a mensagem de cada um. */
export function validateSignup(email: string, password: string, confirmation: string): SignupErrors {
  const errors: SignupErrors = {}
  const emailCode = emailViolation(email)
  const passwordCode = passwordViolation(password)
  if (emailCode) errors.email = MESSAGES[emailCode]
  if (passwordCode) errors.password = MESSAGES[passwordCode]
  if (confirmation !== password) errors.confirmation = CONFIRMATION_MISMATCH
  return errors
}
