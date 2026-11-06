import { describe, expect, it } from 'vitest'
import { accountRuleMessage, EMAIL_PATTERN, validateSignup } from './accountRules'

// Mesma tabela de casos do backend (B1): as duas versões da regra precisam concordar.
const EMAIL_REQUIRED = 'Informe seu e-mail.'
const EMAIL_INVALID = 'Informe um e-mail válido, como nome@exemplo.com.'
const EMAIL_TOO_LONG = 'O e-mail pode ter no máximo 320 caracteres.'
const PASSWORD_TOO_SHORT = 'A senha precisa ter pelo menos 12 caracteres.'
const PASSWORD_TOO_LONG = 'A senha pode ter no máximo 1024 caracteres.'
const CONFIRMATION_MISMATCH = 'As senhas não conferem.'

const validPassword = 'uma-senha-longa'

function emailError(email: string) {
  return validateSignup(email, validPassword, validPassword).email
}

function passwordError(password: string) {
  return validateSignup('ana@exemplo.com', password, password).password
}

/** E-mail válido com exatamente `length` code points. */
function emailOf(length: number, filler = 'a') {
  const domain = '@exemplo.com'
  return filler.repeat(length - domain.length) + domain
}

describe('e-mail do cadastro', () => {
  it.each(['ana@exemplo.com', 'ana@exemplo.com.br', ' Ana@Exemplo.com ', 'a.b+c@sub.exemplo.com.br', 'ana@exémplo.com.br'])('aceita %j', (value) => {
    expect(emailError(value)).toBeUndefined()
  })

  it.each(['a@b', 'a@b.', 'a b@c.com', 'a@@b.com', 'nome@.com', 'ana\u00a0x@exemplo.com', 'ana@exemplo\u2003.com'])('recusa %j por formato', (value) => {
    expect(emailError(value)).toBe(EMAIL_INVALID)
  })

  it('distingue vazio, inclusive só com espaços', () => {
    expect(emailError('')).toBe(EMAIL_REQUIRED)
    expect(emailError('   ')).toBe(EMAIL_REQUIRED)
  })

  it('aceita 320 code points e recusa 321 contando os espaços das pontas', () => {
    expect(emailError(emailOf(320))).toBeUndefined()
    expect(emailError(emailOf(321))).toBe(EMAIL_TOO_LONG)
    expect(emailError(` ${emailOf(319)} `)).toBe(EMAIL_TOO_LONG)
    expect(emailError(` ${emailOf(318)} `)).toBeUndefined()
  })

  it('conta code points, não unidades UTF-16', () => {
    // 308 emojis + @exemplo.com = 320 code points (628 unidades UTF-16).
    expect(emailError(emailOf(320, '😀'))).toBeUndefined()
    expect(emailError(emailOf(321, '😀'))).toBe(EMAIL_TOO_LONG)
  })

  it('aplica o limite antes de vazio e de formato', () => {
    expect(emailError(' '.repeat(321))).toBe(EMAIL_TOO_LONG)
    expect(emailError('a'.repeat(321))).toBe(EMAIL_TOO_LONG)
  })

  it('expõe a mesma expressão usada pelo login', () => {
    expect(EMAIL_PATTERN.test('nome@exemplo.com')).toBe(true)
    expect(EMAIL_PATTERN.test('nome@exemplo')).toBe(false)
  })
})

describe('senha do cadastro', () => {
  it('recusa 11 e aceita 12 caracteres', () => {
    expect(passwordError('a'.repeat(11))).toBe(PASSWORD_TOO_SHORT)
    expect(passwordError('a'.repeat(12))).toBeUndefined()
    expect(passwordError('')).toBe(PASSWORD_TOO_SHORT)
  })

  it('aceita 1024 e recusa 1025 caracteres', () => {
    expect(passwordError('a'.repeat(1024))).toBeUndefined()
    expect(passwordError('a'.repeat(1025))).toBe(PASSWORD_TOO_LONG)
  })

  it('conta code points: 11 emojis ainda é curta e 1024 emojis cabe', () => {
    expect(passwordError('😀'.repeat(11))).toBe(PASSWORD_TOO_SHORT)
    expect(passwordError('😀'.repeat(12))).toBeUndefined()
    expect(passwordError('😀'.repeat(1024))).toBeUndefined()
    expect(passwordError('😀'.repeat(1025))).toBe(PASSWORD_TOO_LONG)
  })

  it('recusa confirmação diferente no campo de confirmação', () => {
    expect(validateSignup('ana@exemplo.com', validPassword, `${validPassword}x`)).toEqual({ confirmation: CONFIRMATION_MISMATCH })
  })

  it('devolve todos os campos inválidos de uma vez e nada quando tudo é válido', () => {
    expect(validateSignup('a@b', 'curta', 'outra')).toEqual({
      email: EMAIL_INVALID, password: PASSWORD_TOO_SHORT, confirmation: CONFIRMATION_MISMATCH,
    })
    expect(validateSignup('ana@exemplo.com', validPassword, validPassword)).toEqual({})
  })
})

describe('mensagens pelos códigos estáveis do servidor', () => {
  it.each([
    ['email_required', EMAIL_REQUIRED],
    ['email_too_long', EMAIL_TOO_LONG],
    ['email_invalid', EMAIL_INVALID],
    ['password_too_short', PASSWORD_TOO_SHORT],
    ['password_too_long', PASSWORD_TOO_LONG],
    ['email_already_registered', 'Já existe uma conta com este e-mail.'],
  ])('traduz %s', (code, text) => {
    expect(accountRuleMessage(code)).toBe(text)
  })

  it('não inventa texto para código desconhecido', () => {
    expect(accountRuleMessage('missing')).toBeNull()
  })
})
