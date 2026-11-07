import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { findCatalogTraces } from './check-no-catalog.mjs'

const created: string[] = []
afterEach(() => { for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true }) })

function dist(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), 'bestprice-dist-'))
  created.push(directory)
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(directory, name, '..'), { recursive: true })
    writeFileSync(join(directory, name), content)
  }
  return directory
}

// 0049/AC06: a verificação do build acusa qualquer vestígio do catálogo.
it('aceita um dist sem o catálogo', () => {
  expect(findCatalogTraces(dist({ 'index.html': '<div id="root"></div>', 'assets/index.js': 'console.log(1)' }))).toEqual([])
})

it('acusa chunk ou conteúdo do catálogo', () => {
  const traces = findCatalogTraces(dist({ 'assets/DesignSystemCatalog-abc.js': 'x', 'assets/index.js': 'fetch("/dev/design-system")' }))
  expect(traces).toContain('assets/DesignSystemCatalog-abc.js: DesignSystemCatalog')
  expect(traces.some((trace) => trace.startsWith('assets/index.js') && trace.endsWith('design-system'))).toBe(true)
})

it('recusa dist vazio, que indicaria build não executado', () => {
  expect(() => findCatalogTraces(dist({}))).toThrow(/vazio/)
})
