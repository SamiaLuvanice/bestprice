import { Bell, Package, Target, TrendingDown, type LucideIcon } from 'lucide-react'
import type { Dashboard } from '../api'

type Indicator = { key: keyof Dashboard['summary']; label: string; note: string | null; Icon: LucideIcon; tone: string }

// Sem deltas nem setas de tendência: o resumo da 0013 não fornece séries no tempo.
const indicators: Indicator[] = [
  { key: 'tracked_count', label: 'Produtos monitorados', note: null, Icon: Package, tone: 'brand' },
  { key: 'price_drop_count', label: 'Baixaram de preço', note: 'nas últimas 24h', Icon: TrendingDown, tone: 'down' },
  { key: 'active_alert_count', label: 'Alertas ativos', note: null, Icon: Bell, tone: 'brand' },
  { key: 'target_reached_count', label: 'Preço-alvo atingido', note: 'no alvo agora', Icon: Target, tone: 'neutral' },
]

/** `cards` (0063): cartões com ícone da página única; `inline` mantém a faixa da rota legada. */
export function SummaryIndicators({ summary, variant = 'inline' }: { summary: Dashboard['summary']; variant?: 'inline' | 'cards' }) {
  const cards = variant === 'cards'
  return <ul className={cards ? 'indicators indicators-cards' : 'indicators'}>
    {indicators.map(({ key, label, note, Icon, tone }) => <li key={key} className="indicator">
      {cards && <span className={`indicator-icon indicator-icon-${tone}`} aria-hidden="true"><Icon /></span>}
      <span className="indicator-body">
        <span className="indicator-label">{label}</span>{' '}
        <strong className="indicator-value">{summary[key]}</strong>
        {note && <>{' '}<span className="indicator-note">{note}</span></>}
      </span>
    </li>)}
  </ul>
}
