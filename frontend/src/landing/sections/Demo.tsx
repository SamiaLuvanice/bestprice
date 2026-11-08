import { useRef } from 'react'
import { ArrowDown, ArrowRight, History } from 'lucide-react'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { StepChart } from '../StepChart'
import { demoChanges, demoMonths, demoSteps, demoTarget, sample } from '../content'
import { useScrollProgress } from '../motion'

/**
 * 04 · Demonstração (238:485; mobile 239:330). Dados ilustrativos e fixos. O gráfico em degraus se
 * desenha conforme a rolagem e o robô pousa no último ponto com a dica do menor preço registrado.
 */
export function Demo() {
  const chart = useRef<HTMLDivElement>(null)
  useScrollProgress(chart)
  return <section id="demonstracao" className="lp-demo lp-night" aria-labelledby="lp-demo-title" data-figma-desktop="238:485" data-figma-mobile="239:330" data-companion="demonstracao">
    <div className="lp-container">
      <header className="lp-section-head">
      <p className="lp-eyebrow lp-eyebrow--green">Demonstração</p>
      <h2 id="lp-demo-title" className="lp-title lp-demo__title"><span>Um anúncio. Todo o histórico.</span> <span>Nenhuma planilha.</span></h2>
      <p className="lp-lead lp-desktop">É assim que um produto aparece depois que o BestPrice começa a acompanhar.</p>
      </header>
      <article className="lp-demo__panel" aria-label="Exemplo ilustrativo de produto acompanhado">
        <div className="lp-demo__summary">
          <div className="lp-demo__product">
            <span className="lp-phone lp-phone--night" aria-hidden="true" />
            <span><strong>Smartphone Exemplo 128 GB</strong>
              <Responsive
                desktop={<><span className="lp-mono lp-demo__id">MLB4012345678</span><span className="lp-demo__available"><span className="lp-dot" aria-hidden="true" />Disponível</span></>}
                mobile={<span className="lp-mono lp-demo__id">MLB4012345678 · Disponível</span>} /></span>
          </div>
          <p className="lp-label lp-desktop">Preço atual</p>
          <p className="lp-demo__price">{sample.price}</p>
          <p className="lp-demo__badges">
            <span className="lp-pill lp-pill--down"><ArrowDown aria-hidden="true" /><Responsive desktop="5,1% vs. anterior" mobile="5,1%" /></span>
            <span className="lp-pill lp-pill--target"><span className="lp-dot lp-dot--night" aria-hidden="true" />no seu alvo</span>
          </p>
          <dl className="lp-demo__stats">
            <div><dt>Anterior</dt><dd>{sample.previous}</dd></div>
            <div><dt>Menor registrado</dt><dd className="lp-down">{sample.price}</dd></div>
            <div><dt>Maior registrado</dt><dd>{sample.highest}</dd></div>
            <div><dt>Seu preço-alvo</dt><dd className="lp-target">{sample.target}</dd></div>
            <div className="lp-desktop"><dt>Última consulta</dt><dd>há 12 min</dd></div>
            <div className="lp-desktop"><dt>Última mudança</dt><dd>hoje, 10:42</dd></div>
          </dl>
          <p className="lp-demo__listing lp-desktop">Ver anúncio no Mercado Livre<ArrowRight aria-hidden="true" /></p>
        </div>
        <div className="lp-demo__history">
          <div className="lp-desktop lp-demo__history-head">
            <h3>Histórico de preço</h3>
            <span className="lp-pill lp-pill--night"><History aria-hidden="true" />Desde o 1º registro</span>
          </div>
          <div ref={chart} className="lp-demo__chart">
            <StepChart steps={demoSteps} target={demoTarget} min={1780} max={2240} draw="scroll" height={170}>
              <span className="lp-chart__target-label lp-mono lp-desktop">alvo {sample.targetShort}</span>
              <span className="lp-demo__lander"><BestPriceRobot state="found" size={44} /></span>
              <span className="lp-demo__tip">
                <strong><Responsive desktop="Menor preço desde o 1º registro" mobile="Menor preço registrado" /></strong>
                <span className="lp-mono"><Responsive desktop={`hoje, 10:42 · ${sample.price}`} mobile="hoje, 10:42" /></span>
              </span>
            </StepChart>
            <p className="lp-demo__months lp-mono lp-desktop" aria-hidden="true">{demoMonths.map((month) => <span key={month}>{month}</span>)}</p>
          </div>
          <ul className="lp-demo__changes lp-desktop">
            {demoChanges.map((item) => <li key={item.when} className="lp-mono"><span>{item.when}</span><strong>{item.change}</strong></li>)}
          </ul>
        </div>
      </article>
      <p className="lp-footnote"><Responsive
        desktop="Dados ilustrativos. O BestPrice considera o preço de uma unidade, sem frete, cupom ou benefício pessoal."
        mobile="Dados ilustrativos. Preço de uma unidade, sem frete, cupom ou benefício pessoal." /></p>
    </div>
  </section>
}
