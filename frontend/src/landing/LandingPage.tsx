import { useEffect, useMemo } from 'react'
import { LandingHeader } from './LandingHeader'
import { MobileCtaBar } from './MobileCtaBar'
import { ScrollCompanion } from './ScrollCompanion'
import { pageTitle } from './content'
import { DestinationsContext, landingDestinations } from './destinations'
import { motionStyle, usePrefersReducedMotion } from './motion'
import { AssistantShowcase } from './sections/AssistantShowcase'
import { Demo } from './sections/Demo'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Hero } from './sections/Hero'
import { HowItWorks } from './sections/HowItWorks'
import { LandingFooter } from './sections/LandingFooter'
import { Problem } from './sections/Problem'
import { WhyBestPrice } from './sections/WhyBestPrice'
import './LandingPage.css'

type Props = {
  /** Sessão já confirmada. Carregando ou com falha chega como false (spec 0050). */
  authenticated?: boolean
  /** Cadastro verificado e ligado (0048). Carregando ou com falha chega como false. */
  signupAvailable?: boolean
}

/**
 * Landing pública (spec 0050), fiel aos quadros 238:294 (desktop), 239:180 (mobile) e 239:856
 * (menu aberto) do Figma BestPrice IA. Todo dado mostrado é ilustrativo e fixo: a landing não faz
 * nenhuma requisição. O link do hero vai para `pendingTrackLink` (sessionStorage) e o monitoramento
 * o recebe depois de Entrar ou Criar conta.
 */
export function LandingPage({ authenticated = false, signupAvailable = false }: Props) {
  const destinations = useMemo(() => landingDestinations(authenticated, signupAvailable), [authenticated, signupAvailable])
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    document.title = pageTitle
    document.documentElement.classList.add('lp-scroll')
    return () => document.documentElement.classList.remove('lp-scroll')
  }, [])
  return <DestinationsContext.Provider value={destinations}>
    <div className="lp" style={motionStyle()} data-reduced-motion={reduced || undefined}>
      <a className="lp-skip" href="#lp-content">Pular para o conteúdo</a>
      <LandingHeader />
      <main id="lp-content">
        <Hero />
        <Problem />
        <HowItWorks />
        <Demo />
        <WhyBestPrice />
        <AssistantShowcase />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <ScrollCompanion />
      <MobileCtaBar />
    </div>
  </DestinationsContext.Provider>
}
