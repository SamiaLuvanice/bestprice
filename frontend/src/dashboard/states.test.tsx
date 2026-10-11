import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { dashboardFixture, deferred, fakeApi, reply, trackedFixture } from '../test/fakeApi'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const clock = () => new Date('2026-10-11T18:00:00Z')

function dashboardRegions() {
  return [
    screen.getByRole('region', { name: 'Resumo do monitoramento' }),
    screen.getByRole('region', { name: 'Boas oportunidades' }),
    screen.getByRole('region', { name: 'Seus produtos' }),
    screen.getByRole('region', { name: 'Atualizações recentes' }),
  ]
}

describe('carregamento do painel', () => {
  it('mostra esqueletos anunciados como carregando, sem números nem textos de vazio, até a resposta chegar', async () => {
    const response = deferred()
    fakeApi((url) => url === '/api/dashboard' ? response.promise : undefined)
    render(<App clock={clock} />)
    expect((await screen.findByText('Carregando seu painel…')).closest('[role="status"]')).not.toBeNull()
    const regions = dashboardRegions()
    for (const region of regions) {
      expect(region).toHaveAttribute('aria-busy', 'true')
      expect(region).not.toHaveTextContent(/\d/)
      expect(region.querySelector('[data-skeleton]')).toHaveAttribute('aria-hidden', 'true')
    }
    expect(screen.queryByText(/Nenhuma oportunidade|ainda não monitora|aparecerão aqui/)).not.toBeInTheDocument()

    response.resolve(reply(200, dashboardFixture({
      items: [trackedFixture()], summary: { price_drop_count: 3 },
    })))
    await waitFor(() => expect(screen.queryByText('Carregando seu painel…')).not.toBeInTheDocument())
    for (const region of dashboardRegions()) {
      expect(region).toHaveAttribute('aria-busy', 'false')
      expect(region.querySelector('[data-skeleton]')).toBeNull()
    }
    expect(within(screen.getByRole('region', { name: 'Resumo do monitoramento' })).getByText('3')).toBeInTheDocument()
  })
})
