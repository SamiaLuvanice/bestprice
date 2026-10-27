import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { apiError, callsTo, dashboardWith, deferred, fakeApi, reply, trackedFixture, type Route } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')
const existing = trackedFixture()
const created = trackedFixture({ id: 'product-2', title: 'Cafeteira elétrica' }, { id: 'tracking-2' })

async function renderHero(trackRoute: Route, extra: Route = () => undefined, initialPath = '/produtos') {
  window.history.replaceState(null, '', initialPath)
  const mockFetch = fakeApi((url, init) => {
    if (url === '/api/tracked-products' && init?.method === 'POST') return trackRoute(url, init)
    return extra(url, init)
  }, dashboardWith([existing]))
  const user = userEvent.setup()
  render(<App clock={clock} />)
  await screen.findByRole('heading', { level: 1 })
  // Em Produtos com lista, o formulário fica atrás da ação compacta “Adicionar anúncio” (0028/AC05).
  if (initialPath === '/produtos') await user.click(await screen.findByRole('button', { name: 'Adicionar anúncio' }))
  return { user, mockFetch }
}

function field() {
  return screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre' })
}

async function submit(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.clear(field())
  // Colar (como a pessoa faz com o link) em vez de digitar caractere a caractere, que é lento sob carga.
  await user.click(field())
  await user.paste(value)
  await user.click(screen.getByRole('button', { name: 'Monitorar preço' }))
}

const validUrl = 'https://produto.mercadolivre.com.br/MLB-2222222222-cafeteira-_JM'

describe('hero', () => {
  it('exibe exatamente os textos da spec, sem card de produto, preço ou estrelas', async () => {
    await renderHero(() => undefined, () => undefined, '/app/monitoring/overview')
    const hero = within(screen.getByRole('region', { name: 'Seu painel de preços' }))
    expect(hero.getByRole('heading', { level: 1 })).toHaveTextContent('Seu painel de preços')
    expect(hero.getByText('Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.')).toBeInTheDocument()
    expect(field()).toHaveAttribute('placeholder', 'https://www.mercadolivre.com.br/...')
    expect(hero.getByRole('button', { name: 'Monitorar preço' })).toBeInTheDocument()
    expect(hero.getByText('Copie o link do anúncio no Mercado Livre e cole aqui.')).toBeInTheDocument()
    expect(hero.getByText(/vêm das consultas do BestPrice ao Mercado Livre e podem diferir/)).toBeInTheDocument()
    const region = screen.getByRole('region', { name: 'Seu painel de preços' })
    expect(region).not.toHaveTextContent(/R\$|★|Amazon|prime|Histórico de preço/i)
    expect(hero.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('envio do link', () => {
  it('mostra Localizando produto... e desabilita apenas Monitorar preço durante o envio', async () => {
    const response = deferred()
    const { user } = await renderHero(() => response.promise)
    await submit(user, validUrl)
    expect(await screen.findByText('Localizando produto...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeDisabled()
    expect(screen.getByRole('link', { name: /Ver detalhes/ })).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).getByRole('button', { name: /pessoa@example\.com/ })).toBeEnabled()
    response.resolve(reply(201, created))
    expect(await screen.findByText('Produto adicionado ao monitoramento.')).toBeInTheDocument()
    expect(screen.queryByText('Localizando produto...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeEnabled()
  })

  it('limpa o campo e mostra o novo produto em Produtos sem recarregar a página', async () => {
    const { user } = await renderHero(() => reply(201, created))
    await submit(user, validUrl)
    expect(await screen.findByText('Produto adicionado ao monitoramento.')).toBeInTheDocument()
    expect(field()).toHaveValue('')
    const products = within(screen.getByRole('region', { name: 'Seus produtos' }))
    expect(products.getByText('Cafeteira elétrica')).toBeInTheDocument()
    expect(products.getByText('Fone sem fio')).toBeInTheDocument()
  })

  it('informa a retomada quando a API responde 200', async () => {
    const { user } = await renderHero(() => reply(200, created))
    await submit(user, validUrl)
    expect(await screen.findByText('Você voltou a monitorar este produto.')).toBeInTheDocument()
    expect(field()).toHaveValue('')
  })

  it('envia link sem https sem bloqueio do navegador e mostra o 400 junto ao campo, preservando o texto', async () => {
    const message = 'Informe o link completo de um anúncio do Mercado Livre Brasil.'
    const { user, mockFetch } = await renderHero(() => reply(400, apiError('invalid_url', message)))
    const typed = 'produto.mercadolivre.com.br/MLB-1234567890-x-_JM'
    expect(field()).not.toHaveAttribute('type', 'url')
    await submit(user, typed)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(field()).toHaveValue(typed)
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription(expect.stringContaining(message))
    const [, init] = callsTo(mockFetch, '/api/tracked-products', 'POST')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ url: typed })
  })

  it.each([
    [404, 'product_not_found', 'Não encontramos esse anúncio no Mercado Livre.'],
    [409, 'tracking_conflict', 'Não foi possível monitorar este anúncio agora.'],
    [502, 'integration_invalid_response', 'O Mercado Livre respondeu de forma inesperada.'],
    [503, 'integration_unavailable', 'Mercado Livre indisponível no momento.'],
  ])('mostra a mensagem da API para %i sem levar à entrada', async (status, code, message) => {
    const { user } = await renderHero(() => reply(status, apiError(code, message)))
    await submit(user, validUrl)
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(field()).toHaveValue(validUrl)
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('oferece Ver produto para already_tracked e abre o detalhe do ID devolvido', async () => {
    const other = trackedFixture({ id: 'product-9', title: 'Liquidificador' }, { id: 'tracking-9' })
    const { user } = await renderHero(() => reply(409, apiError('already_tracked', 'Você já monitora este anúncio.', { tracked_product_id: 'tracking-9' })), (url) => {
      if (url === '/api/tracked-products/tracking-9') return reply(200, other)
      if (url === '/api/tracked-products/tracking-9/history') return reply(200, { items: [], next_cursor: null })
      return undefined
    })
    await submit(user, validUrl)
    expect(await screen.findByRole('alert')).toHaveTextContent('Você já monitora este anúncio.')
    await user.click(screen.getByRole('link', { name: 'Ver produto' }))
    expect(window.location.pathname).toBe('/produtos/tracking-9')
    expect(await screen.findByRole('heading', { name: 'Liquidificador' })).toBeInTheDocument()
  })

  it('acrescenta o prazo de nova tentativa ao 429', async () => {
    const { user } = await renderHero(() => reply(429, apiError('integration_rate_limited', 'Limite de consultas ao Mercado Livre atingido.', { retry_after_seconds: 90 })))
    await submit(user, validUrl)
    expect(await screen.findByRole('alert')).toHaveTextContent('Limite de consultas ao Mercado Livre atingido. Tente novamente em 2 minutos.')
  })

  it.each([
    ['falha de rede', () => Promise.reject(new TypeError('Failed to fetch')), 'Não foi possível conectar ao BestPrice. Tente novamente.'],
    ['erro sem corpo estável', () => reply(500, { detail: 'Internal Server Error' }), 'Não foi possível concluir a operação. Tente novamente.'],
  ])('mostra mensagem local para %s sem levar à entrada', async (_case, outcome, message) => {
    const { user } = await renderHero(outcome)
    await submit(user, validUrl)
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeEnabled())
  })
})
