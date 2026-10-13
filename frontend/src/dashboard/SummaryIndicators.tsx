import type { ReactNode } from 'react'
import type { Dashboard } from '../api'
import { BellIcon, BoxIcon, PercentIcon, TargetIcon } from './Icons'

type Indicator = { key: keyof Dashboard['summary']; label: string; note: string | null; icon: ReactNode; tone: string }

// Sem deltas nem setas de tendência: o resumo da 0013 não fornece séries no tempo.
const indicators: Indicator[] = [
  { key: 'tracked_count', label: 'Produtos monitorados', note: null, icon: <BoxIcon />, tone: 'blue' },
  { key: 'price_drop_count', label: 'Baixaram de preço', note: 'nas últimas 24h', icon: <PercentIcon />, tone: 'red' },
  { key: 'active_alert_count', label: 'Alertas ativos', note: null, icon: <BellIcon />, tone: 'amber' },
  { key: 'target_reached_count', label: 'Preço-alvo atingido', note: 'no alvo agora', icon: <TargetIcon />, tone: 'green' },
]

export function SummaryIndicators({ summary }: { summary: Dashboard['summary'] }) {
  return <ul className="indicators">
    {indicators.map((indicator) => <li key={indicator.key} className="indicator">
      <span className={`indicator-icon tone-${indicator.tone}`}>{indicator.icon}</span>
      <span className="indicator-body">
        <span className="indicator-label">{indicator.label}</span>{' '}
        <strong className="indicator-value">{summary[indicator.key]}</strong>
        {indicator.note && <>{' '}<span className="indicator-note">{indicator.note}</span></>}
      </span>
    </li>)}
  </ul>
}
