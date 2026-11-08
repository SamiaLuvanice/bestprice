import { useEffect, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'

/**
 * Tempos do movimento da landing (spec 0050, AC08), um por nota do Figma (arquivo BestPrice IA,
 * lidas em 08/11/2026). Este módulo é a única fonte: o CSS lê os mesmos valores pelas variáveis
 * de `motionStyle`. Quando a nota não define um valor, o comentário diz qual token foi usado.
 */
export const landingMotion = {
  // 238:745 · Hero — "H1 sobe 12px + fade (400ms, ease-out)".
  heroEnterMs: 400,
  heroEnterOffsetPx: 12,
  heroEnterEasing: 'ease-out',
  // 238:745 · "O cartão entra 120ms depois; o robô por último" (mais 120 ms depois do cartão).
  heroCardDelayMs: 120,
  heroRobotDelayMs: 240,
  // 238:745 · "flutuação contínua de 4px (3s, ease-in-out)".
  robotFloatMs: 3000,
  robotFloatPx: 4,
  robotFloatEasing: 'ease-in-out',
  // 238:745 · "Feixe de leitura pulsa (opacidade 0,35↔0,6)". A nota não define o período: usa o da
  // flutuação (3 s), para os dois movimentos contínuos do robô andarem juntos.
  beamPulseMs: 3000,
  beamOpacityMin: 0.35,
  beamOpacityMax: 0.6,
  // 238:745 · "a linha do gráfico se desenha da esquerda para a direita (900ms)".
  heroChartDrawMs: 900,
  // 238:745 · "O toast ... desliza de baixo 1,2s após o carregamento".
  heroToastDelayMs: 1200,
  // 238:752 · Problema — "Cenas entram em sequência (stagger 80ms)". Duração da entrada: a nota não
  // define; usa a do hero (400 ms, ease-out), igual ao token --motion-enter.
  sceneStaggerMs: 80,
  sceneEnterMs: 400,
  // 238:767 · FAQ — "clique abre/fecha com Smart Animate 250ms".
  faqToggleMs: 250,
  // 238:771 · CTA final — "Órbitas giram lentamente (60s por volta)".
  orbitTurnMs: 60000,
  // 238:776 · Assistente — "Preparando uma resposta…" e, "1,2s depois, a resposta entra".
  assistantReplyDelayMs: 1200,
} as const

/** Variáveis CSS com os tempos acima; aplicadas na raiz da landing. */
export function motionStyle(): CSSProperties {
  const m = landingMotion
  return {
    '--lp-enter': `${m.heroEnterMs}ms`,
    '--lp-enter-offset': `${m.heroEnterOffsetPx}px`,
    '--lp-enter-easing': m.heroEnterEasing,
    '--lp-card-delay': `${m.heroCardDelayMs}ms`,
    '--lp-robot-delay': `${m.heroRobotDelayMs}ms`,
    '--lp-float': `${m.robotFloatMs}ms`,
    '--lp-float-offset': `${m.robotFloatPx}px`,
    '--lp-float-easing': m.robotFloatEasing,
    '--lp-beam': `${m.beamPulseMs}ms`,
    '--lp-beam-min': String(m.beamOpacityMin),
    '--lp-beam-max': String(m.beamOpacityMax),
    '--lp-chart-draw': `${m.heroChartDrawMs}ms`,
    '--lp-toast-delay': `${m.heroToastDelayMs}ms`,
    '--lp-stagger': `${m.sceneStaggerMs}ms`,
    '--lp-scene-enter': `${m.sceneEnterMs}ms`,
    '--lp-faq': `${m.faqToggleMs}ms`,
    '--lp-orbit': `${m.orbitTurnMs}ms`,
  } as CSSProperties
}

const reducedQuery = '(prefers-reduced-motion: reduce)'

function subscribeReduced(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const list = window.matchMedia(reducedQuery)
  list.addEventListener?.('change', onChange)
  return () => list.removeEventListener?.('change', onChange)
}

function readReduced() {
  return typeof window.matchMedia === 'function' && window.matchMedia(reducedQuery).matches
}

/** true quando o sistema pede movimento reduzido; acompanha mudanças da preferência. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, readReduced, () => false)
}

/**
 * Uma assinatura estável por consulta (criada fora do componente): o useSyncExternalStore não
 * desfaz e refaz o listener a cada render.
 */
function mediaQueryStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener?.('change', onChange)
      return () => list.removeEventListener?.('change', onChange)
    },
    read: () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  }
}

const mobileLayout = mediaQueryStore('(max-width: 767.98px)')

/** Largura do quadro mobile (239:180): abaixo de 768 px. */
export function useIsMobileLayout(): boolean {
  return useSyncExternalStore(mobileLayout.subscribe, mobileLayout.read, () => false)
}

/**
 * Vira true quando o elemento entra na área visível (uma vez). Sem IntersectionObserver
 * (navegador antigo) ou com movimento reduzido, começa true: o conteúdo nunca fica escondido.
 */
export function useInView(ref: RefObject<Element | null>, { threshold = 0.25 }: { threshold?: number } = {}): boolean {
  const reduced = usePrefersReducedMotion()
  const supported = typeof window.IntersectionObserver === 'function'
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || !supported || reduced || seen) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, supported, reduced, seen, threshold])
  return seen || !supported || reduced
}

/**
 * Progresso ligado à rolagem: escreve `--progress` (0 a 1) no elemento, sem re-render do React.
 * 0 quando o topo do elemento chega a 85% da altura da janela; 1 quando o fim do elemento passa
 * de 60%. Acompanha a rolagem nos dois sentidos. Com movimento reduzido, fica em 1 (estado final).
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): void {
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (reduced) {
      element.style.setProperty('--progress', '1')
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const start = viewport * 0.85
      const end = viewport * 0.6
      const span = Math.max(rect.height + start - end, 1)
      const value = Math.min(1, Math.max(0, (start - rect.top) / span))
      element.style.setProperty('--progress', value.toFixed(3))
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ref, reduced])
}
