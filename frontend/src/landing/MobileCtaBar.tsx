import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { BestPriceRobot } from './BestPriceRobot'
import { useDestinations } from './destinations'

/** Barra fixa do quadro mobile (239:523): só abaixo de 768 px, no lugar do companheiro de rolagem. */
export function MobileCtaBar() {
  const { monitor } = useDestinations()
  return <aside className="lp-mobile-bar lp-mobile" aria-label="Começar a monitorar" data-figma-mobile="239:523">
    <BestPriceRobot size={35} className="lp-mobile-bar__robot" />
    <p>Pronto para parar de conferir?</p>
    <Button asChild><Link to={monitor}>Começar</Link></Button>
  </aside>
}
