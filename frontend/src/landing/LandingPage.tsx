import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import bestPriceLogo from '../assets/logo-bestprice.png'
import heroArt from '../assets/landing/hero.webp'
import bannerArt from '../assets/landing/signup-banner.webp'
import smartphones from '../assets/landing/smartphones.webp'
import headphones from '../assets/landing/headphones.webp'
import notebooks from '../assets/landing/notebooks.webp'
import smartwatches from '../assets/landing/smartwatches.webp'
import games from '../assets/landing/games.webp'
import appliances from '../assets/landing/appliances.webp'
import home from '../assets/landing/home.webp'
import { ArrowRightIcon, BellIcon, TagIcon } from '../dashboard/Icons'
import './LandingPage.css'

const navigation = [
  { label: 'Início', href: '#inicio' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Produtos', href: '#produtos' },
  { label: 'Sobre', href: '#sobre' },
]

const benefits = [
  { title: 'Monitore produtos', text: 'Acompanhe os preços dos produtos do Mercado Livre Brasil.', kind: 'tag' },
  { title: 'Histórico de preços', text: 'Visualize a evolução e as variações de preço ao longo do tempo.', kind: 'trend' },
  { title: 'Alertas personalizados', text: 'Receba notificações quando o preço de um produto acompanhado cair.', kind: 'bell' },
  { title: 'Decisões mais inteligentes', text: 'Use informações de preço para identificar boas oportunidades de compra.', kind: 'shield' },
] as const

const steps = [
  { title: 'Busque o produto', text: 'Encontre o anúncio do Mercado Livre que deseja acompanhar.', kind: 'search' },
  { title: 'Acompanhe o preço', text: 'Visualize o histórico e as variações ao longo do tempo.', kind: 'trend' },
  { title: 'Ative os alertas', text: 'Receba uma notificação quando o preço cair.', kind: 'bell' },
  { title: 'Compre no momento certo', text: 'Identifique oportunidades de compra e economize.', kind: 'cart' },
] as const

const categories = [
  { name: 'Celulares e Smartphones', image: smartphones },
  { name: 'Fones de Ouvido', image: headphones },
  { name: 'Notebooks', image: notebooks },
  { name: 'Smartwatches', image: smartwatches },
  { name: 'Games', image: games },
  { name: 'Eletrodomésticos', image: appliances },
  { name: 'Casa e Decoração', image: home },
]

type IconKind = 'tag' | 'trend' | 'bell' | 'shield' | 'search' | 'cart'

function LandingIcon({ kind }: { kind: IconKind }) {
  if (kind === 'tag') return <TagIcon />
  if (kind === 'bell') return <BellIcon />
  const path = {
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    shield: <><path d="M12 2 4 5v6c0 5 3.3 8.7 8 11 4.7-2.3 8-6 8-11V5l-8-3Z" /><path d="m8.5 12 2.4 2.4 4.7-4.8" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    cart: <><path d="M2 4h2l2.5 11h11L21 7H5" /><circle cx="8" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  }[kind]
  return <svg className="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{path}</svg>
}

function SignupButton({ onClick, hero = false }: { onClick: () => void; hero?: boolean }) {
  return <button type="button" className="landing-button landing-button--primary" onClick={onClick}>
    Criar conta gratuita {hero && <ArrowRightIcon />}
  </button>
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [signupNotice, setSignupNotice] = useState(false)

  useEffect(() => {
    document.title = 'BestPrice · Acompanhe preços. Compre melhor.'
    document.documentElement.classList.add('landing-scroll')
    return () => document.documentElement.classList.remove('landing-scroll')
  }, [])

  function showSignupNotice() {
    setSignupNotice(true)
    setMenuOpen(false)
    window.requestAnimationFrame(() => document.getElementById('signup-notice')?.focus())
  }

  return <div className="landing" id="inicio">
    <a className="landing-skip" href="#landing-content">Pular para o conteúdo</a>
    <header className="landing-header">
      <div className="landing-header__inner">
        <a className="landing-brand" href="#inicio" aria-label="BestPrice — Início" onClick={() => setMenuOpen(false)}>
          <img src={bestPriceLogo} alt="" width="46" height="46" />
          <span>BestPrice</span>
        </a>
        <button type="button" className="landing-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <nav id="landing-navigation" className={menuOpen ? 'landing-nav is-open' : 'landing-nav'} aria-label="Navegação principal">
          {navigation.map(({ label, href }) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <div className="landing-nav__mobile-actions">
            <Link className="landing-button landing-button--secondary" to="/login" onClick={() => setMenuOpen(false)}>Entrar</Link>
            <SignupButton onClick={showSignupNotice} />
          </div>
        </nav>
        <div className="landing-header__actions">
          <Link className="landing-button landing-button--secondary" to="/login">Entrar</Link>
          <SignupButton onClick={showSignupNotice} />
        </div>
      </div>
    </header>

    {signupNotice && <div className="landing-notice" id="signup-notice" role="status" tabIndex={-1}>
      <span>O cadastro público ainda não está disponível. Se você já tem acesso, entre na sua conta.</span>
      <Link to="/login">Entrar</Link>
      <button type="button" aria-label="Fechar aviso" onClick={() => setSignupNotice(false)}>×</button>
    </div>}

    <main id="landing-content">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-kicker"><strong>Acompanhe.</strong> Compare. Compre <em>melhor.</em></p>
            <h1 id="landing-title" aria-label="Encontre o melhor preço no Mercado Livre.">Encontre<br />o melhor preço<br /><span>no Mercado Livre.</span></h1>
            <p className="landing-hero__description">A BestPrice monitora automaticamente os preços dos produtos que você quer, mostra a variação ao longo do tempo e avisa quando o preço cai.</p>
            <div className="landing-hero__actions">
              <SignupButton onClick={showSignupNotice} hero />
              <Link className="landing-button landing-button--secondary" to="/login">Entrar</Link>
            </div>
            <p className="landing-hero__note">Um link do anúncio é o suficiente para começar a acompanhar.</p>
          </div>
          <div className="landing-hero__visual">
            <img src={heroArt} alt="Pessoa consultando o celular, com ilustrações de alerta e histórico de preços." width="1774" height="887" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="landing-benefits landing-container" aria-label="Funcionalidades da BestPrice">
        {benefits.map((benefit, index) => <article className="landing-benefit" key={benefit.title}>
          <span className={`landing-icon landing-icon--${index % 2 ? 'pink' : 'green'}`}><LandingIcon kind={benefit.kind} /></span>
          <h2>{benefit.title}</h2>
          <p>{benefit.text}</p>
        </article>)}
      </section>

      <section id="como-funciona" className="landing-steps landing-container" aria-labelledby="landing-steps-title">
        <p className="landing-section-label">Como funciona</p>
        <h2 id="landing-steps-title">Em poucos passos,<br />você acompanha o preço.</h2>
        <ol className="landing-steps__list">
          {steps.map((step, index) => <li key={step.title} className="landing-step">
            <div className="landing-step__top"><span className={`landing-step__number landing-step__number--${index % 2 ? 'green' : 'pink'}`}>{index + 1}</span><span className="landing-step__icon"><LandingIcon kind={step.kind} /></span></div>
            <h3>{step.title}</h3><p>{step.text}</p>
          </li>)}
        </ol>
      </section>

      <section id="produtos" className="landing-categories" aria-labelledby="landing-categories-title">
        <div className="landing-container">
          <div className="landing-section-heading"><div><p className="landing-section-label">Explore possibilidades</p><h2 id="landing-categories-title">Categorias populares</h2></div><p>Encontre anúncios para acompanhar no Mercado Livre.</p></div>
          <div className="landing-categories__grid">
            {categories.map((category) => <article className="landing-category" key={category.name}>
              <img src={category.image} alt="" loading="lazy" width="480" height="480" />
              <h3>{category.name}</h3>
            </article>)}
          </div>
        </div>
      </section>

      <section className="landing-signup landing-container" aria-labelledby="landing-signup-title">
        <img className="landing-signup__art" src={bannerArt} alt="Interface ilustrativa da BestPrice em um celular, com produto e gráfico de preços." loading="lazy" width="2168" height="725" />
        <div className="landing-signup__copy">
          <h2 id="landing-signup-title">Crie sua conta <span>gratuitamente.</span></h2>
          <p>Comece a acompanhar seus produtos favoritos e receba alertas de preço dos produtos que você realmente quer.</p>
          <SignupButton onClick={showSignupNotice} hero />
        </div>
      </section>
    </main>

    <footer id="sobre" className="landing-footer">
      <div className="landing-container landing-footer__inner">
        <div><a className="landing-brand" href="#inicio"><img src={bestPriceLogo} alt="" width="38" height="38" /><span>BestPrice</span></a><p>Acompanhe preços. Compre melhor.</p></div>
        <nav aria-label="Rodapé"><a href="#sobre">Sobre</a><a href="#funcionalidades">Funcionalidades</a><a href="#como-funciona">Como funciona</a><Link to="/login">Entrar</Link></nav>
        <small>© {new Date().getFullYear()} BestPrice.</small>
      </div>
    </footer>
  </div>
}
