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

const palette = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const utilities = 'bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|decoration|accent|caret|divide|placeholder'
const rawColor = new RegExp([
  String.raw`(?<![\w&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])`,
  // Funções de cor, inclusive os espaços modernos (oklch, lab...).
  String.raw`\b(?:rgba?|hsla?|oklch|oklab|lch|lab|hwb)\(`,
  // Paleta fixa do Tailwind (bg-white, text-zinc-500, bg-black/50): cor fora dos tokens do tema.
  String.raw`(?<![\w-])(?:${utilities})-(?:white|black|(?:${palette})-\d{2,3})(?:\/\d+)?(?![\w-])`,
].join('|'), 'g')

/** Cores soltas de uma linha, depois de retirar só os trechos permitidos (não a linha inteira). */
function rawColorsInLine(file: string, line: string): string[] {
  const cleaned = (allowed[file] ?? []).reduce((text, snippet) => text.split(snippet).join(''), line)
  return Array.from(cleaned.matchAll(rawColor), (match) => `${file}: ${match[0]} — ${line.trim().slice(0, 120)}`)
}

function rawColors(): string[] {
  return sourceFiles(sourceRoot).flatMap((path) => {
    const file = relative(sourceRoot, path).split(sep).join('/')
    const source = withoutComments(readFileSync(path, 'utf-8'))
    const text = path.endsWith('.css') ? withoutTokenBlocks(source) : source
    return text.split('\n').flatMap((line) => rawColorsInLine(file, line))
  })
}

it('não há cor solta fora dos tokens (exceções justificadas acima)', () => {
  expect(sourceFiles(sourceRoot).length).toBeGreaterThan(20)
  expect(rawColors()).toEqual([])
})

it('a exceção retira só o trecho permitido: outra cor na mesma linha ainda falha', () => {
  const line = `"[&_.recharts-dot[stroke='#fff']]:stroke-transparent text-[#123456]"`
  expect(rawColorsInLine('components/ui/chart.tsx', line)).toEqual([`components/ui/chart.tsx: #123456 — ${line}`])
})

// I3: espaços de cor modernos e a paleta fixa do Tailwind também são cor solta.
it.each([
  ['oklch(0.7 0.1 200)', 'oklch('],
  ['color: lab(50% 40 59)', 'lab('],
  ['className="bg-white"', 'bg-white'],
  ['className="text-zinc-500"', 'text-zinc-500'],
  ['className="bg-black/50"', 'bg-black/50'],
])('detecta %s', (line, found) => {
  expect(rawColorsInLine('exemplo.tsx', line).some((entry) => entry.includes(found))).toBe(true)
})

it('não confunde tokens e utilitários do tema com paleta fixa', () => {
  expect(rawColorsInLine('exemplo.tsx', 'className="bg-background text-muted-foreground border-border bg-transparent"')).toEqual([])
})
