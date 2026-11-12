import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeroTrackForm } from './HeroTrackForm'

afterEach(cleanup)

const link = 'https://produto.mercadolivre.com.br/MLB-1111111111-cafeteira-_JM'

function renderForm(props: { initialValue?: string; compact?: boolean }) {
  const onSubmit = vi.fn(() => true)
  render(<MemoryRouter><HeroTrackForm onSubmit={onSubmit} submitting={false} error={null} success={null}
    embedded compact {...props} /></MemoryRouter>)
  return { onSubmit }
}

function field() {
  return screen.getByRole('textbox', { name: 'Link do anúncio do Mercado Livre', hidden: true })
}

describe('formulário de link com valor inicial', () => {
  it('abre o compacto já preenchido e com foco, sem enviar', async () => {
    const { onSubmit } = renderForm({ initialValue: link })
    expect(screen.getByRole('button', { name: /Adicionar anúncio/ })).toHaveAttribute('aria-expanded', 'true')
    expect(field()).toBeVisible()
    expect(field()).toHaveValue(link)
    await waitFor(() => expect(field()).toHaveFocus())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sem valor inicial, o compacto continua recolhido e vazio', () => {
    renderForm({})
    expect(screen.getByRole('button', { name: /Adicionar anúncio/ })).toHaveAttribute('aria-expanded', 'false')
    expect(field()).toHaveValue('')
    expect(field()).not.toHaveFocus()
  })

  it('aberto (sem lista), preenche e foca o campo', async () => {
    const { onSubmit } = renderForm({ initialValue: link, compact: false })
    expect(field()).toHaveValue(link)
    expect(screen.getByRole('button', { name: 'Monitorar preço' })).toBeVisible()
    expect(screen.queryByText('Cole a URL do anúncio do Mercado Livre para acompanhar automaticamente.')).not.toBeInTheDocument()
    await waitFor(() => expect(field()).toHaveFocus())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
