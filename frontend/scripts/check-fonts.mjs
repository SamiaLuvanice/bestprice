/* global process, console */
// 0049/AC14: a Geist Mono sai como arquivo próprio (nunca base64 no CSS) e só nos subconjuntos
// latin e latin-ext. Uso: node scripts/check-fonts.mjs [diretório] (padrão: dist).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function findFontProblems(directory) {
  const assets = readdirSync(join(directory, 'assets'))
  const problems = []
  for (const name of assets.filter((file) => file.endsWith('.css'))) {
    const css = readFileSync(join(directory, 'assets', name), 'utf-8')
    if (/url\(\s*["']?data:(font|application\/(font|x-font))/i.test(css)) problems.push(`${name}: fonte embutida em base64`)
  }
  for (const name of assets.filter((file) => /^geist-mono-.*\.woff2?$/.test(file))) {
    if (!/^geist-mono-latin(-ext)?-(400|500|600)-normal-/.test(name)) problems.push(`${name}: subconjunto ou peso fora de latin/latin-ext 400–600`)
  }
  if (!assets.some((file) => /^geist-mono-latin-400-normal-.*\.woff2$/.test(file))) problems.push('Geist Mono latin 400 ausente do build')
  return problems
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const directory = process.argv[2] ?? 'dist'
  const problems = findFontProblems(directory)
  if (problems.length > 0) {
    console.error(`Fontes fora do contrato em ${directory}:\n${problems.join('\n')}`)
    process.exit(1)
  }
  console.log(`Fontes conforme em ${directory}: Geist Mono latin/latin-ext 400–600, sem base64.`)
}
