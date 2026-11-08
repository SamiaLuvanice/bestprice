import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { findFontProblems } from './check-fonts.mjs'

const created: string[] = []
afterEach(() => { for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true }) })

function dist(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), 'bestprice-fonts-'))
  created.push(directory)
  mkdirSync(join(directory, 'assets'))
  for (const [name, content] of Object.entries(files)) writeFileSync(join(directory, 'assets', name), content)
  return directory
}

// 0049/AC14: fonte empacotada como arquivo, só latin/latin-ext.
it('aceita latin e latin-ext 400–600 como arquivos', () => {
  expect(findFontProblems(dist({ 'index-a.css': '@font-face{src:url(/assets/geist-mono-latin-400-normal-x.woff2)}',
    'geist-mono-latin-400-normal-x.woff2': '', 'geist-mono-latin-ext-600-normal-y.woff': '' }))).toEqual([])
})

it('acusa fonte em base64 no CSS', () => {
  expect(findFontProblems(dist({ 'index-a.css': '@font-face{src:url(data:font/woff2;base64,AAAA)}', 'geist-mono-latin-400-normal-x.woff2': '' })))
    .toEqual(['index-a.css: fonte embutida em base64'])
})

it('acusa subconjunto fora de latin', () => {
  expect(findFontProblems(dist({ 'geist-mono-latin-400-normal-x.woff2': '', 'geist-mono-cyrillic-400-normal-z.woff2': '' })))
    .toEqual(['geist-mono-cyrillic-400-normal-z.woff2: subconjunto ou peso fora de latin/latin-ext 400–600'])
})
