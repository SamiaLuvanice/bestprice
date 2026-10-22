import bestPriceLogo from '../assets/logo-bestprice.png'

type Props = {
  className?: string
  /** O contêiner (link ou arte) já fornece o nome acessível. */
  decorative?: boolean
}

/** Lockup oficial: ícone preservado e nome com uma única apresentação acessível. */
export function Brand({ className = '', decorative = false }: Props) {
  return <span className={`brand ${className}`.trim()} role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : 'BestPrice'} aria-hidden={decorative || undefined}>
    <img className="brand-logo" src={bestPriceLogo} alt="" width="48" height="48" />
    <span className="brand-name" aria-hidden="true">BestPrice</span>
  </span>
}
