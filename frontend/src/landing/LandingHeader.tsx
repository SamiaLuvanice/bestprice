import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../components/ui/sheet'
import { BestPriceRobot } from './BestPriceRobot'
import { anchors } from './content'
import { useDestinations } from './destinations'

/**
 * Cabeçalho da landing (Navegação/Desktop do 238:295; mobile 239:181; menu aberto 239:856).
 * No mobile, as âncoras e as ações ficam num menu sobre a página (ui/sheet, Radix Dialog): prende
 * o foco, fecha com Esc, com o botão de fechar e ao escolher uma âncora, e devolve o foco ao botão.
 */
export function LandingHeader() {
  const { monitor, login } = useDestinations()
  const [open, setOpen] = useState(false)
  return <header className="lp-header" data-figma-desktop="238:295" data-figma-mobile="239:181">
    <div className="lp-header__bar">
      <a className="lp-header__brand" href="#inicio" aria-label="BestPrice — Início"><Brand decorative /></a>
      <nav className="lp-header__nav" aria-label="Navegação principal">
        {anchors.map((anchor) => <a key={anchor.id} href={`#${anchor.id}`}>{anchor.label}</a>)}
      </nav>
      <div className="lp-header__actions">
        <Button asChild variant="outline" className="lp-header__login"><Link to={login}>Entrar</Link></Button>
        <Button asChild className="lp-header__cta"><Link to={monitor}>Começar a monitorar</Link></Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lp-header__menu" aria-label="Abrir menu"><Menu aria-hidden="true" /></Button>
          </SheetTrigger>
          <SheetContent side="top" showCloseButton={false} className="lp-menu">
            <div className="lp-menu__top">
              <Brand className="lp-menu__brand" />
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="lp-menu__close" aria-label="Fechar menu"><X aria-hidden="true" /></Button>
              </SheetClose>
            </div>
            <nav aria-label="Menu" className="lp-menu__nav">
              {anchors.map((anchor) => <SheetClose asChild key={anchor.id}>
                <a href={`#${anchor.id}`}>{anchor.label}<ArrowRight aria-hidden="true" /></a>
              </SheetClose>)}
            </nav>
            <div className="lp-menu__actions">
              <Button asChild size="lg"><Link to={monitor}>Começar a monitorar<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="lp-btn-night"><Link to={login}>Entrar</Link></Button>
            </div>
            <SheetDescription className="lp-menu__note">
              <BestPriceRobot size={32} />Cole um link e eu confiro por você.
            </SheetDescription>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
}
