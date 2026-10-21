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

  it('não usa text-muted (superfície) como cor de texto nem regras corretivas de variante', () => {
    const offenders = sourceFiles(sourceRoot).filter((file) => /(?<![-\w])text-muted(?![-\w])/.test(readFileSync(file, 'utf-8')))
    expect(offenders).toEqual([])
    expect(styles).not.toMatch(/data-variant="(link|default)"\][^{]*\{[^}]*\bcolor\s*:/)
  })
})
