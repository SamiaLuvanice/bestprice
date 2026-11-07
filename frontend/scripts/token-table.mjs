/* global process, console */
// 0049/AC01: gera a tabela 1:1 (variável do Figma, token CSS, esperado, obtido) a partir do snapshot
// designsystem/tokens/figma-variables-2026-11.json e de src/styles.css. O valor obtido resolve as
// cadeias var() de :root e do @theme. Uso: node scripts/token-table.mjs > tabela.md
// Sai com 1 se algum valor divergir.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Caminhos relativos a frontend/ (o script roda de lá, como os outros de scripts/).
const snapshot = JSON.parse(readFileSync(join(process.cwd(), '..', 'designsystem', 'tokens', 'figma-variables-2026-11.json'), 'utf-8'))
const styles = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf-8')

function block(marker) {
  const start = styles.indexOf(marker)
  return start < 0 ? '' : styles.slice(start, styles.indexOf('\n}', start))
}
function declarations(text) {
  return new Map(Array.from(text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (match) => [match[1], match[2].trim()]))
}

export function tokenRows() {
  const root = declarations(block('\n:root {'))
  const theme = declarations(block('@theme inline {'))
  const raw = (name) => root.get(name) ?? theme.get(name)
  const resolve = (value, depth = 0) => {
    const reference = /^var\((--[\w-]+)\)$/.exec(value ?? '')
    return reference && depth < 10 ? resolve(raw(reference[1]), depth + 1) : value
  }
  const normalize = (value) => {
    const text = String(value ?? '').trim().toLowerCase()
    return /^#[0-9a-f]{3}$/.test(text) ? `#${text.slice(1).split('').map((c) => c + c).join('')}` : text
  }
  const variableRows = snapshot.variables.map((variable) => {
    const expected = variable.type === 'COLOR' ? normalize(variable.light) : `${variable.value}px`
    const obtained = normalize(resolve(raw(variable.css)))
    const night = variable.type === 'COLOR' && /^--(sidebar|night)/.test(variable.css) ? normalize(variable.night) : null
    return { name: variable.name, css: variable.css, expected, obtained, night, ok: expected === obtained && (night === null || night === obtained) }
  })
  const effectRows = snapshot.effectStyles.map((effect) => {
    const expected = effect.value.split(' (')[0]
    const obtained = resolve(raw(effect.css))
    return { name: effect.name, css: effect.css, expected, obtained, night: null, ok: expected === obtained }
  })
  return [...variableRows, ...effectRows]
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const rows = tokenRows()
  console.log('| Variável do Figma | Token CSS | Esperado | Obtido | Noite (fixas) | Confere |')
  console.log('|---|---|---|---|---|---|')
  for (const row of rows) console.log(`| ${row.name} | \`${row.css}\` | \`${row.expected}\` | \`${row.obtained}\` | ${row.night ? `\`${row.night}\`` : '—'} | ${row.ok ? 'sim' : '**não**'} |`)
  const failures = rows.filter((row) => !row.ok)
  console.log(`\n${rows.length} linhas (${snapshot.variables.length} variáveis + ${snapshot.effectStyles.length} efeitos); divergências: ${failures.length}.`)
  if (failures.length) process.exit(1)
}
