import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, deferred, reply } from '../test/fakeApi'
import { SignupForm } from './SignupForm'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const loginHref = '/login?returnTo=%2Fapp%2Fassistant'
const validPassword = 'uma-senha-longa'
const createdUser = { id: 'user-9', email: 'ana@exemplo.com' }

function stubSignup(response: () => unknown) {
  const mockFetch = vi.fn(() => Promise.resolve().then(response))
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

function renderForm() {
  const onSignedUp = vi.fn()
  render(<MemoryRouter><SignupForm loginHref={loginHref} onSignedUp={onSignedUp} /></MemoryRouter>)
  return { onSignedUp }
}

const emailField = () => screen.getByLabelText('E-mail') as HTMLInputElement
const passwordField = () => screen.getByLabelText('Senha') as HTMLInputElement
const confirmationField = () => screen.getByLabelText('Confirmar senha') as HTMLInputElement
const submitButton = () => screen.getByRole('button', { name: /^(Criar conta|Criando conta…)$/ })

function fill(email: string, password: string, confirmation = password) {
  fireEvent.change(emailField(), { target: { value: email } })
  fireEvent.change(passwordField(), { target: { value: password } })
  fireEvent.change(confirmationField(), { target: { value: confirmation } })
}

async function submitFilled(email = 'Ana@Exemplo.com', password = validPassword) {
  fill(email, password)
  fireEvent.click(submitButton())
}

it('mostra título, campos com rótulo visível, dica de senha e aviso de privacidade antes do botão', () => {
  renderForm()
  expect(screen.getByRole('heading', { level: 1, name: 'Criar sua conta' })).toBeInTheDocument()
  expect(emailField()).toHaveAttribute('type', 'email')
  expect(emailField()).toHaveAttribute('autocomplete', 'email')
  expect(passwordField()).toHaveAttribute('type', 'password')
  expect(passwordField()).toHaveAttribute('autocomplete', 'new-password')
  expect(confirmationField()).toHaveAttribute('type', 'password')
  expect(confirmationField()).toHaveAttribute('autocomplete', 'new-password')
  expect(passwordField()).toHaveAccessibleDescription('Use pelo menos 12 caracteres.')
  const notice = screen.getByText('Usamos seu e-mail só para identificar sua conta e permitir seu acesso. Não enviamos mensagens.')
  expect(notice.compareDocumentPosition(submitButton())).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(submitButton()).toHaveTextContent('Criar conta')
  expect(submitButton().closest('form')).toHaveAttribute('novalidate')
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', loginHref)
  expect(screen.getByText(/Já tem uma conta\?/)).toContainElement(screen.getByRole('link', { name: 'Entrar' }))
  expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('alterna a visibilidade da senha e da confirmação separadamente, preservando os valores', () => {
  renderForm()
  fill('ana@exemplo.com', validPassword)
  const showPassword = screen.getByRole('button', { name: 'Mostrar senha' })
  const showConfirmation = screen.getByRole('button', { name: 'Mostrar confirmação da senha' })
  fireEvent.click(showPassword)
  expect(showPassword).toHaveAttribute('aria-pressed', 'true')
  expect(passwordField()).toHaveAttribute('type', 'text')
  expect(confirmationField()).toHaveAttribute('type', 'password')
  fireEvent.click(showConfirmation)
  expect(confirmationField()).toHaveAttribute('type', 'text')
  expect(passwordField()).toHaveValue(validPassword)
  expect(confirmationField()).toHaveValue(validPassword)
})

it('mostra os erros locais por campo, foca o primeiro inválido e não envia', () => {
  const mockFetch = stubSignup(() => reply(201, createdUser))
  renderForm()
  fill('a@b', 'curta', 'outra')
  fireEvent.click(submitButton())
  expect(mockFetch).not.toHaveBeenCalled()
  expect(emailField()).toHaveAttribute('aria-invalid', 'true')
  expect(emailField()).toHaveAccessibleDescription('Informe um e-mail válido, como nome@exemplo.com.')
  expect(passwordField()).toHaveAttribute('aria-invalid', 'true')
  expect(passwordField()).toHaveAccessibleDescription(expect.stringContaining('A senha precisa ter pelo menos 12 caracteres.'))
  expect(confirmationField()).toHaveAttribute('aria-invalid', 'true')
  expect(confirmationField()).toHaveAccessibleDescription('As senhas não conferem.')
  expect(emailField()).toHaveFocus()
  // A validação local preserva tudo o que foi digitado.
  expect(emailField()).toHaveValue('a@b')
  expect(passwordField()).toHaveValue('curta')
  expect(confirmationField()).toHaveValue('outra')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('foca a confirmação quando só ela está errada', () => {
  stubSignup(() => reply(201, createdUser))
  renderForm()
  fill('ana@exemplo.com', validPassword, `${validPassword}!`)
  fireEvent.click(submitButton())
  expect(confirmationField()).toHaveFocus()
  expect(emailField()).not.toHaveAttribute('aria-invalid')
  expect(passwordField()).not.toHaveAttribute('aria-invalid')
})

it('envia o cadastro e entrega o usuário criado ao App, sem novo login', async () => {
  const mockFetch = stubSignup(() => reply(201, createdUser))
  const { onSignedUp } = renderForm()
  await submitFilled()
  await waitFor(() => expect(onSignedUp).toHaveBeenCalledWith(createdUser))
  expect(mockFetch).toHaveBeenCalledOnce()
  expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ email: 'Ana@Exemplo.com', password: validPassword }),
  }))
})

it('mostra o 422 do servidor no campo certo, mantém o e-mail e limpa as senhas', async () => {
  stubSignup(() => reply(422, apiError('validation_error', 'Confira os dados informados.', { fields: [
    { field: 'password', code: 'password_too_long', message: 'A senha pode ter no máximo 1024 caracteres.' },
    { field: 'email', code: 'novo_codigo', message: 'Mensagem do servidor para o e-mail.' },
  ] })))
  const { onSignedUp } = renderForm()
  await submitFilled()
  await waitFor(() => expect(passwordField()).toHaveAccessibleDescription(expect.stringContaining('A senha pode ter no máximo 1024 caracteres.')))
  expect(emailField()).toHaveAccessibleDescription('Mensagem do servidor para o e-mail.')
  expect(emailField()).toHaveFocus()
  expect(emailField()).toHaveValue('Ana@Exemplo.com')
  expect(passwordField()).toHaveValue('')
  expect(confirmationField()).toHaveValue('')
  expect(onSignedUp).not.toHaveBeenCalled()
})

it('mostra o e-mail já cadastrado no campo com atalho para entrar', async () => {
  stubSignup(() => reply(409, apiError('email_already_registered', 'Já existe uma conta com este e-mail.', {
    fields: [{ field: 'email', code: 'email_already_registered', message: 'Já existe uma conta com este e-mail.' }],
  })))
  const { onSignedUp } = renderForm()
  await submitFilled()
  await waitFor(() => expect(emailField()).toHaveAttribute('aria-invalid', 'true'))
  expect(emailField()).toHaveAccessibleDescription(expect.stringContaining('Já existe uma conta com este e-mail.'))
  const shortcuts = screen.getAllByRole('link', { name: 'Entrar' })
  expect(shortcuts).toHaveLength(2)
  for (const link of shortcuts) expect(link).toHaveAttribute('href', loginHref)
  expect(emailField()).toHaveFocus()
  expect(emailField()).toHaveValue('Ana@Exemplo.com')
  expect(passwordField()).toHaveValue('')
  expect(confirmationField()).toHaveValue('')
  expect(onSignedUp).not.toHaveBeenCalled()
})

it.each([
  [1800, 'Muitas tentativas de cadastro. Tente novamente em 30 minutos.'],
  [61, 'Muitas tentativas de cadastro. Tente novamente em 2 minutos.'],
  [60, 'Muitas tentativas de cadastro. Tente novamente em 1 minuto.'],
  [1, 'Muitas tentativas de cadastro. Tente novamente em 1 minuto.'],
])('mostra o tempo de espera do 429 (%i s) no alerta', async (seconds, text) => {
  stubSignup(() => reply(429, apiError('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.', { retry_after_seconds: seconds })))
  renderForm()
  await submitFilled()
  expect(await screen.findByRole('alert')).toHaveTextContent(text)
  expect(emailField()).toHaveValue('Ana@Exemplo.com')
  expect(passwordField()).toHaveValue('')
})

it('usa a mensagem do servidor no 429 sem tempo de espera', async () => {
  stubSignup(() => reply(429, apiError('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.')))
  renderForm()
  await submitFilled()
  expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas de cadastro. Tente novamente mais tarde.')
})

it.each([
  ['404 cadastro desligado', () => reply(404, apiError('signup_unavailable', 'Cadastro indisponível.')), 'Cadastro indisponível no momento.'],
  ['falha de rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível criar a conta agora. Tente novamente.'],
  ['HTTP 500', () => reply(500, { detail: 'Internal Server Error' }), 'Não foi possível criar a conta agora. Tente novamente.'],
  ['resposta inválida', () => reply(200, createdUser), 'Não foi possível criar a conta agora. Tente novamente.'],
])('mostra %s no alerta geral, mantém o e-mail e limpa as senhas', async (_case, response, text) => {
  stubSignup(response)
  const { onSignedUp } = renderForm()
  await submitFilled()
  expect(await screen.findByRole('alert')).toHaveTextContent(text)
  expect(screen.getAllByRole('alert')).toHaveLength(1)
  expect(emailField()).toHaveValue('Ana@Exemplo.com')
  expect(passwordField()).toHaveValue('')
  expect(confirmationField()).toHaveValue('')
  expect(onSignedUp).not.toHaveBeenCalled()
})

it('mostra Criando conta… ocupado durante o envio e não envia duas vezes', async () => {
  const pending = deferred()
  const mockFetch = vi.fn(() => pending.promise)
  vi.stubGlobal('fetch', mockFetch)
  renderForm()
  await submitFilled()
  const busy = screen.getByRole('button', { name: 'Criando conta…' })
  expect(busy).toHaveAttribute('aria-busy', 'true')
  expect(busy).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(busy)
  fireEvent.submit(busy.closest('form') as HTMLFormElement)
  expect(mockFetch).toHaveBeenCalledOnce()
  pending.resolve(reply(503, apiError('database_unavailable', 'Serviço temporariamente indisponível.')))
  expect(await screen.findByRole('button', { name: 'Criar conta' })).not.toHaveAttribute('aria-busy')
})

it('percorre os controles com Tab na ordem do formulário e envia com Enter', async () => {
  const mockFetch = stubSignup(() => reply(201, createdUser))
  const { onSignedUp } = renderForm()
  const user = userEvent.setup()
  emailField().focus()
  await user.keyboard('ana@exemplo.com')
  await user.tab()
  expect(passwordField()).toHaveFocus()
  await user.keyboard(validPassword)
  await user.tab()
  expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveFocus()
  await user.tab()
  expect(confirmationField()).toHaveFocus()
  await user.keyboard(validPassword)
  await user.tab()
  expect(screen.getByRole('button', { name: 'Mostrar confirmação da senha' })).toHaveFocus()
  await user.tab()
  expect(submitButton()).toHaveFocus()
  confirmationField().focus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(onSignedUp).toHaveBeenCalledWith(createdUser))
  expect(mockFetch).toHaveBeenCalledOnce()
})

// QA O3 (AC13): erros de campo anunciados por uma única região polida, sem duplicar alertas.
describe('anúncio dos erros de campo', () => {
  const announcer = () => screen.getByRole('status')

  it('a região existe vazia antes do envio, para o leitor de tela já a conhecer', () => {
    renderForm()
    expect(announcer()).toHaveAttribute('aria-live', 'polite')
    expect(announcer()).toBeEmptyDOMElement()
  })

  it('anuncia o resumo dos campos inválidos na validação local, sem alertas por campo', () => {
    stubSignup(() => reply(201, createdUser))
    renderForm()
    fill('a@b', 'curta', 'outra')
    fireEvent.click(submitButton())
    expect(announcer()).toHaveTextContent('3 campos precisam de correção: E-mail, Senha e Confirmar senha.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('usa o singular para um único campo e anuncia o erro de campo vindo do servidor', async () => {
    stubSignup(() => reply(422, apiError('validation_error', 'Confira os dados informados.', {
      fields: [{ field: 'password', code: 'password_too_long', message: 'A senha pode ter no máximo 1024 caracteres.' }],
    })))
    renderForm()
    await submitFilled()
    await waitFor(() => expect(announcer()).toHaveTextContent('1 campo precisa de correção: Senha.'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('anuncia o e-mail já cadastrado como erro de campo', async () => {
    stubSignup(() => reply(409, apiError('email_already_registered', 'Já existe uma conta com este e-mail.')))
    renderForm()
    await submitFilled()
    await waitFor(() => expect(announcer()).toHaveTextContent('1 campo precisa de correção: E-mail.'))
  })

  it('não repete na região o que já sai no alerta geral e limpa o resumo anterior', async () => {
    stubSignup(() => reply(429, apiError('signup_rate_limited', 'Muitas tentativas de cadastro. Tente novamente mais tarde.', { retry_after_seconds: 60 })))
    renderForm()
    fill('a@b', validPassword)
    fireEvent.click(submitButton())
    expect(announcer()).toHaveTextContent('1 campo precisa de correção: E-mail.')
    await submitFilled()
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente em 1 minuto.')
    expect(announcer()).toBeEmptyDOMElement()
  })
})
