import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// 0051: arquivos servidos pela borda do Cloudflare Pages (public/ é copiado para a raiz do dist).
// O servidor de desenvolvimento não os reproduz; aqui conferimos o conteúdo, e o preview do PR
// confere status e cabeçalhos com curl.
// Raiz do frontend resolvida a partir deste arquivo (import.meta), não do diretório de onde o
// Vitest roda. `dirname` em vez de `new URL(..., import.meta.url)`: no jsdom o URL global não é o
// do Node e o fileURLToPath o recusa ("The URL must be of scheme file").
const root = join(import.meta.dirname, '..', '..')
const origin = 'https://bestprice-stage.pages.dev'
const landingTitle = 'Monitor de preços do Mercado Livre · BestPrice'
const landingDescription = 'Monitore preços de produtos do Mercado Livre com a BestPrice. Acompanhe históricos, receba alertas de queda de preço e encontre o melhor momento para comprar.'

/** Lê um arquivo do frontend; lança se ele não existir, em vez de testar texto vazio. */
function read(path: string): string {
  return readFileSync(join(root, path), 'utf-8')
}

describe('index.html (AC07)', () => {
  const html = new DOMParser().parseFromString(read('index.html'), 'text/html')
  const meta = (attribute: 'name' | 'property', key: string) =>
    html.head.querySelector(`meta[${attribute}="${key}"]`)?.getAttribute('content') ?? null

  it('não declara canonical nem og:url, que valeriam para todas as rotas', () => {
    expect(html.head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(meta('property', 'og:url')).toBeNull()
  })

  it('traz Open Graph, Twitter e a descrição da landing', () => {
    expect(meta('name', 'description')).toBe(landingDescription)
    expect(meta('property', 'og:title')).toBe(landingTitle)
    expect(meta('property', 'og:description')).toBe(landingDescription)
    expect(meta('property', 'og:type')).toBe('website')
    expect(meta('property', 'og:locale')).toBe('pt_BR')
    expect(meta('property', 'og:site_name')).toBe('BestPrice')
    expect(meta('property', 'og:image')).toBe(`${origin}/og-image.png`)
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })

  it('declara o ícone de 180 px para atalho em iOS', () => {
    expect(html.head.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe('/apple-touch-icon.png')
  })
})

/** Regra do robots.txt como expressão regular (RFC 9309): prefixo, `*` curinga e `$` final como âncora. */
function robotsPattern(pattern: string): RegExp {
  const anchored = pattern.endsWith('$')
  const body = (anchored ? pattern.slice(0, -1) : pattern).split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')
  return new RegExp(`^${body}${anchored ? '$' : ''}`)
}

/** Regra mais longa vence; empate favorece Allow (comportamento do Google e da RFC 9309). */
function robotsAllows(robots: string, path: string): boolean {
  const rules = robots.split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim())
    .map((line) => /^(allow|disallow):\s*(\S*)$/i.exec(line)).filter((match) => match !== null)
    .map((match) => ({ allow: match[1].toLowerCase() === 'allow', pattern: match[2] }))
    .filter((rule) => rule.pattern !== '' && robotsPattern(rule.pattern).test(path))
  if (rules.length === 0) return true
  const longest = Math.max(...rules.map((rule) => rule.pattern.length))
  return rules.some((rule) => rule.pattern.length === longest && rule.allow)
}

describe('robots.txt (AC01)', () => {
  const robots = read('public/robots.txt')

  it('vale para todos os robôs e declara o sitemap por URL absoluta', () => {
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).toMatch(new RegExp(`^Sitemap: ${origin}/sitemap\\.xml$`, 'm'))
  })

  it.each(['/', '/login', '/cadastro', '/assets/index-abc.js', '/api/health', '/og-image.png', '/apple-touch-icon.png',
    '/favicon.png', '/sitemap.xml'])('libera %s', (path) => {
    expect(robotsAllows(robots, path)).toBe(true)
  })

  it.each(['/app', '/app/', '/app/dashboard', '/produtos', '/produtos/abc', '/alertas'])('bloqueia %s', (path) => {
    expect(robotsAllows(robots, path)).toBe(false)
  })
})

describe('sitemap.xml (AC02)', () => {
  it('é XML do protocolo sitemaps.org com exatamente / e /login', () => {
    const xml = new DOMParser().parseFromString(read('public/sitemap.xml'), 'application/xml')
    expect(xml.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(xml.documentElement.localName).toBe('urlset')
    expect(xml.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9')
    const locations = Array.from(xml.getElementsByTagName('loc'), (loc) => loc.textContent?.trim())
    expect(locations).toEqual([`${origin}/`, `${origin}/login`])
  })
})

/** Blocos do `_headers`: linha de caminho sem recuo seguida de cabeçalhos recuados. */
function headerBlocks(text: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>()
  let current: string[] | null = null
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    if (/^\S/.test(line)) { current = []; blocks.set(line.trim(), current) } else current?.push(line.trim())
  }
  return blocks
}

describe('_headers (AC10)', () => {
  const blocks = headerBlocks(read('public/_headers'))

  it('marca /assets/* como imutável por um ano', () => {
    const cache = (blocks.get('/assets/*') ?? []).find((header) => /^cache-control:/i.test(header)) ?? ''
    expect(cache).toContain('max-age=31536000')
    expect(cache).toContain('immutable')
  })

  it('não marca como imutável nada fora de /assets/', () => {
    const others = [...blocks].filter(([path]) => path !== '/assets/*').flatMap(([, headers]) => headers)
    expect(others.filter((header) => header.includes('immutable'))).toEqual([])
  })
})

describe('_redirects (AC04)', () => {
  const rules = read('public/_redirects').split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim())
    .filter((line) => line !== '').map((line) => line.split(/\s+/))
  const sources = new Set(rules.map(([source]) => source))
  // Rotas declaradas no App.tsx, exceto `/` (servida pelo próprio index.html) e a rota curinga.
  const appSource = read('src/App.tsx')
  // Só paths literais (aspas simples ou duplas); `path={...}` não é extraído e reprova a contagem.
  const declaredPaths = [...appSource.matchAll(/<Route\s+path=(["'])([^"']+)\1/g)].map((match) => match[2])
  const appRoutes = declaredPaths.filter((path) => path !== '/' && path !== '*')

  it('extrai um path literal de cada <Route> do App.tsx', () => {
    const routeTags = appSource.match(/<Route\b(?!s)/g) ?? []
    expect(routeTags.length).toBeGreaterThan(0)
    expect(declaredPaths).toHaveLength(routeTags.length)
  })

  it('não declara <Route> nem <Routes> fora do App.tsx', () => {
    const files = (directory: string): string[] => readdirSync(directory).flatMap((name) => {
      const path = join(directory, name)
      return statSync(path).isDirectory() ? files(path) : [path]
    })
    const outside = files(join(root, 'src'))
      .map((path) => relative(root, path).split(sep).join('/'))
      .filter((path) => /\.[tj]sx?$/.test(path) && !/\.test\.[tj]sx?$/.test(path) && path !== 'src/App.tsx')
      .filter((path) => /<Routes?\b/.test(read(path)))
    expect(outside).toEqual([])
  })

  it('encontra as rotas do App.tsx', () => {
    expect(appRoutes).toEqual(expect.arrayContaining(['/login', '/cadastro', '/app', '/app/*', '/produtos', '/produtos/:id', '/alertas']))
  })

  it('só tem reescritas 200 para /, nunca redirecionamentos', () => {
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.filter(([, target, status]) => target !== '/' || status !== '200')).toEqual([])
  })

  it('cobre cada rota do App.tsx, com e sem barra final', () => {
    const missing = appRoutes.flatMap((route) => {
      const source = route.replace(/:[^/]+/g, '*')
      return source.endsWith('*') ? [source] : [source, `${source}/`]
    }).filter((source) => !sources.has(source))
    expect(missing).toEqual([])
  })
})
