import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Columns2, History, Menu, MessageSquare, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Brand } from '../components/Brand'
import heroArt from '../assets/redesign/hero-person.webp'
import './LandingPage.css'

export function LandingPage() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    document.title = 'BestPrice AI · Compre com mais clareza'
    document.documentElement.classList.add('landing-scroll')
    return () => document.documentElement.classList.remove('landing-scroll')
  }, [])
  return <div className="research-landing" id="inicio">
    <a className="landing-skip" href="#landing-content">Pular para o conteúdo</a>
    <header className="research-public-header" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() }
    }}>
      <Link className="research-brand" to="/" aria-label="BestPrice AI — Início"><Brand decorative />{' '}<span className="research-ai">AI</span></Link>
      <Button ref={toggle} variant="ghost" size="icon" className="research-public-menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</Button>
      <nav id="public-navigation" className={open ? 'is-open' : ''} aria-label="Navegação principal"><a href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</a><a href="#comparar" onClick={() => setOpen(false)}>Comparador</a><Link to="/login">Entrar</Link><Button asChild><Link to="/app/assistant">Começar com IA</Link></Button></nav>
    </header>
    <main id="landing-content">
      <section className="research-public-hero" aria-labelledby="landing-title"><div><h1 id="landing-title">Compre com<br /> mais clareza.</h1><p>Da primeira dúvida à comparação final. Converse sobre o que você precisa e organize suas opções antes de escolher.</p><div className="research-actions"><Button asChild size="lg"><Link to="/app/assistant">Começar com IA <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" size="lg"><a href="#como-funciona">Entender como funciona</a></Button></div><p className="research-public-note">Sua necessidade primeiro. A decisão continua sendo sua.</p></div><div className="research-public-visual"><img src={heroArt} width="1120" height="682" alt="Pessoa consultando o celular durante uma pesquisa de compra." fetchPriority="high" /></div></section>
      <section id="como-funciona" className="research-public-section"><h2>Uma boa compra começa com uma boa conversa.</h2><p>Você não precisa chegar sabendo o modelo ideal. Comece pelo que pretende fazer.</p><ol className="research-public-steps"><li><MessageSquare aria-hidden="true" /><h3>Conte o que procura</h3><p>Explique seu uso, suas prioridades e seu orçamento, se já tiver um.</p></li><li><Columns2 aria-hidden="true" /><h3>Coloque as opções em perspectiva</h3><p>Compare as informações que você tiver de até três produtos. As lacunas ficam claras.</p></li><li><History aria-hidden="true" /><h3>Volte quando fizer sentido</h3><p>Retome conversas e comparações salvas por até 90 dias da criação.</p></li></ol></section>
      <section id="comparar" className="research-public-comparison"><div><h2>O que muda entre as opções?</h2><p>Nome, características e preço que você informar, lado a lado. A IA ajuda a interpretar diferenças conforme seu uso, sem tratar informações ausentes como fatos.</p><Button asChild variant="outline"><Link to="/app/compare">Abrir comparador</Link></Button></div><div className="research-public-example"><strong>Compare o que importa para você.</strong><ul><li>Seu uso e suas prioridades</li><li>Informações fornecidas por você</li><li>Diferenças, prós, contras e lacunas</li></ul><p>Preços, estoque e especificações não são verificados automaticamente.</p></div></section>
      <section className="research-public-section research-public-final"><h2>Sua próxima compra pode começar por uma pergunta.</h2><Button asChild size="lg"><Link to="/app/assistant">Começar com IA</Link></Button><p>Acesso com sua conta existente. O serviço de IA depende de disponibilidade e limites de uso.</p><Link to="/app/monitoring">Já acompanha produtos? Acesse seu monitoramento.</Link></section>
    </main>
    <footer className="research-public-footer"><p>BestPrice AI · Escolhas com mais clareza.</p><Link to="/login">Entrar na sua conta</Link></footer>
  </div>
}
