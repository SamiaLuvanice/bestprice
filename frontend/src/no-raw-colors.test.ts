import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { expect, it } from 'vitest'

// 0049/AC02: telas e componentes leem cores dos tokens. Valores de cor escritos diretamente
// (#hex, rgb(), rgba(), hsl()) só existem dentro dos blocos `:root`, onde os tokens são definidos.
const sourceRoot = join(process.cwd(), 'src')

/**
 * Exceções justificadas, por arquivo e trecho exato. Cada uma é arte original ou valor que não é
 * cor de interface; qualquer outro valor solto falha o teste.
 */
const allowed: Record<string, string[]> = {
  // Seletores (não cores aplicadas): o ChartContainer do shadcn localiza os traços padrão do
  // Recharts pelo atributo stroke e os repinta com tokens (stroke-border, fill-muted...).
  'components/ui/chart.tsx': ["[stroke='#ccc']", "[stroke='#fff']"],
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) && !path.includes(`${sep}test${sep}`) ? [path] : []
  })
}

/** Remove os blocos `:root { ... }` (sem chaves internas), que são a fonte dos tokens. */
function withoutTokenBlocks(css: string): string {
  return css.replace(/:root\s*\{[^{}]*\}/g, '')
}

/** Comentários citam valores e Issues (#259) sem aplicar cor. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' ')).replace(/^\s*\/\/.*$/gm, '')
}

const rawColor = /(?<![\w&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?)\(/g

function rawColors(): string[] {
  return sourceFiles(sourceRoot).flatMap((path) => {
    const file = relative(sourceRoot, path).split(sep).join('/')
    const source = withoutComments(readFileSync(path, 'utf-8'))
    const text = path.endsWith('.css') ? withoutTokenBlocks(source) : source
    return text.split('\n').flatMap((line) => Array.from(line.matchAll(rawColor), (match) => match[0])
      .filter(() => !(allowed[file] ?? []).some((snippet) => line.includes(snippet)))
      .map((color) => `${file}: ${color} — ${line.trim().slice(0, 120)}`))
  })
}

it('não há cor solta fora dos tokens (exceções justificadas acima)', () => {
  expect(sourceFiles(sourceRoot).length).toBeGreaterThan(20)
  expect(rawColors()).toEqual([])
})
