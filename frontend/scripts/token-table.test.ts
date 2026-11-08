import { expect, it } from 'vitest'
import { tokenRows } from './token-table.mjs'

// 0049/AC01: a tabela publicada em verification.md é gerada por este script; aqui ela não pode divergir.
it('gera 75 linhas (68 variáveis + 7 efeitos) e todas conferem', () => {
  const rows = tokenRows()
  expect(rows).toHaveLength(75)
  expect(rows.filter((row: { ok: boolean }) => !row.ok)).toEqual([])
})
