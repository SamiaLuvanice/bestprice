import { useRef, type CSSProperties } from 'react'
import { Link2, Target } from 'lucide-react'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { sample } from '../content'
import { useInView, useScrollProgress } from '../motion'

/**
 * 03 · Como funciona (238:422; mobile 239:269). O traço verde percorre 01 → 02 → 03 conforme a
 * rolagem (`--progress`); cada passo mostra seus detalhes ao entrar na área visível, e o robô
 * assume uma pose por passo: ler (neutro), vigiar (escaneando), avisar (alerta).
 */
export function HowItWorks() {
  const steps = useRef<HTMLDivElement>(null)
  const shown = useInView(steps)
  useScrollProgress(steps)
  return <section id="como-funciona" className="lp-how lp-night" aria-labelledby="lp-how-title" data-figma-desktop="238:422" data-figma-mobile="239:269" data-companion="como-funciona">
    <div className="lp-container">
      <p className="lp-eyebrow lp-eyebrow--green">Como funciona</p>
      <h2 id="lp-how-title" className="lp-title">Você cola o link. O robô cuida do resto.</h2>
      <p className="lp-lead"><Responsive desktop="Um passo é seu. Os outros acontecem em segundo plano, todos os dias." mobile="Um passo é seu. Os outros acontecem em segundo plano." /></p>
      <div ref={steps} className="lp-steps" data-shown={shown || undefined}>
        <span className="lp-steps__trace" aria-hidden="true"><span /></span>
        <ol className="lp-steps__list">
        <li className="lp-step" style={{ '--at': 0 } as CSSProperties}>
          <div className="lp-step__art" aria-hidden="true">
            <BestPriceRobot state="neutral" size={88} />
            <span className="lp-step__checks lp-mono"><span>título ✓</span> <span>imagem ✓</span> <span>preço ✓</span></span>
            <span className="lp-step__url lp-mono"><Link2 />mercadolivre.com.br/…/MLB4012345678</span>
          </div>
          <p className="lp-step__meta lp-mono"><span className="lp-step__number">01</span><span className="lp-step__rule" />você</p>
          <h3>Cole o link do anúncio</h3>
          <p>Copie o endereço no Mercado Livre e cole no BestPrice. Título, imagem e preço chegam sozinhos — nada para preencher.</p>
        </li>
        <li className="lp-step" style={{ '--at': 0.5 } as CSSProperties}>
          <div className="lp-step__art" aria-hidden="true">
            <BestPriceRobot state="scanning" size={88} />
            <span className="lp-step__timeline">{Array.from({ length: 7 }, (_, index) => <span key={index} className="lp-step__tick" />)}</span>
            <span className="lp-pill lp-pill--down lp-step__change">↓ mudança registrada</span>
          </div>
          <p className="lp-step__meta lp-mono"><span className="lp-step__number">02</span><span className="lp-step__rule" />automático</p>
          <h3>O BestPrice acompanha</h3>
          <p>Consultas automáticas e periódicas registram cada mudança de preço e de disponibilidade. Mesmo enquanto você dorme.</p>
        </li>
        <li className="lp-step" style={{ '--at': 1 } as CSSProperties}>
          <div className="lp-step__art" aria-hidden="true">
            <BestPriceRobot state="alert" size={88} />
            <span className="lp-step__reached"><Target /><span><strong>Preço-alvo atingido</strong><span className="lp-mono">{`${sample.price} ≤ alvo ${sample.target}`}</span></span></span>
          </div>
          <p className="lp-step__meta lp-mono"><span className="lp-step__number lp-step__number--pink">03</span><span className="lp-step__rule" />automático</p>
          <h3>Você decide na hora certa</h3>
          <p>Defina um preço-alvo. Quando o anúncio chegar lá, o aviso aparece no seu BestPrice.</p>
        </li>
        </ol>
      </div>
    </div>
  </section>
}
