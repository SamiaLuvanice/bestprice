import { useEffect, useState } from 'react'
import { checkHealth, type HealthResult } from './health'

type ViewState = { kind: 'loading' } | HealthResult

export function App() {
  const [view, setView] = useState<ViewState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    checkHealth(controller.signal).then((result) => {
      if (!controller.signal.aborted) setView(result)
    })
    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <header className="masthead">
        <span className="brand-mark" aria-hidden="true">B</span>
        <span className="brand-name">BestPrice</span>
      </header>

      <section className="content" aria-labelledby="page-title">
        <span className="eyebrow">AMBIENTE DE DESENVOLVIMENTO</span>
        <h1 id="page-title">Sua base está pronta para começar.</h1>
        <p className="intro">Acompanhe a conexão entre a interface, a API e o banco de dados.</p>

        <div className="status-card">
          <div className="status-heading">
            <span className={`status-icon status-icon--${view.kind}`} aria-hidden="true">
              {view.kind === 'success' ? '✓' : view.kind === 'loading' ? '…' : '!'}
            </span>
            <div>
              <span className="card-label">STATUS DO SISTEMA</span>
              {view.kind === 'loading' && <p role="status" className="status-title">Verificando conexão…</p>}
              {view.kind === 'success' && <p className="status-title">Tudo conectado</p>}
              {view.kind === 'unavailable' && <p role="alert" className="status-title">Serviço indisponível</p>}
              {view.kind === 'network-error' && <p role="alert" className="status-title">Não foi possível conectar à API</p>}
            </div>
          </div>

          <p className="status-description">
            {view.kind === 'loading' && 'Estamos verificando se os serviços estão disponíveis.'}
            {view.kind === 'success' && 'A API respondeu e confirmou a conexão com o PostgreSQL.'}
            {view.kind === 'unavailable' && 'A verificação não foi concluída. Tente novamente em instantes.'}
            {view.kind === 'network-error' && 'Verifique se a API está em execução e tente novamente.'}
          </p>

          <div className="service-list" aria-label="Serviços verificados">
            <div><span>Interface</span><span className="service-indicator service-indicator--ok">Disponível</span></div>
            <div><span>API e banco de dados</span><span className={`service-indicator ${view.kind === 'success' ? 'service-indicator--ok' : ''}`}>
              {view.kind === 'success' ? 'Disponíveis' : view.kind === 'loading' ? 'Verificando' : 'Indisponíveis'}
            </span></div>
          </div>
        </div>
      </section>

      <footer>BestPrice · Um novo começo</footer>
    </main>
  )
}
