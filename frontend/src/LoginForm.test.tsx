import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

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

// AC02: a coluna visual é decorativa e não traz dados ilustrativos.
it('mantém a coluna visual fora da árvore de acessibilidade, sem dígitos e com logo decorativa', () => {
  renderForm()
  const phrase = screen.getByText('Acompanhe preços com a calma de uma vitrine.')
  const visual = phrase.closest('[aria-hidden="true"]')
  expect(visual).not.toBeNull()
  expect(visual?.textContent).not.toMatch(/\d/)
  const logo = visual?.querySelector('img')
  expect(logo).not.toBeNull()
  expect(logo?.getAttribute('alt')).toBe('')
  expect(logo?.getAttribute('src')).toContain('logo-bestprice.png')
  expect(screen.queryByRole('img', { name: 'BestPrice' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  expect(screen.getAllByRole('heading')).toHaveLength(1)
})

// AC03: título e campos obrigatórios com rótulo acessível.
it('mostra o título Bem-vindo de volta e os campos obrigatórios de e-mail e senha', () => {
  renderForm()
  expect(screen.getByRole('heading', { level: 2, name: 'Bem-vindo de volta' })).toBeInTheDocument()
  expect(emailField()).toHaveAttribute('type', 'email')
  expect(emailField()).toHaveAttribute('autocomplete', 'email')
  expect(emailField()).toBeRequired()
  expect(passwordField()).toHaveAttribute('type', 'password')
  expect(passwordField()).toHaveAttribute('autocomplete', 'current-password')
  expect(passwordField()).toBeRequired()
})

// AC06 (parte testável no jsdom): validação nativa, sem regra de tamanho de senha.
it('usa validação nativa: vazio ou e-mail inválido é inválido e senha curta é aceita', () => {
  renderForm()
  expect(emailField().checkValidity()).toBe(false)
  expect(passwordField().checkValidity()).toBe(false)
  fill('pessoa', '1')
  expect(emailField().checkValidity()).toBe(false)
  expect(passwordField().checkValidity()).toBe(true)
  fill('pessoa@example.com', '1')
  expect(emailField().checkValidity()).toBe(true)
  expect(screen.getByRole('button', { name: 'Entrar' }).closest('form')).not.toHaveAttribute('novalidate')
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

// AC05: rótulo de envio, desabilitado e sem reenvio.
it('mostra Entrando… desabilitado durante o envio e não chama onSubmit de novo', () => {
  const { onSubmit } = renderForm({ busy: true })
  fill('pessoa@example.com', 'segredo-123')
  const button = screen.getByRole('button', { name: 'Entrando…' })
  expect(button).toBeDisabled()
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
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
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
