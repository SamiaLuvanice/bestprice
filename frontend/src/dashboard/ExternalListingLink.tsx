import { ExternalIcon } from './Icons'

/** Link único para o anúncio: mesmo rótulo no menu da linha e no detalhe, em nova aba e identificado como externo. */
export function ExternalListingLink({ href, className, onClick }: { href: string; className?: string; onClick?: () => void }) {
  return <a className={className ?? 'external-link'} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
    Ver anúncio no Mercado Livre <ExternalIcon />{' '}<span className="sr-only">(abre em nova aba)</span>
  </a>
}
