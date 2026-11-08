import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { BestPriceRobot } from '../BestPriceRobot'
import { useDestinations } from '../destinations'

/** 08 · CTA final (238:722; mobile 239:508): órbitas girando devagar e o robô em "Escaneando". */
export function FinalCta() {
  const { monitor, login } = useDestinations()
  return <section id="comecar" className="lp-final lp-night" aria-labelledby="lp-final-title" data-figma-desktop="238:722" data-figma-mobile="239:508" data-companion="comecar">
    <div className="lp-final__orbits lp-desktop" aria-hidden="true">
      <span /><span><svg viewBox="0 0 760 760"><circle cx="380" cy="380" r="379.5" /></svg></span><span />
    </div>
    <div className="lp-container lp-final__content">
      <BestPriceRobot state="scanning" size={220} className="lp-final__robot" />
      <h2 id="lp-final-title" className="lp-title lp-final__title"><span>Cole o primeiro link.</span> <span>O resto é com o robô.</span></h2>
      <p className="lp-lead">Comece com um único link. Depois disso, quem confere é ele.</p>
      <div className="lp-final__actions" data-companion-avoid>
        <Button asChild size="lg"><Link to={monitor}>Começar a monitorar<ArrowRight aria-hidden="true" /></Link></Button>
        <Button asChild size="lg" variant="outline" className="lp-btn-night"><Link to={login}>Já tenho conta</Link></Button>
      </div>
    </div>
  </section>
}
