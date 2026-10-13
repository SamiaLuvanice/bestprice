import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ExternalListingLink } from './ExternalListingLink'
import { ProductImage } from './ProductImage'

afterEach(cleanup)

describe('URLs vindas da API', () => {
  it('não cria link externo para esquema diferente de https', () => {
    render(<ExternalListingLink href="javascript:alert(1)" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('cria o link externo para https', () => {
    render(<ExternalListingLink href="https://produto.mercadolivre.com.br/MLB-1-x-_JM" />)
    expect(screen.getByRole('link', { name: /Ver anúncio no Mercado Livre/ })).toHaveAttribute('href', 'https://produto.mercadolivre.com.br/MLB-1-x-_JM')
  })

  it('usa o marcador neutro quando a imagem não é https', () => {
    const { container } = render(<ProductImage src="javascript:alert(1)" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.image-placeholder')).not.toBeNull()
  })

  it('mostra a imagem https', () => {
    const { container } = render(<ProductImage src="https://http2.mlstatic.com/a.jpg" />)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://http2.mlstatic.com/a.jpg')
  })
})
