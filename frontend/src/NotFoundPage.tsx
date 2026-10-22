import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Brand } from './components/Brand'

export function NotFoundPage({ authenticated }: { authenticated: boolean }) {
  const navigate = useNavigate()
  return <>
    <header className="not-found-header content"><Link className="brand-link" to="/" aria-label="BestPrice — Início">
      <Brand decorative />
    </Link></header>
    <main className="not-found-main content">
      <div className="not-found-copy"><h1 tabIndex={-1}>Este endereço saiu do radar.</h1>
        <p>Não encontramos uma página do BestPrice neste endereço. Confira o link ou volte para o seu acompanhamento.</p>
        <div className="not-found-actions">
          <Button asChild size="lg"><Link to={authenticated ? '/' : '/login'}>{authenticated ? 'Ir para Início' : 'Entrar'}</Link></Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Voltar uma página <ArrowUpRight aria-hidden="true" /></Button>
        </div>
      </div>
      <svg className="not-found-curve" viewBox="730 300 600 420" aria-hidden="true" focusable="false">
        <path d="M770 655C872 599 935 680 1020 557S1164 542 1235 393" />
        <path className="not-found-tail" d="m1248 380 48-47" />
        <circle cx="1235" cy="393" r="14" />
      </svg>
    </main>
  </>
}
