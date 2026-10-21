import type { Dashboard } from '../api'

type Indicator = { key: keyof Dashboard['summary']; label: string; note: string | null }

// Sem deltas nem setas de tendência: o resumo da 0013 não fornece séries no tempo.
const indicators: Indicator[] = [
  { key: 'tracked_count', label: 'Produtos monitorados', note: null },
  { key: 'price_drop_count', label: 'Baixaram de preço', note: 'nas últimas 24h' },
  { key: 'active_alert_count', label: 'Alertas ativos', note: null },
  { key: 'target_reached_count', label: 'Preço-alvo atingido', note: 'no alvo agora' },
]

export function SummaryIndicators({ summary }: { summary: Dashboard['summary'] }) {
  return <ul className="indicators">
    {indicators.map((indicator) => <li key={indicator.key} className="indicator">
      <span className="indicator-body">
        <span className="indicator-label">{indicator.label}</span>{' '}
        <strong className="indicator-value">{summary[indicator.key]}</strong>
        {indicator.note && <>{' '}<span className="indicator-note">{indicator.note}</span></>}
      </span>
    </li>)}
  </ul>
}
