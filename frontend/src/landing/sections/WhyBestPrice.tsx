import { Clock, History, ShieldCheck, Target, type LucideIcon } from 'lucide-react'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { benefits } from '../content'

const icons: Record<(typeof benefits)[number]['icon'], LucideIcon> = { clock: Clock, history: History, shield: ShieldCheck, target: Target }

/** 05 · Por que BestPrice (238:575; mobile 239:377): lista com divisores, não cards (nota 238:767). */
export function WhyBestPrice() {
  return <section id="por-que" className="lp-why" aria-labelledby="lp-why-title" data-figma-desktop="238:575" data-figma-mobile="239:377" data-companion="por-que">
    <div className="lp-container lp-why__grid">
      <div className="lp-why__intro">
        <p className="lp-eyebrow">Por que BestPrice</p>
        <h2 id="lp-why-title" className="lp-title">Menos tempo vigiando. Mais certeza na compra.</h2>
      </div>
      <ul className="lp-why__list">
        {benefits.map((benefit) => {
          const Icon = icons[benefit.icon]
          return <li key={benefit.title}>
            <span className="lp-why__icon" aria-hidden="true"><Icon /></span>
            <span><h3>{benefit.title}</h3><p><Responsive desktop={benefit.desktop} mobile={benefit.mobile} /></p></span>
          </li>
        })}
      </ul>
      <figure className="lp-why__quote">
        <BestPriceRobot size={96} />
        <figcaption className="lp-bubble"><span>Não compro nada por você.</span> <span>Só aviso na hora certa.</span></figcaption>
      </figure>
    </div>
  </section>
}
