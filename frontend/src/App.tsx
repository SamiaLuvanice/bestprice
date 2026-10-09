import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiFailure, type Dashboard, type HistoryEntry, type Notification, type Product, type TrackedProduct, type User } from './api'

function money(value: string | null): string {
  if (value === null) return 'Preço indisponível'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function instant(value: string | null): string {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Ainda não consultado'
}

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação.'
}

function attemptResult(status: string): string {
  const labels: Record<string, string> = {
    ok: 'Consulta concluída', missing_price: 'Item lido sem preço válido',
    unsupported_price_context: 'Preço fora do contexto monitorado', auth_required: 'Autorização da integração necessária',
    access_denied: 'Acesso à fonte negado', rate_limited: 'Limite de consultas atingido',
    temporary_error: 'Falha temporária na consulta', invalid_response: 'Resposta inválida da fonte',
    not_found: 'Anúncio não localizado no Mercado Livre',
  }
  return labels[status] ?? 'Resultado da consulta indisponível'
}

function priceState(product: Product): string {
  if (product.current_price === null) return 'Preço ainda não observado'
  if (product.lookup_status === 'not_found') return 'Anúncio não localizado · último preço conhecido'
  if (product.stale) return 'Último preço conhecido · preço desatualizado'
  return `Preço observado em ${instant(product.last_price_observed_at)}`
}

function availability(value: string): string {
  return { available: 'Disponível', unavailable: 'Indisponível', unknown: 'Não confirmada' }[value] ?? 'Não confirmada'
}

function percentage(value: string | null): string {
  return value === null ? 'Indisponível' : `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}%`
}

function ProductCard({ item, onOpen }: { item: TrackedProduct; onOpen: (id: string) => void }) {
  const product = item.product
  return <article className="product-card">
    {product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <div className="image-placeholder" aria-hidden="true">B</div>}
    <div className="product-info">
      <span className="product-id">{product.external_id}</span>
      <h3>{product.title}</h3>
      <p className="product-price">{money(product.current_price)}</p>
      <p className="muted">{priceState(product)}</p>
      {product.last_attempt_status !== 'ok' && <p className="muted">Última tentativa: {attemptResult(product.last_attempt_status)}</p>}
      {item.alert?.enabled && <span className="small-badge">Alerta em {money(item.alert.target_price)}</span>}
    </div>
    <button type="button" className="text-button" onClick={() => onOpen(item.id)}>Ver detalhes</button>
  </article>
}

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionState, setSessionState] = useState<'loading' | 'guest' | 'ready'>('loading')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [trackedItems, setTrackedItems] = useState<TrackedProduct[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TrackedProduct | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyCursor, setHistoryCursor] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCursor, setNotificationCursor] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api.me().then((result) => {
      if (active) { setUser(result); setSessionState('ready') }
    }).catch(() => { if (active) setSessionState('guest') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (sessionState !== 'ready') return
    let active = true
    api.dashboard().then((result) => { if (active) setDashboard(result) }).catch((failure: unknown) => {
      if (active) setError(message(failure))
    })
    api.notifications().then((result) => { if (active) { setNotifications(result.items); setNotificationCursor(result.next_cursor) } }).catch(() => {})
    return () => { active = false }
  }, [sessionState])

  useEffect(() => {
    if (!dashboard) return
    setTrackedItems(dashboard.tracked_products.items)
    setNextCursor(dashboard.tracked_products.next_cursor)
  }, [dashboard])

  async function loadMore() {
    if (!nextCursor) return
    setBusy(true)
    setError(null)
    try {
      const page = await api.tracked(nextCursor)
      setTrackedItems((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setNextCursor(page.next_cursor)
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await api.login(email, password)
      setUser(result)
      setPassword('')
      setSessionState('ready')
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!user) { setError('Entre na sua conta para monitorar este anúncio.'); return }
    setBusy(true)
    try {
      await api.track(url)
      setUrl('')
      setDashboard(await api.dashboard())
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function open(id: string) {
    setError(null)
    try {
      const [detail, priceHistory] = await Promise.all([api.detail(id), api.history(id)])
      setSelected(detail)
      setHistory(priceHistory.items)
      setHistoryCursor(priceHistory.next_cursor)
    } catch (failure) { setError(message(failure)) }
  }

  async function loadMoreHistory() {
    if (!selected || !historyCursor) return
    setBusy(true)
    setError(null)
    try {
      const page = await api.history(selected.id, historyCursor)
      setHistory((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setHistoryCursor(page.next_cursor)
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function loadMoreNotifications() {
    if (!notificationCursor) return
    setBusy(true)
    setError(null)
    try {
      const page = await api.notifications(notificationCursor)
      setNotifications((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setNotificationCursor(page.next_cursor)
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.createAlert(selected.id, target)
      setSelected(await api.detail(selected.id))
      setDashboard(await api.dashboard())
      const page = await api.notifications()
      setNotifications(page.items)
      setNotificationCursor(page.next_cursor)
      setTarget('')
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function updateAlert() {
    if (!selected?.alert) return
    setBusy(true)
    setError(null)
    try {
      await api.updateAlert(selected.id, target ? { target_price: target } : { enabled: !selected.alert.enabled })
      setSelected(await api.detail(selected.id))
      setDashboard(await api.dashboard())
      const page = await api.notifications()
      setNotifications(page.items)
      setNotificationCursor(page.next_cursor)
      setTarget('')
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function removeAlert() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteAlert(selected.id)
      setSelected(await api.detail(selected.id))
      setDashboard(await api.dashboard())
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function stopTracking() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.stop(selected.id)
      setSelected(null)
      setDashboard(await api.dashboard())
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function refreshSelected() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.refresh(selected.id)
      await open(selected.id)
      setDashboard(await api.dashboard())
      const page = await api.notifications()
      setNotifications(page.items)
      setNotificationCursor(page.next_cursor)
    } catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  async function readNotification(id: string) {
    try {
      await api.readNotification(id)
      const page = await api.notifications()
      setNotifications(page.items)
      setNotificationCursor(page.next_cursor)
    } catch (failure) { setError(message(failure)) }
  }

  async function logout() {
    try {
      await api.logout()
      setUser(null)
      setDashboard(null)
      setNotifications([])
      setNotificationCursor(null)
      setSelected(null)
      setHistory([])
      setHistoryCursor(null)
      setSessionState('guest')
    } catch (failure) { setError(message(failure)) }
  }

  return <main className="page">
    <header className="masthead">
      <span className="brand-mark" aria-hidden="true">B</span>
      <span className="brand-name">BestPrice</span>
      {user && <><span className="account-label">{user.email}</span><button type="button" className="text-button" onClick={logout}>Sair</button></>}
    </header>

    <section className="hero" aria-labelledby="page-title">
      <div className="hero-inner">
        <span className="eyebrow">MONITORAMENTO DE PREÇOS</span>
        <h1 id="page-title">Acompanhe o preço. Compre na hora certa.</h1>
        <p className="intro">Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.</p>
        <form onSubmit={track} className="track-form">
          <label htmlFor="product-url" className="sr-only">Link do anúncio do Mercado Livre</label>
          <input id="product-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.mercadolivre.com.br/..." />
          <button disabled={busy} type="submit">Monitorar preço</button>
        </form>
        {error && !selected && <p role="alert" className="error-box">{error}</p>}
        <p className="hero-note">O BestPrice usa dados disponíveis pela integração oficial autorizada. O preço exibido pode diferir do checkout.</p>
      </div>
    </section>

    {sessionState === 'loading' && <section className="content"><p role="status">Carregando sua conta…</p></section>}
    {sessionState === 'guest' && <section className="content narrow" aria-labelledby="login-title">
      <div className="panel">
        <span className="eyebrow">SUA ÁREA</span>
        <h2 id="login-title">Entre para acompanhar seus anúncios</h2>
        <form onSubmit={login} className="login-form">
          <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          <button disabled={busy} type="submit">Entrar</button>
        </form>
      </div>
    </section>}

    {sessionState === 'ready' && <div className="content dashboard-content">
      <section aria-labelledby="indicators-title">
        <div className="section-heading"><span className="eyebrow">SEU PAINEL</span><h2 id="indicators-title">Tudo em um só lugar</h2></div>
        {dashboard ? <div className="metrics">
          <div><strong>{dashboard.summary.tracked_count}</strong><span>Produtos monitorados</span></div>
          <div><strong>{dashboard.summary.price_drop_count}</strong><span>Baixaram de preço</span></div>
          <div><strong>{dashboard.summary.active_alert_count}</strong><span>Alertas ativos</span></div>
          <div><strong>{dashboard.summary.target_reached_count}</strong><span>Alvos atingidos</span></div>
        </div> : <p role="status">Carregando seu painel…</p>}
      </section>

      <section aria-labelledby="opportunities-title">
        <div className="section-heading"><span className="eyebrow">ÚLTIMAS 24 HORAS</span><h2 id="opportunities-title">Boas oportunidades</h2></div>
        {dashboard?.opportunities.length ? dashboard.opportunities.map((item) => <ProductCard key={item.id} item={item} onOpen={open} />) :
          <p className="empty">Nenhuma queda recente confirmada por enquanto.</p>}
      </section>

      <section aria-labelledby="tracked-title">
        <div className="section-heading"><span className="eyebrow">ACOMPANHAMENTO</span><h2 id="tracked-title">Produtos monitorados</h2></div>
        {trackedItems.length ? trackedItems.map((item) => <ProductCard key={item.id} item={item} onOpen={open} />) :
          <p className="empty">Você ainda não monitora anúncios.</p>}
        {nextCursor && <button type="button" disabled={busy} className="text-button" onClick={loadMore}>Carregar mais</button>}
      </section>

      <section aria-labelledby="updates-title">
        <div className="section-heading"><span className="eyebrow">HISTÓRICO RECENTE</span><h2 id="updates-title">Atualizações recentes</h2></div>
        {dashboard?.recent_updates.length ? <ul className="feed">{dashboard.recent_updates.map((event) =>
          <li key={event.id}>{event.type === 'price_changed' ? 'Preço alterado' : 'Disponibilidade alterada'} · {instant(event.observed_at)}</li>)}</ul> :
          <p className="empty">As mudanças confirmadas aparecerão aqui.</p>}
      </section>

      <section aria-labelledby="notifications-title">
        <div className="section-heading"><span className="eyebrow">ALERTAS</span><h2 id="notifications-title">Notificações</h2></div>
        {notifications.length ? <ul className="feed">{notifications.map((notification) =>
          <li key={notification.id} className="notification-row">
            <span>{notification.product_title} chegou a {money(notification.observed_price)} · {instant(notification.created_at)}</span>
            {!notification.read_at && <button type="button" className="text-button" onClick={() => readNotification(notification.id)}>Marcar como lida</button>}
          </li>)}</ul> :
          <p className="empty">Sem notificações por enquanto.</p>}
        {notificationCursor && <button type="button" disabled={busy} className="text-button" onClick={loadMoreNotifications}>Carregar mais notificações</button>}
      </section>
    </div>}

    {selected && <div className="detail-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
      <section className="detail-panel" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selected.product.title}`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button>
        <span className="eyebrow">{selected.product.external_id}</span>
        <h2>{selected.product.title}</h2>
        {error && <p role="alert" className="error-box">{error}</p>}
        <p className="product-price">{money(selected.product.current_price)}</p>
        <p className="muted">{priceState(selected.product)}</p>
        <p className="muted">Resultado da última tentativa: {attemptResult(selected.product.last_attempt_status)}</p>
        <p className="muted">Última tentativa: {instant(selected.product.last_attempt_at)}</p>
        <p className="muted">Última leitura válida: {instant(selected.product.last_success_at)}</p>
        <p className="muted">Último preço observado: {instant(selected.product.last_price_observed_at)}</p>
        <p className="muted">Última mudança de preço: {instant(selected.product.price_changed_at)}</p>
        <p className="muted">Disponibilidade observada: {availability(selected.product.availability)}</p>
        {selected.product.last_confirmed_availability && <p className="muted">Última disponibilidade confirmada: {availability(selected.product.last_confirmed_availability)} · {instant(selected.product.last_confirmed_availability_at)}</p>}
        <p className="muted">Preço unitário no Mercado Livre · BRL</p>
        <p className="muted">Anterior: {money(selected.product.previous_price)} · Diferença: {money(selected.product.absolute_change)} · Variação: {percentage(selected.product.percentage_change)}</p>
        <p className="muted">Menor: {money(selected.product.min_price)} · Maior: {money(selected.product.max_price)}</p>
        <button type="button" disabled={busy} className="quiet-button" onClick={refreshSelected}>Atualizar agora</button>
        <a className="external-link" href={selected.product.canonical_url} target="_blank" rel="noopener noreferrer">Ver anúncio no Mercado Livre ↗</a>
        <h3>Histórico de preços</h3>
        {history.length ? <ul className="feed">{history.map((entry) => <li key={entry.id}>{money(entry.price)} · {instant(entry.captured_at)}</li>)}</ul> : <p className="empty">Ainda não há preço válido registrado.</p>}
        {historyCursor && <button type="button" disabled={busy} className="text-button" onClick={loadMoreHistory}>Carregar mais preços</button>}
        <h3>Alerta de preço</h3>
        {selected.alert ? <div className="alert-controls">
          <p>Alvo: {money(selected.alert.target_price)} · {selected.alert.enabled ? 'Ativo' : 'Pausado'}</p>
          <label htmlFor="edit-target">Novo alvo (opcional)</label>
          <input id="edit-target" value={target} onChange={(event) => setTarget(event.target.value)} inputMode="decimal" placeholder="99.90" />
          <button disabled={busy} type="button" onClick={updateAlert}>{target ? 'Salvar alvo' : selected.alert.enabled ? 'Pausar alerta' : 'Ativar alerta'}</button>
          <button disabled={busy} type="button" className="quiet-button" onClick={removeAlert}>Excluir alerta</button>
        </div> :
          <form className="alert-form" onSubmit={createAlert}>
            <label htmlFor="target-price">Avise quando chegar a</label>
            <input id="target-price" value={target} onChange={(event) => setTarget(event.target.value)} inputMode="decimal" placeholder="99.90" required />
            <button disabled={busy} type="submit">Criar alerta</button>
          </form>}
        <div className="detail-actions"><button disabled={busy} type="button" className="quiet-button" onClick={stopTracking}>Parar de monitorar</button></div>
      </section>
    </div>}
    <footer>BestPrice · Acompanhe com clareza</footer>
  </main>
}
