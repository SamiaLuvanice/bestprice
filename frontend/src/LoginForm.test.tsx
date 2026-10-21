import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LoginForm, validateLogin } from './LoginForm'

afterEach(cleanup)

function renderForm(props: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  const onSubmit = vi.fn()
  const view = render(<LoginForm busy={false} error={null} onSubmit={onSubmit} {...props} />)
  return { onSubmit, ...view }
}

const emailField = () => screen.getByLabelText('E-mail') as HTMLInputElement
const passwordField = () => screen.getByLabelText('Senha') as HTMLInputElement
const toggle = () => screen.getByRole('button', { name: 'Mostrar senha' })

function fill(email: string, password: string) {
  fireEvent.change(emailField(), { target: { value: email } })
  fireEvent.change(passwordField(), { target: { value: password } })
}

function submitForm() {
  const form = screen.getByRole('button', { name: /^(Entrar|Entrando…)$/ }).closest('form')
  if (!form) throw new Error('formulário de entrada ausente')
  fireEvent.submit(form)
}

// 0023/AC01–AC03: a arte fornecida é a única peça promocional da coluna.
it('mostra a arte lateral e a marca aprovadas com descrição breve', () => {
  const { container } = renderForm()
  const visual = container.querySelector('.login-visual')
  const artwork = screen.getByRole('img', { name: /BestPrice.*boas escolhas.*alertas de preço/i })
  expect(visual).toBe(artwork)
  expect(visual?.querySelectorAll('img')).toHaveLength(1)
  expect(visual?.textContent).toBe('BestPrice')
  expect(screen.getAllByRole('heading')).toHaveLength(1)
})

// 0020/AC14: em tela estreita a logo reduzida aparece acima do título, com o mesmo nome acessível.
it('mostra a logo reduzida antes do título, com o nome BestPrice', () => {
  const { container } = renderForm()
  const compact = container.querySelector('.login-brand-compact')
  expect(compact).not.toBeNull()
  expect(compact).toHaveAccessibleName('BestPrice')
  const title = screen.getByRole('heading', { level: 1, name: 'Entrar na sua conta' })
  expect(compact?.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

// 0023/AC05: só os controles de autenticação existentes são expostos.
it('mantém apenas os controles de login existentes', () => {
  renderForm()
  expect(screen.queryByText(/Cole o link uma vez/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Você é avisado quando o preço cair/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Criar conta|Esqueceu a senha|Continuar com o Google|^ou$/i)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})

// AC03: título e campos obrigatórios com rótulo acessível.
it('mostra o título Entrar na sua conta e os campos obrigatórios de e-mail e senha', () => {
  renderForm()
  expect(screen.getByRole('heading', { level: 1, name: 'Entrar na sua conta' })).toBeInTheDocument()
  expect(emailField()).toHaveAttribute('type', 'email')
  expect(emailField()).toHaveAttribute('autocomplete', 'email')
  expect(emailField()).toBeRequired()
  expect(passwordField()).toHaveAttribute('type', 'password')
  expect(passwordField()).toHaveAttribute('autocomplete', 'current-password')
  expect(passwordField()).toBeRequired()
})

const EMAIL_EMPTY = 'Informe seu e-mail.'
const EMAIL_INVALID = 'Informe um e-mail válido, como nome@exemplo.com.'
const PASSWORD_EMPTY = 'Informe sua senha.'

// 0020/AC07: formato de e-mail aceito (função pura).
it.each(['nome@exemplo.com', '  nome@exemplo.com  ', 'a.b+c@sub.exemplo.com.br'])('valida como correto o e-mail %j', (value) => {
  expect(validateLogin(value, 'x')).toEqual({})
})

it.each(['nome@exemplo', 'nome.exemplo.com', 'a@@b.com', 'nome@.com', 'nome@exemplo.', 'no me@exemplo.com'])('recusa o e-mail %j', (value) => {
  expect(validateLogin(value, 'x')).toEqual({ email: EMAIL_INVALID })
})

it('distingue e-mail vazio de inválido e aceita senha só com espaços', () => {
  expect(validateLogin('   ', 'x')).toEqual({ email: EMAIL_EMPTY })
  expect(validateLogin('nome@exemplo.com', '')).toEqual({ password: PASSWORD_EMPTY })
  expect(validateLogin('nome@exemplo.com', '   ')).toEqual({})
})

// 0020/AC07: validação própria, sem balão nativo, só no envio.
it('usa validação própria: o formulário tem novalidate e nada é validado ao sair do campo', () => {
  renderForm()
  expect(screen.getByRole('button', { name: 'Entrar' }).closest('form')).toHaveAttribute('novalidate')
  fireEvent.focus(emailField())
  fireEvent.blur(emailField())
  expect(screen.queryByText(EMAIL_EMPTY)).not.toBeInTheDocument()
})

it('mostra todas as mensagens ao mesmo tempo, sem chamar onSubmit, e foca o primeiro campo inválido', () => {
  const { onSubmit } = renderForm()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(onSubmit).not.toHaveBeenCalled()
  const emailMessage = screen.getByText(EMAIL_EMPTY)
  const passwordMessage = screen.getByText(PASSWORD_EMPTY)
  expect(emailField()).toHaveAttribute('aria-invalid', 'true')
  expect(passwordField()).toHaveAttribute('aria-invalid', 'true')
  expect(emailField()).toHaveAccessibleDescription(EMAIL_EMPTY)
  expect(passwordField()).toHaveAccessibleDescription(PASSWORD_EMPTY)
  expect(emailMessage).not.toHaveAttribute('role')
  expect(passwordMessage).not.toHaveAttribute('role')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(emailField()).toHaveFocus()
})

it('foca a senha quando só ela é inválida e mostra a mensagem de e-mail em formato inválido', () => {
  renderForm()
  fill('pessoa@example.com', '')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(passwordField()).toHaveFocus()
  expect(emailField()).not.toHaveAttribute('aria-invalid', 'true')
  fill('nome@exemplo', 'x')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(screen.getByText(EMAIL_INVALID)).toBeInTheDocument()
  expect(emailField()).toHaveFocus()
})

it('some a mensagem quando o campo volta a ser válido ao digitar e não reaparece até o próximo envio', () => {
  renderForm()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  fireEvent.change(emailField(), { target: { value: 'pessoa@example.com' } })
  expect(screen.queryByText(EMAIL_EMPTY)).not.toBeInTheDocument()
  expect(emailField()).not.toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText(PASSWORD_EMPTY)).toBeInTheDocument()
  fireEvent.change(emailField(), { target: { value: '' } })
  expect(screen.queryByText(EMAIL_EMPTY)).not.toBeInTheDocument()
})

it('avisa o App quando a validação falha e envia o e-mail sem espaços nas pontas', () => {
  const onValidationFail = vi.fn()
  const { onSubmit } = renderForm({ onValidationFail })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(onValidationFail).toHaveBeenCalledTimes(1)
  fill('  pessoa@example.com  ', '  ')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(onSubmit).toHaveBeenCalledWith('pessoa@example.com', '  ')
})

// 0020/AC09: o e-mail não pede capitalização nem correção ortográfica.
it('desliga capitalização automática e verificação ortográfica no e-mail', () => {
  renderForm()
  expect(emailField()).toHaveAttribute('autocapitalize', 'none')
  expect(emailField()).toHaveAttribute('autocorrect', 'off')
  expect(emailField()).toHaveAttribute('spellcheck', 'false')
})

// AC04: rótulo fixo, aria-pressed e valor preservado.
it('alterna a visibilidade da senha com rótulo fixo e aria-pressed, preservando o valor', () => {
  renderForm()
  fill('pessoa@example.com', 'segredo-123')
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  expect(toggle()).toHaveAttribute('type', 'button')
  fireEvent.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  expect(passwordField()).toHaveAttribute('type', 'text')
  expect(passwordField()).toHaveValue('segredo-123')
  fireEvent.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  expect(passwordField()).toHaveAttribute('type', 'password')
  expect(passwordField()).toHaveValue('segredo-123')
})

// AC04 + envio: a senha volta a ficar oculta a cada tentativa.
it('envia e-mail e senha e volta a ocultar a senha ao disparar a tentativa', () => {
  const { onSubmit } = renderForm()
  fill('pessoa@example.com', 'segredo-123')
  fireEvent.click(toggle())
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith('pessoa@example.com', 'segredo-123')
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  expect(passwordField()).toHaveAttribute('type', 'password')
})

// 0020/AC08: durante o envio o botão fica ocupado e indisponível, mas mantém o foco e ignora cliques e Enter.
it('mostra Entrando… ocupado e indisponível, ignora novos envios e mantém o foco do botão', () => {
  const onSubmit = vi.fn()
  const { rerender } = render(<LoginForm busy={false} error={null} onSubmit={onSubmit} />)
  fill('pessoa@example.com', 'segredo-123')
  screen.getByRole('button', { name: 'Entrar' }).focus()
  rerender(<LoginForm busy error={null} onSubmit={onSubmit} />)
  const button = screen.getByRole('button', { name: 'Entrando…' })
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).not.toBeDisabled()
  expect(button).toHaveFocus()
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  fireEvent.click(button)
  submitForm()
  expect(onSubmit).not.toHaveBeenCalled()
})

// AC06: erro único, campos preservados e foco no campo Senha após falha.
it('após falha mostra um único alerta, preserva os campos e foca o campo Senha', () => {
  const onSubmit = vi.fn()
  const { rerender } = render(<LoginForm busy={false} error={null} onSubmit={onSubmit} />)
  fill('pessoa@example.com', 'errada')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  rerender(<LoginForm busy error={null} onSubmit={onSubmit} />)
  rerender(<LoginForm busy={false} error="E-mail ou senha inválidos." onSubmit={onSubmit} />)
  expect(screen.getAllByRole('alert')).toHaveLength(1)
  expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
  expect(emailField()).toHaveValue('pessoa@example.com')
  expect(passwordField()).toHaveValue('errada')
  expect(passwordField()).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Entrar' })).not.toHaveAttribute('aria-disabled', 'true')
})

// AC06: o aviso de sessão encerrada chega na montagem e não move o foco.
it('mostra o aviso de sessão encerrada como alerta sem mover o foco', () => {
  renderForm({ error: 'Sua sessão expirou. Entre novamente.' })
  expect(screen.getAllByRole('alert')).toHaveLength(1)
  expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente.')
  expect(passwordField()).not.toHaveFocus()
  expect(emailField()).not.toHaveFocus()
})

it('não renderiza alerta quando não há erro', () => {
  renderForm()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
