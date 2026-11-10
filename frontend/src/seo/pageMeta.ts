import { useEffect } from 'react'
import { matchPath } from 'react-router-dom'

/**
 * Origem pública usada nas URLs absolutas (spec 0051). Quando houver domínio de produção, mude
 * aqui, em `index.html`, `public/robots.txt` e `public/sitemap.xml`.
 */
export const PUBLIC_ORIGIN = 'https://bestprice-stage.pages.dev'

/** Descrição da landing; também é a do `index.html` e a usada fora das páginas públicas. */
export const LANDING_DESCRIPTION = 'Monitore preços de produtos do Mercado Livre com a BestPrice. Acompanhe históricos, receba alertas de queda de preço e encontre o melhor momento para comprar.'
const LOGIN_DESCRIPTION = 'Entre na sua conta BestPrice para ver seus anúncios do Mercado Livre monitorados, o histórico de preços e os alertas de queda.'
const SIGNUP_DESCRIPTION = 'Crie sua conta no BestPrice e comece a monitorar preços de anúncios do Mercado Livre colando apenas o link do produto.'

export type PageMeta = { canonical: string | null; description: string }

/**
 * Metadados por caminho (spec 0051, AC06). Só as páginas públicas têm canonical autorreferente;
 * `/cadastro` só quando o cadastro está ligado, porque desligado ele leva ao login (spec 0048).
 * O casamento segue o do roteador: sem diferença de maiúsculas e com barra final opcional.
 */
export function pageMetaFor(pathname: string, signupEnabled: boolean): PageMeta {
  if (matchPath('/', pathname)) return { canonical: `${PUBLIC_ORIGIN}/`, description: LANDING_DESCRIPTION }
  if (matchPath('/login', pathname)) return { canonical: `${PUBLIC_ORIGIN}/login`, description: LOGIN_DESCRIPTION }
  if (signupEnabled && matchPath('/cadastro', pathname)) {
    return { canonical: `${PUBLIC_ORIGIN}/cadastro`, description: SIGNUP_DESCRIPTION }
  }
  return { canonical: null, description: LANDING_DESCRIPTION }
}

function headElement<T extends Element>(selector: string, create: () => T): T {
  const existing = document.head.querySelector<T>(selector)
  if (existing) return existing
  const element = create()
  document.head.append(element)
  return element
}

/**
 * Aplica canonical e descrição no `<head>`. Depende só do caminho e do cadastro, nunca da
 * sessão: o metadado aparece enquanto a sessão é verificada e quando a verificação falha.
 */
export function usePageMeta(pathname: string, signupEnabled: boolean): void {
  const { canonical, description } = pageMetaFor(pathname, signupEnabled)
  useEffect(() => {
    headElement('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      return meta
    }).setAttribute('content', description)
    if (canonical === null) {
      document.head.querySelectorAll('link[rel="canonical"]').forEach((link) => link.remove())
      return
    }
    headElement('link[rel="canonical"]', () => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      return link
    }).setAttribute('href', canonical)
  }, [canonical, description])
}
