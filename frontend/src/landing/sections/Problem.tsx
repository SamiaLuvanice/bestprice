import { useRef, type CSSProperties } from 'react'
import { ArrowDown, ArrowUp, CircleHelp } from 'lucide-react'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { sample } from '../content'
import { useInView } from '../motion'

const tabs = ['Smartphone Exemplo 128…', 'Smartphone Exemplo 128…', 'Fone Bluetooth X…', 'Smartphone Exemplo 128…']

/** 02 · Problema → virada (238:353; mobile 239:229). */
export function Problem() {
  const scenes = useRef<HTMLOListElement>(null)
  const shown = useInView(scenes)
  return <section id="problema" className="lp-problem" aria-labelledby="lp-problem-title" data-figma-desktop="238:353" data-figma-mobile="239:229" data-companion="problema">
    <div className="lp-container">
      <p className="lp-eyebrow">O jeito antigo</p>
      <h2 id="lp-problem-title" className="lp-title lp-problem__title">Acompanhar preço na mão é um trabalho que nunca termina.</h2>
      <ol ref={scenes} className="lp-scenes" data-shown={shown || undefined}>
        <li className="lp-scene" style={{ '--i': 0 } as CSSProperties}>
          <div className="lp-scene__art lp-tabs" aria-hidden="true">
            <span className="lp-desktop lp-tabs__stack">{tabs.map((tab, index) => <span key={index} className={`lp-tab lp-tab--${index}`}><span className="lp-tab__icon" />{tab}<span className="lp-tab__close">×</span></span>)}</span>
            <span className="lp-tabs__count">12 abas abertas</span>
          </div>
          <h3>As abas se acumulam</h3>
          <p>Você abre o mesmo anúncio todo dia só para ver se algo mudou.</p>
        </li>
        <li className="lp-scene" style={{ '--i': 1 } as CSSProperties}>
          <div className="lp-scene__art lp-doubts" aria-hidden="true">
            <span className="lp-doubt"><CircleHelp />Ontem estava mais barato?</span>
            <span className="lp-doubt lp-doubt--second lp-desktop"><CircleHelp />Esse desconto é de verdade?</span>
          </div>
          <h3>A memória não ajuda</h3>
          <p>Sem histórico, fica difícil saber se o preço caiu ou só voltou ao normal.</p>
        </li>
        <li className="lp-scene" style={{ '--i': 2 } as CSSProperties}>
          <div className="lp-scene__art lp-moment" aria-hidden="true">
            <span className="lp-desktop lp-moment__cards">
              <span className="lp-moment__card"><span className="lp-mono">Terça, 10:42</span><strong>{sample.price}</strong></span>
              <span className="lp-moment__card lp-moment__card--late"><span className="lp-mono">Quinta, quando você viu</span><strong>{sample.seenLater}</strong>
                <span className="lp-pill lp-pill--up"><ArrowUp />10,8%</span></span>
            </span>
            <span className="lp-mobile lp-mono lp-moment__compact">{sample.momentCompact}</span>
          </div>
          <h3>O momento passa</h3>
          <p>Quando você finalmente confere, a queda já pode ter acabado.</p>
        </li>
      </ol>
      <div className="lp-turn">
        <BestPriceRobot size={72} />
        <div className="lp-turn__text">
          <p className="lp-turn__title">Deixa comigo.</p>
          <p><Responsive desktop="Eu confiro o preço por você. Você só aparece na hora de decidir." mobile="Eu confiro o preço. Você só decide." /></p>
        </div>
        <a className="lp-turn__next" href="#como-funciona" aria-label="Ir para Como funciona"><ArrowDown aria-hidden="true" /></a>
      </div>
    </div>
  </section>
}
