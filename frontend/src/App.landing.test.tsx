import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { apiError, fakeApi, reply } from './test/fakeApi'

// 0050: a landing recebe da App se a sessão está confirmada e se o cadastro está ligado.
vi.mock('./landing/LandingPage', () => ({
  LandingPage: (props: { authenticated?: boolean; signupAvailable?: boolean }) =>
    <p data-testid="landing">{`authenticated=${String(props.authenticated)} signup=${String(props.signupAvailable)}`}</p>,
}))

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function visitLanding() {
  window.history.replaceState({}, '', '/')
  render(<App />)
}

it('informa sessão confirmada e cadastro ligado', async () => {
  fakeApi((url) => url === '/api/auth/signup' ? reply(200, { enabled: true }) : undefined)
  visitLanding()
  expect(await screen.findByText('authenticated=true signup=true')).toBeInTheDocument()
})

it('enquanto verifica a sessão, trata como sem sessão', () => {
  fakeApi((url) => url === '/api/auth/me' ? new Promise(() => undefined) : undefined)
  visitLanding()
  expect(screen.getByTestId('landing')).toHaveTextContent('authenticated=false')
})

it('sem sessão e com o cadastro desligado', async () => {
  fakeApi((url) => url === '/api/auth/me' ? reply(401, apiError('unauthenticated', 'Entre para continuar.')) : undefined)
  visitLanding()
  expect(await screen.findByText('authenticated=false signup=false')).toBeInTheDocument()
})
