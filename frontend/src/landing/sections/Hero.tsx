import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, Bell, History, Link2, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { savePendingTrackLink } from '../../navigation/pendingTrackLink'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { StepChart } from '../StepChart'
import { approvedSeal, emptyLinkMessage, heroSteps, heroTarget, recentChecks, sample } from '../content'
import { useDestinations } from '../destinations'
import { useIsMobileLayout } from '../motion'

/** 01 · Hero, com o robô vigiando (238:295; mobile 239:181). */
export function Hero() {
  const { monitor } = useDestinations()
  const navigate = useNavigate()
  const mobile = useIsMobileLayout()
  const [link, setLink] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [found, setFound] = useState(false)
  const fieldId = useId()
  const helpId = useId()
  const errorId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = link.trim()
    if (!value) {
      setInvalid(true)
      return
    }
    // O link vai para a aba (sessionStorage) antes de navegar; nunca para o endereço.
    savePendingTrackLink(value)
    navigate(monitor)
  }

  return <section id="inicio" className="lp-hero" aria-labelledby="lp-hero-title" data-figma-desktop="238:295" data-figma-mobile="239:181" data-companion="inicio">
    <div className="lp-hero__backdrop" aria-hidden="true" />
    <div className="lp-container lp-hero__grid">
      <div className="lp-hero__copy">
        <p className="lp-live"><span className="lp-live__dot" aria-hidden="true" />
          <Responsive desktop="Monitorando anúncios do Mercado Livre" mobile="Monitorando o Mercado Livre" /></p>
        <h1 id="lp-hero-title" className="lp-hero__title">Pare de dar F5 no preço.</h1>
        <p className="lp-hero__kicker">O BestPrice acompanha por você — e avisa na hora certa.</p>
        <form className="lp-link-form" onSubmit={submit} noValidate>
          <div className="lp-link-form__field" data-invalid={invalid || undefined}>
            <Link2 className="lp-link-form__icon" aria-hidden="true" />
            <label htmlFor={fieldId} className="sr-only">Link do anúncio do Mercado Livre</label>
            <input id={fieldId} className="lp-link-form__input" type="url" inputMode="url" autoComplete="off"
              placeholder={mobile ? 'Cole o link do anúncio' : 'Cole o link do anúncio do Mercado Livre'}
              value={link} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${errorId} ${helpId}` : helpId}
              onChange={(event) => { setLink(event.target.value); if (invalid) setInvalid(false) }} />
            <Button type="submit" className="lp-link-form__submit">Monitorar preço<ArrowRight aria-hidden="true" /></Button>
          </div>
          {invalid && <p id={errorId} className="lp-link-form__error">{emptyLinkMessage}</p>}
          <p id={helpId} className="lp-link-form__help">Um link por produto. Você não precisa preencher mais nada.</p>
        </form>
        <ul className="lp-proofs">
          <li><ShieldCheck aria-hidden="true" />API oficial do Mercado Livre</li>
          <li><Link2 aria-hidden="true" />{approvedSeal}</li>
          <li><History aria-hidden="true" />Histórico desde o 1º registro</li>
        </ul>
      </div>

      <div className="lp-hero__stage">
        <div className="lp-hero__robot" onPointerEnter={() => setFound(true)} onPointerLeave={() => setFound(false)}>
          <BestPriceRobot state={found ? 'found' : 'scanning'} size={185} floating lazy={false}
            alt="Robô do BestPrice vigiando o preço de um anúncio" />
          <p className="lp-bubble lp-hero__bubble">Tô de olho nesse aqui.</p>
        </div>
        <article className="lp-product-card" aria-label="Exemplo ilustrativo de anúncio monitorado">
          <div className="lp-product-card__head">
            <span className="lp-phone" aria-hidden="true" />
            <span className="lp-product-card__name"><strong>Smartphone Exemplo</strong><span className="lp-mono">MLB4012345678</span></span>
            <span className="lp-pill lp-pill--down"><ArrowDown aria-hidden="true" />5,1%</span>
          </div>
          <p className="lp-product-card__price"><strong>{sample.price}</strong><s className="lp-mono">{sample.previous}</s></p>
          <StepChart steps={heroSteps} target={heroTarget} min={1820} max={2020} draw="load" className="lp-hero__chart" />
          <div className="lp-product-card__foot">
            <span className="lp-mono"><span className="lp-dot" aria-hidden="true" />Última consulta · há 12 min</span>
            <span className="lp-mono lp-target">Alvo {sample.targetShort}</span>
          </div>
        </article>
        <div className="lp-toast">
          <span className="lp-toast__icon" aria-hidden="true"><Bell /></span>
          <span><strong>Chegou no seu preço-alvo</strong>
            <span className="lp-mono"><Responsive desktop={`Smartphone Exemplo · ${sample.price}`} mobile={sample.price} /></span></span>
        </div>
        <div className="lp-checks lp-desktop">
          <p className="lp-label">Consultas recentes</p>
          <ul>{recentChecks.map((check) => <li key={check.when} className="lp-mono">
            <span>{check.when}</span><strong>{check.price}</strong><span className={check.down ? 'lp-down' : undefined}>{check.change}</span>
          </li>)}</ul>
        </div>
      </div>
    </div>
  </section>
}
