import { safeHttpsUrl } from '../lib/url'
import { ImagePlaceholderIcon } from './Icons'

/** Imagem do anúncio (decorativa: o título está ao lado) ou marcador neutro quando a API não envia imagem. */
export function ProductImage({ src, className = '' }: { src: string | null; className?: string }) {
  const safe = safeHttpsUrl(src)
  if (safe) return <img className={`product-image ${className}`} src={safe} alt="" loading="lazy" />
  return <span className={`product-image image-placeholder ${className}`} aria-hidden="true"><ImagePlaceholderIcon /></span>
}
