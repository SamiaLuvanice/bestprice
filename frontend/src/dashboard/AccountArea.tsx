import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import { api, ApiFailure, type Dashboard, type HistoryEntry, type Notification, type Product, type TrackedProduct, type User } from '../api'
import { useModalFocus } from '../lib/focus'
import { formatMoney, formatPercentage, retryHint } from '../lib/format'
import { attemptResult, availabilityLabel } from './labels'
import { initialTrackedList, trackedListReducer } from './trackedList'
import { useDashboard } from './useDashboard'

type Feedback = { message: string; trackedProductId: string | null }

// Formatação apenas para apresentação: valores monetários chegam como strings decimais e nenhum cálculo é feito aqui.
function money(value: string | null, unknown = 'Preço indisponível'): string {
  return formatMoney(value) ?? unknown
}

function instant(value: string | null, unknown = 'Ainda não consultado'): string {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : unknown
}

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

function feedback(error: unknown): Feedback {
  if (!(error instanceof ApiFailure)) return { message: message(error), trackedProductId: null }
  const text = error.retryAfterSeconds === null ? error.message : `${error.message} ${retryHint(error.retryAfterSeconds)}`
  return { message: text, trackedProductId: error.code === 'already_tracked' ? error.trackedProductId : null }
}

function unauthenticated(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure && error.status === 401
}

function priceState(product: Product): string {
  if (product.current_price === null) return 'Preço ainda não observado'
  if (product.lookup_status === 'not_found') return 'Anúncio não localizado · último preço conhecido'
  if (product.stale) return 'Último preço conhecido · preço desatualizado'
  return `Preço observado em ${instant(product.last_price_observed_at)}`
}

function percentage(value: string | null): string {
  return formatPercentage(value)?.text ?? 'Desconhecida'
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
      <dl className="product-metrics">
        <div><dt>Anterior</dt><dd>{money(product.previous_price, 'Desconhecido')}</dd></div>
        <div><dt>Mínimo</dt><dd>{money(product.min_price, 'Desconhecido')}</dd></div>
        <div><dt>Máximo</dt><dd>{money(product.max_price, 'Desconhecido')}</dd></div>
        <div><dt>Variação</dt><dd>{percentage(product.percentage_change)}</dd></div>
      </dl>
      <p className="metric-note">Mínimo e máximo desde o primeiro registro no BestPrice</p>
      <p className="muted">Última consulta: {instant(product.last_attempt_at, 'Desconhecida')}</p>
      <p className="muted">Última alteração: {instant(product.price_changed_at, 'Desconhecida')}</p>
      {product.last_attempt_status !== 'ok' && <p className="muted">Última tentativa: {attemptResult(product.last_attempt_status)}</p>}
      {item.alert?.enabled && <span className="small-badge">Alerta em {money(item.alert.target_price)}</span>}
    </div>
    <button type="button" className="text-button" onClick={() => onOpen(item.id)}>Ver detalhes</button>
  </article>
}

type Props = {
  user: User
  clock: () => Date
  /** 401 em qualquer chamada: encerra a sessão local e mostra a entrada (0011) com a mensagem da API. */
  onUnauthenticated: (message: string) => void
  onLoggedOut: () => void
}

/** Área autenticada: orquestra estado e ações; componentes de apresentação não chamam fetch. */
export function AccountArea({ user, clock, onUnauthenticated, onLoggedOut }: Props) {
  const [list, dispatchList] = useReducer(trackedListReducer, initialTrackedList)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Feedback | null>(null)
  const [selected, setSelected] = useState<TrackedProduct | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyCursor, setHistoryCursor] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCursor, setNotificationCursor] = useState<string | null>(null)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const detailOpener = useRef<HTMLElement | null>(null)
  const closeDetailButton = useRef<HTMLButtonElement>(null)
  const detailDialog = useRef<HTMLElement>(null)
  const trackedHeading = useRef<HTMLHeadingElement>(null)
  const detailOpen = selected !== null
  // Produto do diálogo aberto, lido por requisições que terminam depois de a pessoa fechar ou trocar o detalhe.
  const openDetailId = useRef<string | null>(null)
  useEffect(() => { openDetailId.current = selected?.id ?? null }, [selected])

  const endSession = useCallback((failure: ApiFailure) => onUnauthenticated(failure.message), [onUnauthenticated])
  const onDashboardLoaded = useCallback((data: Dashboard, receivedAt: Date) => {
    dispatchList({ type: 'dashboard', page: data.tracked_products, receivedAt })
  }, [])
  const { view: dashboardView, reload: reloadDashboard } = useDashboard({ clock, onLoaded: onDashboardLoaded, onUnauthenticated: endSession })
  const dashboard = dashboardView.status === 'ready' ? dashboardView.data : null

  // Diálogo modal: foco entra ao abrir e volta ao elemento que o abriu ao fechar; se ele saiu da página, vai ao título da lista.
  useEffect(() => {
    if (detailOpen) { closeDetailButton.current?.focus(); return }
    const opener = detailOpener.current
    detailOpener.current = null
    if (!opener) return
    if (opener.isConnected) opener.focus()
    else trackedHeading.current?.focus()
  }, [detailOpen])

  const closeDetail = useCallback(() => setSelected(null), [])
  useModalFocus(detailOpen, detailDialog, closeDetailButton, closeDetail)

  // Somente 401 encerra a sessão BestPrice; falhas da integração (503) e de rede mantêm a pessoa no painel.
  const fail = useCallback((failure: unknown) => {
    if (unauthenticated(failure)) { endSession(failure); return }
    setError(feedback(failure))
  }, [endSession])

  function applyNotifications(page: { items: Notification[]; next_cursor: string | null }) {
    setNotifications(page.items)
    setNotificationCursor(page.next_cursor)
    setNotificationsError(null)
  }

  useEffect(() => {
    let active = true
    api.notifications().then((result) => {
      if (!active) return
      setNotifications(result.items)
      setNotificationCursor(result.next_cursor)
      setNotificationsError(null)
    }).catch((failure: unknown) => {
      if (!active) return
      if (unauthenticated(failure)) fail(failure)
      else setNotificationsError(message(failure))
    })
    return () => { active = false }
  }, [fail])

  async function loadMore() {
    if (!list.nextCursor) return
    setBusy(true)
    setError(null)
    try {
      const page = await api.tracked(list.nextCursor)
      dispatchList({ type: 'append', page, receivedAt: clock() })
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await api.track(url)
      setUrl('')
      dispatchList({ type: 'upsert', tracked: result.tracked, receivedAt: clock() })
      await reloadDashboard()
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function open(id: string) {
    const opening = !selected
    if (opening && document.activeElement instanceof HTMLElement) detailOpener.current = document.activeElement
    setError(null)
    try {
      const [detail, priceHistory] = await Promise.all([api.detail(id), api.history(id)])
      setSelected(detail)
      setHistory(priceHistory.items)
      setHistoryCursor(priceHistory.next_cursor)
    } catch (failure) {
      // Se o diálogo não chegou a abrir, não há foco a devolver depois.
      if (opening) detailOpener.current = null
      fail(failure)
    }
  }

  async function loadMoreHistory() {
    if (!selected || !historyCursor) return
    setBusy(true)
    setError(null)
    try {
      const page = await api.history(selected.id, historyCursor)
      setHistory((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setHistoryCursor(page.next_cursor)
    } catch (failure) { fail(failure) }
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
      setNotificationsError(null)
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  // Detalhe recarregado após uma ação: atualiza o diálogo e a linha correspondente da lista.
  async function reloadSelected(id: string) {
    const detail = await api.detail(id)
    setSelected(detail)
    dispatchList({ type: 'replace', tracked: detail, receivedAt: clock() })
  }

  async function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.createAlert(selected.id, target)
      await reloadSelected(selected.id)
      await reloadDashboard()
      applyNotifications(await api.notifications())
      setTarget('')
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function updateAlert() {
    if (!selected?.alert) return
    setBusy(true)
    setError(null)
    try {
      await api.updateAlert(selected.id, target ? { target_price: target } : { enabled: !selected.alert.enabled })
      await reloadSelected(selected.id)
      await reloadDashboard()
      applyNotifications(await api.notifications())
      setTarget('')
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function removeAlert() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteAlert(selected.id)
      await reloadSelected(selected.id)
      await reloadDashboard()
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function stopTracking() {
    if (!selected) return
    const id = selected.id
    setBusy(true)
    setError(null)
    try {
      await api.stop(id)
      // O item que abriu o detalhe sai da lista; o foco segue para o título da lista.
      detailOpener.current = trackedHeading.current
      setSelected(null)
      dispatchList({ type: 'remove', id })
      await reloadDashboard()
    } catch (failure) { fail(failure) }
    finally { setBusy(false) }
  }

  async function refreshSelected() {
    if (!selected) return
    const id = selected.id
    setBusy(true)
    setError(null)
    try {
      const refreshed = await api.refresh(id)
      dispatchList({ type: 'replace', tracked: refreshed, receivedAt: clock() })
      // Só recarrega o detalhe se o diálogo continua aberto no mesmo produto; fechado, ele não deve reabrir.
      if (openDetailId.current === id) await open(id)
      await reloadDashboard()
      applyNotifications(await api.notifications())
    } catch (failure) {
      fail(failure)
      // O backend persiste a tentativa falha; recarregar mostra o resultado atualizado sem apagar o erro exibido.
      if (!unauthenticated(failure)) await reloadTracking(id)
    }
    finally { setBusy(false) }
  }

  async function reloadTracking(id: string) {
    try {
      if (openDetailId.current === id) {
        const detail = await api.detail(id)
        if (openDetailId.current === id) setSelected(detail)
        dispatchList({ type: 'replace', tracked: detail, receivedAt: clock() })
      }
      await reloadDashboard()
    } catch (failure) {
      if (unauthenticated(failure)) fail(failure)
    }
  }

  async function readNotification(id: string) {
    try {
      await api.readNotification(id)
      applyNotifications(await api.notifications())
    } catch (failure) { fail(failure) }
  }

  async function logout() {
    try {
      await api.logout()
      onLoggedOut()
    } catch (failure) { fail(failure) }
  }

  const trackedItems = list.items.map((entry) => entry.tracked)

  return <>
    <header className="masthead">
      <span className="brand-mark" aria-hidden="true">B</span>
      <span className="brand-name">BestPrice</span>
      <span className="account-label">{user.email}</span><button type="button" className="text-button" onClick={logout}>Sair</button>
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
        {error && !selected && <p role="alert" className="error-box">{error.message}</p>}
        {error?.trackedProductId && !selected && <button type="button" className="text-button" onClick={() => { if (error.trackedProductId) void open(error.trackedProductId) }}>Ver produto</button>}
        <p className="hero-note">Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.</p>
      </div>
    </section>

    <div className="content dashboard-content">
      <section aria-labelledby="indicators-title">
        <div className="section-heading"><span className="eyebrow">SEU PAINEL</span><h2 id="indicators-title">Tudo em um só lugar</h2></div>
        {dashboardView.status === 'error' && <div className="region-error">
          <p role="alert" className="error-box">{dashboardView.message}</p>
          <button type="button" className="text-button" onClick={() => void reloadDashboard()}>Tentar novamente</button>
        </div>}
        {dashboard ? <div className="metrics">
          <div><strong>{dashboard.summary.tracked_count}</strong><span>Produtos monitorados</span></div>
          <div><strong>{dashboard.summary.price_drop_count}</strong><span>Baixaram de preço</span></div>
          <div><strong>{dashboard.summary.active_alert_count}</strong><span>Alertas ativos</span></div>
          <div><strong>{dashboard.summary.target_reached_count}</strong><span>Alvos atingidos</span></div>
        </div> : dashboardView.status === 'loading' && <p role="status">Carregando seu painel…</p>}
      </section>

      <section aria-labelledby="opportunities-title">
        <div className="section-heading"><span className="eyebrow">ÚLTIMAS 24 HORAS</span><h2 id="opportunities-title">Boas oportunidades</h2></div>
        {dashboard?.opportunities.length ? dashboard.opportunities.map((item) => <ProductCard key={item.id} item={item} onOpen={open} />) :
          dashboard && <p className="empty">Nenhuma queda recente confirmada por enquanto.</p>}
      </section>

      <section aria-labelledby="tracked-title">
        <div className="section-heading"><span className="eyebrow">ACOMPANHAMENTO</span><h2 id="tracked-title" ref={trackedHeading} tabIndex={-1}>Produtos monitorados</h2></div>
        {trackedItems.length ? trackedItems.map((item) => <ProductCard key={item.id} item={item} onOpen={open} />) :
          dashboard && <p className="empty">Você ainda não monitora anúncios.</p>}
        {list.nextCursor && <button type="button" disabled={busy} className="text-button" onClick={loadMore}>Carregar mais</button>}
      </section>

      <section aria-labelledby="updates-title">
        <div className="section-heading"><span className="eyebrow">HISTÓRICO RECENTE</span><h2 id="updates-title">Atualizações recentes</h2></div>
        {dashboard?.recent_updates.length ? <ul className="feed">{dashboard.recent_updates.map((event) =>
          <li key={event.id}>{event.type === 'price_changed' ? 'Preço alterado' : 'Disponibilidade alterada'} · {instant(event.observed_at)}</li>)}</ul> :
          dashboard && <p className="empty">As mudanças confirmadas aparecerão aqui.</p>}
      </section>

      <section aria-labelledby="notifications-title">
        <div className="section-heading"><span className="eyebrow">ALERTAS</span><h2 id="notifications-title">Notificações</h2></div>
        {notificationsError && <p role="alert" className="error-box">{notificationsError}</p>}
        {notifications.length ? <ul className="feed">{notifications.map((notification) =>
          <li key={notification.id} className="notification-row">
            <span>{notification.product_title} chegou a {money(notification.observed_price)} · {instant(notification.created_at)}</span>
            {!notification.read_at && <button type="button" className="text-button" onClick={() => readNotification(notification.id)}>Marcar como lida</button>}
          </li>)}</ul> :
          !notificationsError && <p className="empty">Sem notificações por enquanto.</p>}
        {notificationCursor && <button type="button" disabled={busy} className="text-button" onClick={loadMoreNotifications}>Carregar mais notificações</button>}
      </section>
    </div>

    {selected && <div className="detail-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
      <section className="detail-panel" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selected.product.title}`} ref={detailDialog} onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeDetailButton} className="close-button" type="button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button>
        <span className="eyebrow">{selected.product.external_id}</span>
        <h2>{selected.product.title}</h2>
        {error && <p role="alert" className="error-box">{error.message}</p>}
        <p className="product-price">{money(selected.product.current_price)}</p>
        <p className="muted">{priceState(selected.product)}</p>
        <p className="muted">Resultado da última tentativa: {attemptResult(selected.product.last_attempt_status)}</p>
        <p className="muted">Última tentativa: {instant(selected.product.last_attempt_at)}</p>
        <p className="muted">Última leitura válida: {instant(selected.product.last_success_at, 'Desconhecida')}</p>
        <p className="muted">Último preço observado: {instant(selected.product.last_price_observed_at, 'Desconhecido')}</p>
        <p className="muted">Última mudança de preço: {instant(selected.product.price_changed_at, 'Desconhecida')}</p>
        <p className="muted">Disponibilidade observada: {availabilityLabel(selected.product.availability)}</p>
        {selected.product.last_confirmed_availability && <p className="muted">Última disponibilidade confirmada: {availabilityLabel(selected.product.last_confirmed_availability)} · {instant(selected.product.last_confirmed_availability_at)}</p>}
        <p className="muted">Preço unitário no Mercado Livre · BRL</p>
        <p className="muted">Anterior: {money(selected.product.previous_price, 'Desconhecido')} · Diferença: {money(selected.product.absolute_change, 'Desconhecida')} · Variação: {percentage(selected.product.percentage_change)}</p>
        <p className="muted">Menor: {money(selected.product.min_price, 'Desconhecido')} · Maior: {money(selected.product.max_price, 'Desconhecido')}</p>
        <div className="detail-links">
          <button type="button" disabled={busy} className="quiet-button" onClick={refreshSelected}>Atualizar agora</button>
          <a className="external-link" href={selected.product.canonical_url} target="_blank" rel="noopener noreferrer">Ver anúncio no Mercado Livre ↗</a>
        </div>
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
  </>
}
