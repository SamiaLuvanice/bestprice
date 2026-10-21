import { useId, useMemo } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { HistoryEntry } from '../api'
import { isDecimal } from '../lib/decimal'
import { formatMoney } from '../lib/format'

const config = { price: { label: 'Preço unitário', color: 'var(--color-action)' } } satisfies ChartConfig
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const axisPrice = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export function PriceHistoryChart({ history, partial }: { history: HistoryEntry[]; partial: boolean }) {
  const descriptionId = useId()
  // Conversão exclusivamente para coordenadas. Rótulos/tooltip preservam a string
  // decimal original; regras, comparações e métricas monetárias pertencem à API.
  const points = useMemo(() => history
    .filter((entry) => entry.currency === 'BRL' && isDecimal(entry.price))
    .map((entry) => ({ ...entry, time: Date.parse(entry.captured_at), plotPrice: Number(entry.price) }))
    .filter((entry) => Number.isFinite(entry.time) && Number.isFinite(entry.plotPrice) && entry.plotPrice >= 0)
    .sort((a, b) => a.time - b.time), [history])

  if (!points.length) return <p className="empty">O gráfico aparece após o primeiro preço válido registrado.</p>
  return <figure className="price-chart-figure">
    <div className="price-chart-surface">
      <ChartContainer className="price-chart" config={config} role="img" aria-label="Evolução do preço unitário no Mercado Livre, em reais" aria-describedby={descriptionId}>
        <LineChart accessibilityLayer={false} data={points} margin={{ top: 16, right: 18, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 6" />
          <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} minTickGap={40}
            tick={{ style: { fill: 'var(--color-chart-label)' }, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(time: number) => shortDate.format(time)} tickMargin={12} />
          <YAxis dataKey="plotPrice" tick={{ style: { fill: 'var(--color-chart-label)' }, fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={8} width={52}
            domain={['auto', 'auto']} tickFormatter={(value: number) => axisPrice.format(value)} />
          <ChartTooltip content={<ChartTooltipContent
            labelFormatter={(_, payload) => {
              const time: unknown = payload?.[0]?.payload?.time
              return typeof time === 'number' ? fullDate.format(time) : 'Preço registrado'
            }}
            formatter={(_, __, item) => {
              const price: unknown = item.payload?.price
              return <span>Preço unitário: <strong>{typeof price === 'string' ? formatMoney(price) : 'Indisponível'}</strong></span>
            }} />} />
          <Line dataKey="plotPrice" name="price" type="stepAfter" stroke="var(--color-action)" strokeWidth={3}
            dot={{ r: 4, fill: 'var(--color-action)', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
    <figcaption id={descriptionId} className="price-chart-note">
      {partial ? 'Exibindo os registros carregados. Carregue mais preços para ampliar o período.' : 'Registros de alteração desde o primeiro preço conhecido.'}
      {' '}Preço unitário em BRL, sem frete. Cada ponto representa uma leitura registrada.
    </figcaption>
    <details className="history-data"><summary>Ver registros de preço</summary>
      <table><caption className="sr-only">Valores exatos do histórico, do mais antigo ao mais recente</caption>
        <thead><tr><th scope="col">Data da leitura</th><th scope="col">Preço unitário</th></tr></thead>
        <tbody>{points.map((point) => <tr key={point.id}><td>{fullDate.format(point.time)}</td><td>{formatMoney(point.price)}</td></tr>)}</tbody>
      </table>
    </details>
  </figure>
}
