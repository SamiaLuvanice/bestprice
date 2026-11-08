import { useEffect, useState } from 'react'
import { BestPriceRobot } from './BestPriceRobot'
import { companionPhrases } from './content'

/**
 * Companheiro de rolagem (nota 238:771): mini-robô no canto inferior direito que troca a frase
 * conforme a seção no centro da janela e some no hero e no CTA final. Só a partir de 768 px (o
 * quadro mobile não o tem). É decorativo: `aria-hidden`, sem foco e sem ponteiro. Também some
 * enquanto uma ação marcada com `data-companion-avoid` passa pela faixa inferior da janela, para
 * não cobrir botões.
 */
export function ScrollCompanion() {
  const [section, setSection] = useState<string | null>(null)
  const [avoiding, setAvoiding] = useState(false)

  useEffect(() => {
    if (typeof window.IntersectionObserver !== 'function') return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-companion]'))
    const centerLine = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setSection((entry.target as HTMLElement).dataset.companion ?? null)
      }
    }, { rootMargin: '-50% 0px -50% 0px' })
    sections.forEach((element) => centerLine.observe(element))

    const avoid = Array.from(document.querySelectorAll('[data-companion-avoid]'))
    // A faixa inferior (160 px) é onde o mini-robô fica; o observador olha só para ela.
    const observeBand = () => {
      const visible = new Set<Element>()
      const band = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        setAvoiding(visible.size > 0)
      }, { rootMargin: `-${Math.max(window.innerHeight - 160, 0)}px 0px 0px 0px` })
      avoid.forEach((element) => band.observe(element))
      return band
    }
    let band = observeBand()
    // Redimensionar dispara muitos eventos: o observador da faixa é refeito uma vez por quadro.
    let frame = 0
    const onResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => { frame = 0; band.disconnect(); band = observeBand() })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      centerLine.disconnect()
      band.disconnect()
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const phrase = section ? companionPhrases[section] ?? null : null
  const hidden = !phrase || avoiding
  return <div className="lp-companion" aria-hidden="true" data-hidden={hidden || undefined} data-section={section ?? undefined}>
    <span key={phrase ?? 'none'} className="lp-companion__phrase">{phrase ?? ''}</span>
    <BestPriceRobot size={48} />
  </div>
}
