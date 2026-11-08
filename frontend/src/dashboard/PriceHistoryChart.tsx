import { useId, useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { HistoryEntry } from '../api'
import { isDecimal } from '../lib/decimal'
import { formatAxisPrice, formatMoney } from '../lib/format'

const config = { price: { label: 'Preço unitário', color: 'var(--chart-1)' } } satisfies ChartConfig
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

type Props = {
  history: HistoryEntry[]
  partial: boolean
  /** Preço-alvo do alerta (string decimal da API). Sem alvo válido, a linha tracejada não aparece. */
  targetPrice?: string | null
}

/*
 * 0049/AC10 (Figma 2026): série em degraus (linha escura --chart-1 sobre área verde --chart-2),
 * ponto atual verde só na última leitura e alvo tracejado rosa (--chart-3) quando existe.
 * O último degrau termina na última leitura (domínio X até dataMax); nenhum ponto é inventado.
 */
export function PriceHistoryChart({ history, partial, targetPrice }: Props) {
  const descriptionId = useId()
  const gradientId = `price-area-${useId().replace(/:/g, '')}`
  // Conversão exclusivamente para coordenadas. Rótulos/tooltip preservam a string
  // decimal original; regras, comparações e métricas monetárias pertencem à API.
  const points = useMemo(() => history
    .filter((entry) => entry.currency === 'BRL' && isDecimal(entry.price))
    .map((entry) => ({ ...entry, time: Date.parse(entry.captured_at), plotPrice: Number(entry.price) }))
    .filter((entry) => Number.isFinite(entry.time) && Number.isFinite(entry.plotPrice) && entry.plotPrice >= 0)
    .sort((a, b) => a.time - b.time), [history])

  const target = typeof targetPrice === 'string' && isDecimal(targetPrice) ? Number(targetPrice) : null
  const current = points.at(-1)
  if (!points.length || !current) return <p className="empty">O gráfico aparece após o primeiro preço válido registrado.</p>
  return <figure className="price-chart-figure">
    <div className="price-chart-surface">
      <ChartContainer className="price-chart" config={config} role="img" aria-label="Evolução do preço unitário no Mercado Livre, em reais" aria-describedby={descriptionId}>
        <ComposedChart accessibilityLayer={false} data={points} margin={{ top: 16, right: 18, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 6" />
          <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} minTickGap={40}
            tick={{ style: { fill: 'var(--color-chart-label)' }, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(time: number) => shortDate.format(time)} tickMargin={12} />
          <YAxis dataKey="plotPrice" tick={{ style: { fill: 'var(--color-chart-label)' }, fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={8} width={84}
            domain={['auto', 'auto']} tickFormatter={formatAxisPrice} />
          <ChartTooltip content={<ChartTooltipContent
            labelFormatter={(_, payload) => {
              const time: unknown = payload?.[0]?.payload?.time
              return typeof time === 'number' ? fullDate.format(time) : 'Preço registrado'
            }}
            formatter={(_, __, item) => {
              const price: unknown = item.payload?.price
              return <span>Preço unitário: <strong>{typeof price === 'string' ? formatMoney(price) : 'Indisponível'}</strong></span>
            }} />} />
          {points.length > 1 && <Area dataKey="plotPrice" type="stepAfter" stroke="none" fill={`url(#${gradientId})`} isAnimationActive={false}
            tooltipType="none" activeDot={false} />}
          {points.length > 1 && <Line dataKey="plotPrice" name="price" type="stepAfter" stroke="var(--chart-1)" strokeWidth={2.5}
            dot={false} activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: 'var(--card)', strokeWidth: 2 }} isAnimationActive={false} />}
          {target !== null && <ReferenceLine y={target} ifOverflow="extendDomain" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="6 6" />}
          <ReferenceDot x={current.time} y={current.plotPrice} ifOverflow="extendDomain" r={6}
            shape={(props: { cx?: number; cy?: number }) => <circle data-current="true" data-price={current.price} cx={props.cx} cy={props.cy} r={6}
              fill="var(--chart-2)" stroke="var(--card)" strokeWidth={3} />} />
        </ComposedChart>
      </ChartContainer>
    </div>
    <figcaption id={descriptionId} className="price-chart-note">
      {partial ? 'Exibindo os registros carregados. Carregue mais preços para ampliar o período.' : 'Registros de alteração desde o primeiro preço conhecido.'}
      {' '}Preço unitário em reais. Cada ponto representa uma leitura registrada.
    </figcaption>
    <details className="history-data"><summary>Ver registros de preço</summary>
      <table><caption className="sr-only">Valores exatos do histórico, do mais antigo ao mais recente</caption>
        <thead><tr><th scope="col">Data da leitura</th><th scope="col">Preço unitário</th></tr></thead>
        <tbody>{points.map((point) => <tr key={point.id}><td>{fullDate.format(point.time)}</td><td>{formatMoney(point.price)}</td></tr>)}</tbody>
      </table>
    </details>
  </figure>
}
