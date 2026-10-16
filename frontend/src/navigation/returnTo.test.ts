import { describe, expect, it } from 'vitest'
import { safeReturnTo } from './returnTo'

describe('destino após login', () => {
  it.each(['/', '/produtos', '/alertas', '/produtos/81d3569e-0f1b-493e-9a69-c7b7cd489a71'])(
    'aceita a rota interna %s', (path) => expect(safeReturnTo(path)).toBe(path),
  )

  it.each([
    'https://example.com', '//example.com', '/\\example.com', '/login', '/outro',
    '/produtos/a/b', '/produtos/%2fexample.com', '/produtos/%5cexample.com',
    '/produtos/%252fexample.com', '/produtos/x?token=1', '/produtos/x#foo',
    '/produtos/%0aexample.com',
  ])('rejeita destino inseguro ou não reconhecido %s', (path) => {
    expect(safeReturnTo(path)).toBe('/')
  })
})
