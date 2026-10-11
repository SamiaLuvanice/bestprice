// Esqueletos do carregamento inicial: só forma, sem número, zero ou texto de vazio, e ocultos de
// tecnologias assistivas — o anúncio é um único status “Carregando seu painel…” (AC24).

function Bars({ count, className }: { count: number; className: string }) {
  return <>{Array.from({ length: count }, (_, index) => <span key={index} className={`skeleton-block ${className}`} />)}</>
}

export function IndicatorsSkeleton() {
  return <div data-skeleton="indicators" aria-hidden="true" className="skeleton skeleton-indicators"><Bars count={4} className="skeleton-indicator" /></div>
}

export function OpportunitiesSkeleton() {
  return <div data-skeleton="opportunities" aria-hidden="true" className="skeleton skeleton-cards"><Bars count={4} className="skeleton-card" /></div>
}

export function ProductsSkeleton() {
  return <div data-skeleton="products" aria-hidden="true" className="skeleton skeleton-rows"><Bars count={4} className="skeleton-row" /></div>
}

export function TimelineSkeleton() {
  return <div data-skeleton="timeline" aria-hidden="true" className="skeleton skeleton-timeline"><Bars count={3} className="skeleton-event" /></div>
}
