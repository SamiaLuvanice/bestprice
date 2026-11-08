import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { useDestinations } from '../destinations'

/** 09 · Rodapé (238:736; mobile 239:516). "Perguntas" só aparece no quadro desktop. */
export function LandingFooter() {
  const { login } = useDestinations()
  return <footer className="lp-footer lp-night" data-figma-desktop="238:736" data-figma-mobile="239:516">
    <div className="lp-container lp-footer__inner">
      <div>
        <Brand className="lp-footer__brand" />
        <p>Monitoramento automático de preços do Mercado Livre Brasil.</p>
      </div>
      <nav aria-label="Rodapé" className="lp-footer__links">
        <a href="#como-funciona">Como funciona</a>
        <a href="#assistente">Assistente</a>
        <a href="#perguntas" className="lp-desktop">Perguntas</a>
        <Link to={login}>Entrar</Link>
      </nav>
    </div>
  </footer>
}
