import { useRef, useState, type CSSProperties } from 'react'
import { AppWindow, ArrowDown, ArrowUp, CircleHelp, TrendingUp } from 'lucide-react'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { sample } from '../content'
import { useInView } from '../motion'

const tabs = ['Smartphone Exemplo 128…', 'Smartphone Exemplo 128…', 'Fone Bluetooth X…', 'Smartphone Exemplo 128…']

const scenes = [
  { title: 'As abas se acumulam', text: 'Você abre o mesmo anúncio todo dia só para ver se algo mudou.' },
  { title: 'A memória não ajuda', text: 'Sem histórico, fica difícil saber se o preço caiu ou só voltou ao normal.' },
  { title: 'O momento passa', text: 'Quando você finalmente confere, a queda já pode ter acabado.' },
] as const

/**
 * Mobile (239:229): as três cenas viram um carrossel horizontal com scroll-snap. A faixa é uma
 * região rotulada e focável (setas rolam pelo teclado); os indicadores acompanham a posição e são
 * decorativos, porque a lista já diz quantas cenas há. A página nunca rola para o lado.
 */
function SceneCarousel() {
  const [active, setActive] = useState(0)
  const chips = [
    { icon: <AppWindow />, label: '12 abas abertas' },
    { icon: <CircleHelp />, label: 'Ontem estava mais barato?' },
    { icon: <TrendingUp />, label: sample.momentCompact },
  ]
  return <div className="lp-carousel lp-mobile">
    <div className="lp-carousel__track" role="region" aria-label="Cenas do jeito antigo" tabIndex={0}
      onScroll={(event) => {
        const track = event.currentTarget
        const card = track.firstElementChild?.firstElementChild as HTMLElement | null
        const step = (card?.offsetWidth ?? track.clientWidth) + 12
        setActive(Math.min(scenes.length - 1, Math.max(0, Math.round(track.scrollLeft / step))))
      }}>
      <ul>{scenes.map((scene, index) => <li key={scene.title} className="lp-carousel__card">
        <span className="lp-chip"><span className="lp-chip__icon" aria-hidden="true">{chips[index].icon}</span><span>{chips[index].label}</span></span>
        <h3>{scene.title}</h3>
        <p>{scene.text}</p>
      </li>)}</ul>
    </div>
    <p className="lp-carousel__dots" aria-hidden="true">{scenes.map((scene, index) => <span key={scene.title} data-active={index === active || undefined} />)}</p>
  </div>
}

/** 02 · Problema → virada (238:353; mobile 239:229). */
export function Problem() {
  const scenesRef = useRef<HTMLOListElement>(null)
  const shown = useInView(scenesRef)
  return <section id="problema" className="lp-problem" aria-labelledby="lp-problem-title" data-figma-desktop="238:353" data-figma-mobile="239:229" data-companion="problema">
    <div className="lp-container lp-problem__inner">
      <header className="lp-section-head">
        <p className="lp-eyebrow">O jeito antigo</p>
        <h2 id="lp-problem-title" className="lp-title">Acompanhar preço na mão é um trabalho que nunca termina.</h2>
      </header>
      <ol ref={scenesRef} className="lp-scenes lp-desktop" data-shown={shown || undefined}>
        <li className="lp-scene" style={{ '--i': 0 } as CSSProperties}>
          <div className="lp-scene__art lp-tabs" aria-hidden="true">
            <span className="lp-tabs__stack">{tabs.map((tab, index) => <span key={index} className={`lp-tab lp-tab--${index}`}>
              <span className="lp-tab__icon" /><span className="lp-tab__name">{tab}</span><span className="lp-tab__close">×</span></span>)}</span>
            <span className="lp-tabs__count">12 abas abertas</span>
          </div>
          <h3>{scenes[0].title}</h3>
          <p>{scenes[0].text}</p>
        </li>
        <li className="lp-scene" style={{ '--i': 1 } as CSSProperties}>
          <div className="lp-scene__art lp-doubts" aria-hidden="true">
            <span className="lp-doubt"><CircleHelp /><span>Ontem estava mais barato?</span></span>
            <span className="lp-doubt lp-doubt--second"><CircleHelp /><span>Esse desconto é de verdade?</span></span>
          </div>
          <h3>{scenes[1].title}</h3>
          <p>{scenes[1].text}</p>
        </li>
        <li className="lp-scene" style={{ '--i': 2 } as CSSProperties}>
          <div className="lp-scene__art lp-moment" aria-hidden="true">
            <span className="lp-moment__card"><span className="lp-mono">Terça, 10:42</span><strong>{sample.price}</strong></span>
            <span className="lp-moment__card lp-moment__card--late"><span className="lp-mono">Quinta, quando você viu</span><strong>{sample.seenLater}</strong>
              <span className="lp-pill lp-pill--up"><ArrowUp />10,8%</span></span>
          </div>
          <h3>{scenes[2].title}</h3>
          <p>{scenes[2].text}</p>
        </li>
      </ol>
      <SceneCarousel />
      <div className="lp-turn">
        <BestPriceRobot size={109} className="lp-turn__robot" />
        <div className="lp-turn__text">
          <p className="lp-turn__title">Deixa comigo.</p>
          <p className="lp-turn__lead"><Responsive desktop="Eu confiro o preço por você. Você só aparece na hora de decidir." mobile="Eu confiro o preço. Você só decide." /></p>
        </div>
        <a className="lp-turn__next lp-desktop" href="#como-funciona" aria-label="Ir para Como funciona"><ArrowDown aria-hidden="true" /></a>
      </div>
    </div>
  </section>
}
