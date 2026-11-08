import { useId, type CSSProperties, type ReactNode } from 'react'

/**
 * Gráfico ilustrativo em degraus (plano, decisão 5): o BestPrice registra mudanças de preço, não
 * amostras contínuas, então a linha só anda em degraus e não inventa pontos (nota 238:762).
 * SVG próprio para a linha se desenhar com `stroke-dashoffset`: no hero, ao carregar
 * (`draw="load"`); na Demonstração, pela variável `--progress` da rolagem (`draw="scroll"`).
 * É decorativo (`aria-hidden`); os valores ilustrativos aparecem em texto ao redor.
 */
type Props = {
  steps: readonly number[]
  target: number
  /** Faixa do eixo vertical, em reais. */
  min: number
  max: number
  draw: 'load' | 'scroll'
  className?: string
  /** Sobreposições posicionadas no último ponto (robô, dica). */
  children?: ReactNode
  /** Altura do viewBox (largura 400); define a proporção do gráfico. */
  height?: number
}

const width = 400

export function StepChart({ steps, target, min, max, draw, className = '', children, height = 120 }: Props) {
  const gradient = useId()
  const y = (value: number) => height - ((value - min) / (max - min)) * height
  const stepWidth = width / steps.length
  const line = steps.map((value, index) => `${index === 0 ? 'M' : 'V'} ${index === 0 ? 0 : y(value).toFixed(1)}${index === 0 ? ` ${y(value).toFixed(1)}` : ''} H ${((index + 1) * stepWidth).toFixed(1)}`).join(' ')
  const area = `${line} V ${height} H 0 Z`
  const last = steps[steps.length - 1]
  const style = {
    '--last-x': '100%',
    '--last-y': `${((y(last) / height) * 100).toFixed(2)}%`,
    '--target-y': `${((y(target) / height) * 100).toFixed(2)}%`,
  } as CSSProperties
  return <div className={`lp-chart lp-chart--${draw} ${className}`.trim()} style={style}>
    <svg className="lp-chart__svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".4" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="lp-chart__area" d={area} fill={`url(#${gradient})`} />
      <line className="lp-chart__target" x1="0" x2={width} y1={y(target)} y2={y(target)} />
      <path className="lp-chart__line" d={line} pathLength={1} />
    </svg>
    <span className="lp-chart__dot" aria-hidden="true" />
    {children}
  </div>
}
