import { ArrowDown, Bell } from 'lucide-react'
import type { CSSProperties } from 'react'
// 0050: a mesma arte original do assistente, só recodificada em WebP 480 × 480 (22 KB contra
// 1,1 MB do PNG), porque a landing a carrega já no hero. Aprovado pela responsável em 08/11/2026.
import robotArt from '../assets/research/assistant-robot-480.webp'

/**
 * Componente "Robô BestPrice" do Figma (237:35). Os quatro estados usam a mesma arte original
 * (a do assistente) e mudam só as decorações em CSS: brilho, anéis, feixe, sino e selo.
 * Poses das notas: ler = neutral, vigiar = scanning, avisar = alert, encontrou = found.
 */
export type RobotState = 'neutral' | 'scanning' | 'alert' | 'found'

type Props = {
  state?: RobotState
  /** Tamanho da arte em px; as decorações acompanham. */
  size?: number
  /** Só a instância informativa (hero) tem texto alternativo; as demais são decorativas. */
  alt?: string
  className?: string
  /** Fora da área visível: a imagem pode esperar. */
  lazy?: boolean
  floating?: boolean
}

export function BestPriceRobot({ state = 'neutral', size = 120, alt, className = '', lazy = true, floating = false }: Props) {
  const decorative = !alt
  return <span className={`lp-robot lp-robot--${state}${floating ? ' lp-robot--float' : ''} ${className}`.trim()}
    style={{ '--robot-size': `${size}px` } as CSSProperties}
    data-state={state} aria-hidden={decorative || undefined}>
    <span className="lp-robot__glow" />
    {state === 'scanning' && <>
      {/* Anéis de varredura do componente 237:39 (quadro de 240, arte de 176): traço 1,5 e tracejado
          6/8 nas unidades do quadro, que crescem com o robô como as instâncias do Figma. */}
      <svg className="lp-robot__rings" viewBox="0 0 240 240">
        <circle className="lp-robot__ring lp-robot__ring--outer" cx="120" cy="122" r="117.25" />
        <circle className="lp-robot__ring lp-robot__ring--inner" cx="120" cy="122" r="102.25" />
      </svg>
      <span className="lp-robot__beam" />
    </>}
    <img className="lp-robot__art" src={robotArt} alt={alt ?? ''} width={size} height={size}
      loading={lazy ? 'lazy' : 'eager'} decoding="async" draggable={false} />
    {state === 'alert' && <span className="lp-robot__bell"><Bell aria-hidden="true" /></span>}
    {state === 'found' && <span className="lp-robot__found"><ArrowDown aria-hidden="true" />menor preço</span>}
  </span>
}
