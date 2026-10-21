import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// 0028/AC04: tokens do tema shadcn/Tailwind e tokens próprios da aplicação não compartilham
// nomes com significados diferentes, e o CSS não precisa de regras que corrigem utilitários.
const sourceRoot = join(process.cwd(), 'src')
const styles = readFileSync(join(sourceRoot, 'styles.css'), 'utf-8')

function declarations(block: string): Map<string, string> {
  return new Map(Array.from(block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (match) => [match[1], match[2].trim()]))
}

function themeBlock(): string {
  const start = styles.indexOf('@theme inline {')
  return styles.slice(start, styles.indexOf('}', start))
}

function rootBlocks(): string {
  return Array.from(styles.matchAll(/(?:^|\n):root\s*\{([^}]*)\}/g), (match) => match[1]).join('\n')
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('tokens de cor', () => {
  it('declarações próprias com nome do tema apontam para o mesmo token do tema', () => {
    const theme = declarations(themeBlock())
    const root = declarations(rootBlocks())
    expect(theme.size).toBeGreaterThan(10)
    const conflicts = Array.from(root).filter(([name, value]) => theme.has(name) && theme.get(name) !== value)
    expect(conflicts).toEqual([])
  })

  it('documenta primário rosa, ação verde e muted como superfície', () => {
    const root = declarations(rootBlocks())
    expect(root.get('--primary')).toBe('#c7005e')
    expect(root.get('--primary-foreground')).toBe('#fff')
    expect(root.get('--action')).toBe('#39ff14')
    expect(root.get('--action-foreground')).toBe('#000')
    expect(root.get('--muted')).toBe('#f5f5f7')
    expect(root.get('--muted-foreground')).toBe('#626267')
  })

  it('text-muted é texto secundário (--muted-foreground) e bg-muted continua superfície', () => {
    // A cor calculada é conferida no navegador (tests/visual/redesign.spec.ts).
    // Tailwind v4: --text-color-* vale só para utilitários text-*; bg-* continua lendo --color-*.
    const theme = declarations(themeBlock())
    expect(theme.get('--text-color-muted')).toBe('var(--muted-foreground)')
    expect(theme.get('--color-muted')).toBe('var(--muted)')
    expect(styles).toMatch(/@source inline\("[^"]*\btext-muted\b[^"]*"\)/)
  })

  it('não tem regras que corrigem a cor das variantes do Button', () => {
    expect(sourceFiles(sourceRoot).length).toBeGreaterThan(10)
    expect(styles).not.toMatch(/data-variant="(link|default)"\][^{]*\{[^}]*\bcolor\s*:/)
  })
})
