import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { notFoundPage } from './not-found-page.mjs'

const created: string[] = []
afterEach(() => { for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true }) })

type Hook = ((...args: unknown[]) => unknown) | { handler: (...args: unknown[]) => unknown } | undefined
const hook = (value: unknown) => {
  const candidate = value as Hook
  return typeof candidate === 'function' ? candidate : candidate?.handler
}

/** Roda os ganchos do plugin como o Vite faria no fim do build, num dist temporário. */
async function buildInto(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'bestprice-build-'))
  created.push(root)
  mkdirSync(join(root, 'dist'))
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, 'dist', name), content)
  const plugin = notFoundPage() as Record<string, unknown>
  await hook(plugin.configResolved)?.call(plugin, { root, build: { outDir: 'dist' } })
  await hook(plugin.closeBundle)?.call(plugin)
  return join(root, 'dist')
}

// 0051/AC03: no Pages, um 404.html na raiz do dist faz rota sem arquivo responder 404; como é
// cópia do index.html, o navegador ainda carrega a SPA e mostra a página "não encontrada".
it('o build gera dist/404.html igual ao dist/index.html', async () => {
  const html = '<!doctype html><html><head><script type="module" src="/assets/index-abc.js"></script></head></html>'
  const dist = await buildInto({ 'index.html': html })
  expect(existsSync(join(dist, '404.html'))).toBe(true)
  expect(readFileSync(join(dist, '404.html'), 'utf-8')).toBe(html)
})

it('o plugin só roda no build', () => {
  expect(notFoundPage().apply).toBe('build')
})

it('sem dist/index.html o plugin não copia nada nem interrompe o build', async () => {
  const dist = await buildInto({ 'other.txt': 'x' })
  expect(existsSync(join(dist, '404.html'))).toBe(false)
})
