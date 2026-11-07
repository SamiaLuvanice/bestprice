/* global process, console */
// 0049/AC06: o catálogo do design system (src/dev/) só existe no servidor de desenvolvimento.
// Depois de `npm run build`, nenhum arquivo de dist/ pode citar o catálogo nem o snapshot do Figma.
// Uso: node scripts/check-no-catalog.mjs [diretório] (padrão: dist). Sai com 1 se houver vestígio.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const markers = ['DesignSystemCatalog', 'design-system', 'Design system BestPrice', 'figma-variables', 'catalog-section']

function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

export function findCatalogTraces(directory) {
  const all = files(directory)
  if (all.length === 0) throw new Error(`${directory} está vazio; rode npm run build antes.`)
  return all.flatMap((path) => {
    const name = relative(directory, path).split(sep).join('/')
    const content = readFileSync(path, 'latin1')
    return markers.filter((marker) => name.includes(marker) || content.includes(marker)).map((marker) => `${name}: ${marker}`)
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const directory = process.argv[2] ?? 'dist'
  const traces = findCatalogTraces(directory)
  if (traces.length > 0) {
    console.error(`Vestígios do catálogo em ${directory}:\n${traces.join('\n')}`)
    process.exit(1)
  }
  console.log(`Sem vestígios do catálogo em ${directory} (${markers.length} marcadores conferidos).`)
}
