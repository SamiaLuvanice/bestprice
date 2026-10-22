import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Bell, Link2, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Brand } from '../components/Brand'
import heroArt from '../assets/redesign/hero-person.webp'
import bannerArt from '../assets/redesign/footer-phone.webp'
import pricePreview from '../assets/redesign/price-preview.webp'
import dashboardPreview from '../assets/redesign/dashboard-preview.webp'
import './LandingPage.css'

const navigation = [
  { label: 'Início', href: '#inicio' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Alertas', href: '#alertas' },
]
const steps = [
  { title: 'Cole o anúncio', text: 'O link do Mercado Livre é a única entrada.' },
  { title: 'Acompanhe as mudanças', text: 'Veja preço, disponibilidade e histórico no mesmo lugar.' },
  { title: 'Defina um alvo', text: 'Receba uma notificação quando o valor desejado chegar.' },
]

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggle = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    document.title = 'BestPrice · Acompanhe preços. Compre melhor.'
    document.documentElement.classList.add('landing-scroll')
    return () => document.documentElement.classList.remove('landing-scroll')
  }, [])

  return <div className="landing" id="inicio">
    <a className="landing-skip" href="#landing-content">Pular para o conteúdo</a>
    <header className="landing-header" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false)
    }} onKeyDown={(event) => {
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault()
        setMenuOpen(false)
        menuToggle.current?.focus()
      }
    }}>
      <div className="landing-container landing-header__inner">
        <a className="brand-link" href="#inicio" aria-label="BestPrice — Início" onClick={() => setMenuOpen(false)}>
          <Brand className="landing-brand" decorative />
        </a>
        <Button ref={menuToggle} variant="ghost" size="icon" className="landing-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
        <nav id="landing-navigation" className={menuOpen ? 'landing-nav is-open' : 'landing-nav'} aria-label="Navegação principal">
          {navigation.map(({ label, href }) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <Button asChild className="landing-mobile-login"><Link to="/login">Entrar e monitorar</Link></Button>
        </nav>
        <div className="landing-header__actions"><Button asChild variant="outline"><Link to="/login">Entrar</Link></Button></div>
      </div>
    </header>
    <main id="landing-content">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__copy">
            <h1 id="landing-title">O preço muda.<br /><span>Você fica sabendo.</span></h1>
            <p className="landing-hero__description">Cole o link de um anúncio uma vez. O BestPrice acompanha as mudanças e mostra quando vale olhar de novo.</p>
            <div className="landing-hero__actions">
              <Button asChild size="lg"><Link to="/login">Entrar e monitorar</Link></Button>
              <Button asChild variant="ghost"><a href="#como-funciona">Entenda como funciona <ArrowUpRight aria-hidden="true" /></a></Button>
            </div>
            <p className="landing-hero__note"><Link2 aria-hidden="true" /> Um link. Acompanhamento contínuo.</p>
          </div>
          <div className="landing-hero__visual"><img src={heroArt} alt="Pessoa consultando o celular, com ilustrações de alerta e histórico de preços." width="1120" height="682" fetchPriority="high" /><img className="landing-price-preview" src={pricePreview} alt="Exemplo ilustrativo de preço e variação. Não representa uma oferta real." width="506" height="201" /></div>
        </div>
      </section>
      <section id="como-funciona" className="landing-steps landing-container" aria-labelledby="landing-steps-title">
        <h2 id="landing-steps-title">A comparação começa com o seu link.</h2>
        <p className="landing-section-description">Sem preencher nome, preço ou detalhes do produto.</p>
        <ol className="landing-steps__list">{steps.map((step, index) => <li key={step.title}>
          <span className="landing-step-number" aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p>
        </li>)}</ol>
      </section>
      <section id="funcionalidades" className="landing-showcase" aria-labelledby="landing-showcase-title">
        <div className="landing-container"><h2 id="landing-showcase-title">Clareza para decidir na hora certa.</h2>
          <p className="landing-section-description">O painel reúne o que mudou, o que está disponível e seus alertas.</p>
          <figure className="landing-dashboard-preview"><img src={dashboardPreview} alt="Exemplo ilustrativo do painel com resumo do acompanhamento e produtos. Os valores não representam ofertas reais." width="1248" height="491" loading="lazy" />
            <figcaption>Exemplo ilustrativo da interface. Produtos e valores não representam ofertas reais.</figcaption>
          </figure>
        </div>
      </section>
      <section id="alertas" className="landing-alerts landing-container" aria-labelledby="landing-alerts-title">
        <div><h2 id="landing-alerts-title">Quando o preço chega onde você quer, o alerta encontra você.</h2>
          <p className="landing-section-description">Defina um valor no produto monitorado. O BestPrice avisa quando a condição for atingida.</p>
          <Button asChild variant="link"><Link to="/login">Acompanhar meus anúncios <ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
        <div className="landing-alert-illustration" aria-hidden="true"><Bell /><span>Alerta de preço</span><ArrowDownRight /><strong>Seu valor desejado</strong><span>Você recebe o sinal.</span></div>
      </section>
      <section className="landing-signup landing-container" aria-labelledby="landing-signup-title">
        <div className="landing-signup__copy"><h2 id="landing-signup-title">Seu próximo acompanhamento começa com um link.</h2><p>Os preços mudam. Você recebe o sinal na hora certa.</p>
          <Button asChild size="lg"><Link to="/login">Entrar e monitorar</Link></Button>
        </div>
        <img className="landing-signup__art" src={bannerArt} alt="Interface ilustrativa da BestPrice em um celular, com produto e gráfico de preços." loading="lazy" width="1600" height="548" />
      </section>
    </main>
    <footer className="landing-footer"><div className="landing-footer__inner landing-container"><span>BestPrice · {new Date().getFullYear()}</span><span>Mercado Livre · acompanhamento automático</span><Link to="/login">Entrar</Link></div></footer>
  </div>
}
