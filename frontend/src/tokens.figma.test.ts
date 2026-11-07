import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// 0049/AC01, AC03 e AC04: o snapshot versionado das variáveis do Figma 2026
// (designsystem/tokens/figma-variables-2026-11.json) é o contrato entre Figma e código.
// Mudar um token exige atualizar o snapshot; mudar o snapshot exige atualizar styles.css.
type FigmaVariable = { name: string; type: 'COLOR' | 'FLOAT'; css: string; light?: string; night?: string; value?: number }
type FigmaTextStyle = { name: string; family: string; style: string; fontSize: number; lineHeight: number; letterSpacingPercent: number; textCase: string }
type FigmaEffect = { name: string; css: string; value: string }
type FigmaSnapshot = { counts: { variables: number; textStyles: number; effectStyles: number }; variables: FigmaVariable[]; textStyles: FigmaTextStyle[]; effectStyles: FigmaEffect[] }

const snapshot = JSON.parse(readFileSync(join(process.cwd(), '..', 'designsystem', 'tokens', 'figma-variables-2026-11.json'), 'utf-8')) as FigmaSnapshot
const styles = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf-8')

function declarations(block: string): Map<string, string> {
  return new Map(Array.from(block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (match) => [match[1], match[2].trim()]))
}

function blockAfter(marker: string): string {
  const start = styles.indexOf(marker)
  return start < 0 ? '' : styles.slice(start, styles.indexOf('\n}', start))
}

/** Primeiro bloco `:root {` do arquivo: os tokens globais do tema claro fixo. */
const root = declarations(blockAfter('\n:root {'))
const theme = declarations(blockAfter('@theme inline {'))

function normalizeColor(value: string): string {
  const hex = value.trim().toLowerCase()
  return /^#[0-9a-f]{3}$/.test(hex) ? `#${hex.slice(1).split('').map((c) => c + c).join('')}` : hex
}

/** Valor do token: :root tem precedência; raios ficam no @theme (escala Tailwind). */
function tokenValue(name: string): string | undefined {
  return root.get(name) ?? theme.get(name)
}

function utilityBlock(name: string): Map<string, string> {
  const match = styles.match(new RegExp(`@utility ${name} \\{([^}]*)\\}`))
  return new Map(Array.from((match?.[1] ?? '').matchAll(/([\w-]+)\s*:\s*([^;]+);/g), (m) => [m[1], m[2].trim()]))
}

const weights: Record<string, string> = { Regular: '400', Medium: '500', Semibold: '600', SemiBold: '600', Bold: '700' }

describe('snapshot do Figma 2026', () => {
  it('traz as contagens declaradas na exportação', () => {
    expect(snapshot.variables).toHaveLength(snapshot.counts.variables)
    expect(snapshot.variables).toHaveLength(67)
    expect(snapshot.textStyles).toHaveLength(22)
    expect(snapshot.effectStyles).toHaveLength(7)
  })
})

describe('AC01 — variáveis de cor', () => {
  const colors = snapshot.variables.filter((variable) => variable.type === 'COLOR')
  it.each(colors.map((variable) => [variable.css, variable.light ?? '']))('%s vale %s no tema claro', (css, light) => {
    const value = tokenValue(css)
    expect(value, `${css} ausente em styles.css`).toBeDefined()
    expect(normalizeColor(value ?? '')).toBe(normalizeColor(light))
  })

  it('superfícies escuras fixas (sidebar e night) têm o mesmo valor nos dois modos do Figma', () => {
    const fixed = colors.filter((variable) => /^--(sidebar|night)/.test(variable.css))
    expect(fixed.length).toBe(13)
    for (const variable of fixed) expect(normalizeColor(tokenValue(variable.css) ?? '')).toBe(normalizeColor(variable.night ?? ''))
  })
})

describe('AC01 — raios e espaços', () => {
  const floats = snapshot.variables.filter((variable) => variable.type === 'FLOAT')
  it.each(floats.map((variable) => [variable.css, variable.value ?? -1]))('%s vale %spx', (css, value) => {
    expect(tokenValue(css)).toBe(`${value}px`)
  })
})

describe('AC04 — elevação, foco e movimento', () => {
  it.each(snapshot.effectStyles.map((effect) => [effect.css, effect.value]))('%s segue o Figma (%s)', (css, value) => {
    const expected = value.split(' (')[0]
    expect(root.get(css)).toBe(expected)
  })

  it('declara as durações do quadro de movimento', () => {
    expect(root.get('--motion-fast')).toBe('160ms')
    expect(root.get('--motion-base')).toBe('250ms')
    expect(root.get('--motion-enter')).toBe('400ms')
  })

  it('zera as durações não essenciais com movimento reduzido', () => {
    const reduced = styles.match(/@media \(prefers-reduced-motion: reduce\) \{\s*:root \{([^}]*)\}/)
    expect(reduced).not.toBeNull()
    const values = declarations(reduced?.[1] ?? '')
    expect(values.get('--motion-base')).toBe('0ms')
    expect(values.get('--motion-enter')).toBe('0ms')
  })
})

describe('AC03 — estilos de texto', () => {
  const utilityName = (name: string) => `text-${name.toLowerCase().replace(/^(display|heading|body|button|label|data|mono|mobile)\//, '$1-').replace(/[\s/]+/g, '-')}`

  it('gera um utilitário por estilo de texto do Figma', () => {
    const names = snapshot.textStyles.map((style) => utilityName(style.name))
    expect(new Set(names).size).toBe(22)
    for (const name of names) expect(utilityBlock(name).size, `@utility ${name} ausente`).toBeGreaterThan(0)
  })

  it.each(snapshot.textStyles.map((style) => [utilityName(style.name), style]))('%s segue tamanho, peso, entrelinha e tracking', (name, style) => {
    const block = utilityBlock(name as string)
    const text = style as FigmaTextStyle
    expect(block.get('font-size')).toBe(`${text.fontSize}px`)
    expect(block.get('line-height')).toBe(`${text.lineHeight}px`)
    expect(block.get('letter-spacing')).toBe(`${Number((text.letterSpacingPercent / 100).toFixed(3))}em`)
    expect(block.get('font-weight')).toBe(weights[text.style.replace('Expanded ', '')])
    if (text.family === 'Geist Mono') expect(block.get('font-family')).toBe('var(--font-mono)')
    else if (text.style.startsWith('Expanded')) {
      expect(block.get('font-family')).toBe('var(--font-display)')
      expect(block.get('font-stretch')).toBe('expanded')
    }
    if (text.textCase === 'UPPER') expect(block.get('text-transform')).toBe('uppercase')
  })

  it('fonte de dados é a Geist Mono empacotada, com algarismos de largura fixa', () => {
    expect(root.get('--font-mono')).toMatch(/^"Geist Mono"/)
    expect(utilityBlock('text-mono-data').get('font-variant-numeric')).toBe('tabular-nums')
    expect(utilityBlock('text-data-price-xl').get('font-variant-numeric')).toBe('tabular-nums')
  })
})

// 0049/AC01: todo token de cor com valor literal em :root é uma variável do Figma. Tokens próprios
// apontam para um token do Figma (var(), color-mix sobre var()). A única saída é esta lista de
// divergências, cada uma justificada e registrada em verification.md ("Divergências de token").
const colorLiteralExceptions: Record<string, string> = {
  '--color-brand-strong': 'hover de link (rosa escurecido, 8,1:1 sobre branco); o Figma não define estado hover para link',
}

describe('AC01 — tokens próprios sem cor literal fora do Figma', () => {
  const figmaNames = new Set([...snapshot.variables.map((variable) => variable.css), ...snapshot.effectStyles.map((effect) => effect.css)])
  const literal = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i

  it('cada literal de cor em :root é variável do Figma ou divergência registrada', () => {
    const offenders = Array.from(root).filter(([name, value]) => literal.test(value) && !figmaNames.has(name) && !(name in colorLiteralExceptions))
      .map(([name, value]) => `${name}: ${value}`)
    expect(offenders).toEqual([])
  })

  it('as divergências registradas continuam existindo (lista sem entrada morta)', () => {
    for (const name of Object.keys(colorLiteralExceptions)) expect(literal.test(root.get(name) ?? ''), name).toBe(true)
  })
})
