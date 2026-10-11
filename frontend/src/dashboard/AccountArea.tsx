import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import { api, ApiFailure, type Dashboard, type HistoryEntry, type Product, type TrackedProduct, type User } from '../api'
import { useModalFocus } from '../lib/focus'
import { formatMoney, formatPercentage, retryHint } from '../lib/format'
import { AppHeader, type SectionKey } from './AppHeader'
import { ExternalListingLink } from './ExternalListingLink'
import { HeroTrackForm, type TrackFeedback } from './HeroTrackForm'
import { attemptResult, availabilityLabel } from './labels'
import { initialTrackedList, trackedListReducer } from './trackedList'
import { NotificationBell } from './NotificationBell'
import { OpportunityList } from './OpportunityList'
import { IndicatorsSkeleton, OpportunitiesSkeleton, ProductsSkeleton, TimelineSkeleton } from './Skeletons'
import { RowActionsMenu } from './RowActionsMenu'
import { SummaryIndicators } from './SummaryIndicators'
import type { RowState } from './productColumns'
import { TrackedProductsTable } from './TrackedProductsTable'
import { useDashboard } from './useDashboard'
import { useNotifications } from './useNotifications'

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

type PendingFocus = { kind: 'rowMenu'; id: string } | { kind: 'productsHeading' } | { kind: 'linkInput' } | null

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
  // Lista mais recente para ações assíncronas que decidem foco depois de a resposta chegar.
  const listRef = useRef(list)
  useEffect(() => { listRef.current = list }, [list])
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [trackError, setTrackError] = useState<TrackFeedback | null>(null)
  const [trackSuccess, setTrackSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({})
  const [productsMessage, setProductsMessage] = useState<string | null>(null)
  const [globalMessage, setGlobalMessage] = useState<string | null>(null)
  const [pendingFocus, setPendingFocus] = useState<PendingFocus>(null)
  const [error, setError] = useState<Feedback | null>(null)
  const [selected, setSelected] = useState<TrackedProduct | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyCursor, setHistoryCursor] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const detailOpener = useRef<HTMLElement | null>(null)
  const closeDetailButton = useRef<HTMLButtonElement>(null)
  const detailDialog = useRef<HTMLElement>(null)
  const trackedHeading = useRef<HTMLHeadingElement>(null)
  const pageHeading = useRef<HTMLHeadingElement>(null)
  const linkInput = useRef<HTMLInputElement>(null)
  const alertsHeading = useRef<HTMLHeadingElement>(null)
  const [currentSection, setCurrentSection] = useState<SectionKey>('home')
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
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
  const loading = dashboardView.status === 'loading'
  // Sem produtos: hero em destaque e seções de produtos ocultas (AC23).
  const isEmpty = dashboard !== null && list.loaded && list.items.length === 0 && list.nextCursor === null
  const showProductSections = !isEmpty && dashboardView.status !== 'error'
  const notifications = useNotifications({ clock, onUnauthenticated: endSession })
  const [alertsError, setAlertsError] = useState<string | null>(null)

  // Diálogo modal: foco entra ao abrir e volta ao elemento que o abriu ao fechar; se ele saiu da página, vai ao título da lista.
  useEffect(() => {
    if (detailOpen) { closeDetailButton.current?.focus(); return }
    const opener = detailOpener.current
    detailOpener.current = null
    if (!opener) return
    if (opener.isConnected) opener.focus()
    else trackedHeading.current?.focus()
  }, [detailOpen])

  // Foco pedido por uma ação, aplicado depois que a lista e as mensagens foram renderizadas.
  useEffect(() => {
    if (!pendingFocus) return
    setPendingFocus(null)
    if (pendingFocus.kind === 'rowMenu') {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-row-menu]'))
      buttons.find((button) => button.dataset.rowMenu === pendingFocus.id)?.focus()
    } else if (pendingFocus.kind === 'productsHeading') {
      (trackedHeading.current ?? linkInput.current)?.focus()
    } else {
      linkInput.current?.focus()
    }
  }, [pendingFocus])

  const closeDetail = useCallback(() => setSelected(null), [])
  useModalFocus(detailOpen, detailDialog, closeDetailButton, closeDetail)

  // Somente 401 encerra a sessão BestPrice; falhas da integração (503) e de rede mantêm a pessoa no painel.
  const fail = useCallback((failure: unknown) => {
    if (unauthenticated(failure)) { endSession(failure); return }
    setError(feedback(failure))
  }, [endSession])

  async function loadMore() {
    if (!list.nextCursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await api.tracked(list.nextCursor)
      dispatchList({ type: 'append', page, receivedAt: clock() })
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else setLoadMoreError(message(failure))
    } finally { setLoadingMore(false) }
  }

  async function track() {
    setTrackError(null)
    setTrackSuccess(null)
    setSubmitting(true)
    try {
      const result = await api.track(url)
      setUrl('')
      dispatchList({ type: 'upsert', tracked: result.tracked, receivedAt: clock() })
      setTrackSuccess(result.outcome === 'created' ? 'Produto adicionado ao monitoramento.' : 'Você voltou a monitorar este produto.')
      // Indicadores recalculados pela API; a lista já carregada permanece.
      void reloadDashboard()
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else setTrackError(feedback(failure))
    } finally { setSubmitting(false) }
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
      await notifications.refreshAfterAction()
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
      await notifications.refreshAfterAction()
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
      await notifications.refreshAfterAction()
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
    const failure = await notifications.markRead(id)
    setAlertsError(failure)
  }

  // Ações da linha: implementadas em T15 e T16.
  function setRow(id: string, state: RowState) {
    setRowStates((current) => ({ ...current, [id]: state }))
  }

  // Convenção de produto removido (parar, 409/404): mensagem na seção e foco no título; se a lista
  // ficar vazia, foco no campo de link e mensagem na região global da página.
  function removeTracked(id: string, text: string) {
    const current = listRef.current
    const remaining = current.items.filter((entry) => entry.tracked.id !== id).length
    dispatchList({ type: 'remove', id })
    setRowStates((states) => {
      const next = { ...states }
      delete next[id]
      return next
    })
    if (remaining > 0 || current.nextCursor !== null) {
      setGlobalMessage(null)
      setProductsMessage(text)
      setPendingFocus({ kind: 'productsHeading' })
    } else {
      setProductsMessage(null)
      setGlobalMessage(text)
      setPendingFocus({ kind: 'linkInput' })
    }
  }

  // Indicadores e contador do sino recalculados pela API, sem descartar itens e páginas carregados.
  function recalculate() {
    void reloadDashboard()
    void notifications.refreshAfterAction()
  }

  async function refreshRow(id: string) {
    setRow(id, { busy: true, message: null })
    setProductsMessage(null)
    let text: string
    try {
      const updated = await api.refresh(id)
      dispatchList({ type: 'replace', tracked: updated, receivedAt: clock() })
      const notFound = updated.product.lookup_status === 'not_found'
      text = updated.product.last_attempt_status === 'ok' && !notFound ? 'Consulta concluída.'
        : attemptResult(notFound ? 'not_found' : updated.product.last_attempt_status)
    } catch (failure) {
      if (unauthenticated(failure)) { endSession(failure); return }
      if (failure instanceof ApiFailure && (failure.status === 404 || failure.code === 'tracking_inactive')) {
        removeTracked(id, failure.message)
        recalculate()
        return
      }
      text = feedback(failure).message
      // 429 mantém os dados; nas demais falhas o backend registra a tentativa e a linha é recarregada.
      if (!(failure instanceof ApiFailure && failure.status === 429)) await reloadRow(id)
    }
    setRow(id, { busy: false, message: text })
    setPendingFocus({ kind: 'rowMenu', id })
    recalculate()
  }

  async function reloadRow(id: string) {
    try {
      const latest = await api.detail(id)
      dispatchList({ type: 'replace', tracked: latest, receivedAt: clock() })
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
    }
  }

  function requestStop(id: string) { void id }

  // Falha ao sair mantém a sessão local e mostra o erro no cabeçalho; só 401 leva à entrada.
  async function logout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await api.logout()
      onLoggedOut()
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else { setLogoutError(message(failure)); setLoggingOut(false) }
    }
  }

  function navigate(section: SectionKey) {
    setCurrentSection(section)
    // Sem a seção “Seus produtos” (lista vazia), Produtos leva ao campo de link.
    const productsTarget = trackedHeading.current ?? linkInput.current
    const target = { home: pageHeading.current, products: productsTarget, alerts: alertsHeading.current }[section]
    target?.focus()
  }

  return <>
    <AppHeader email={user.email} current={currentSection} onNavigate={navigate}
      bell={<NotificationBell unread={notifications.unread} onRetry={notifications.reloadUnread}
        onMarkRead={notifications.markRead} onSeeAll={() => navigate('alerts')} />}
      logoutError={logoutError} loggingOut={loggingOut} onLogout={() => void logout()} />

    <main id="conteudo" className="page-main">
    <HeroTrackForm value={url} onChange={setUrl} onSubmit={() => void track()} submitting={submitting}
      error={trackError} success={trackSuccess} onViewProduct={(id) => void open(id)} headingRef={pageHeading}
      inputRef={linkInput} priority={isEmpty}>
      {isEmpty && <div className="empty-state">
        <p className="empty-title">Você ainda não está acompanhando nenhum produto.</p>
        <p>Encontre um produto no Mercado Livre, copie o link do anúncio e cole acima. O BestPrice acompanha as alterações para você.</p>
      </div>}
    </HeroTrackForm>
    <div className="content global-messages">
      <p role="status" data-testid="global-status" className={globalMessage ? 'global-status' : 'sr-only'}>{globalMessage}</p>
      {error && !selected && <p role="alert" className="error-box">{error.message}</p>}
    </div>

    <div className="content dashboard-content">
      <section aria-label="Resumo do monitoramento" className="summary-section" aria-busy={loading}>
        {dashboardView.status === 'error' && <div className="region-error">
          <p role="alert" className="error-box">{dashboardView.message}</p>
          <button type="button" className="text-button" onClick={() => void reloadDashboard()}>Tentar novamente</button>
        </div>}
        <p role="status" className={loading ? 'loading-status' : 'sr-only'}>{loading ? 'Carregando seu painel…' : ''}</p>
        {loading && <IndicatorsSkeleton />}
        {dashboard && <SummaryIndicators summary={dashboard.summary} />}
      </section>

      {showProductSections && <section aria-labelledby="opportunities-title" className="card-section" aria-busy={loading}>
        <div className="section-heading">
          <h2 id="opportunities-title">Boas oportunidades</h2>
          <p className="section-subtitle">Produtos monitorados que tiveram redução de preço recentemente.</p>
        </div>
        {loading && <OpportunitiesSkeleton />}
        {dashboardView.status === 'ready' && <OpportunityList items={dashboardView.data.opportunities} receivedAt={dashboardView.receivedAt} onOpen={(id) => void open(id)} />}
      </section>}

      {showProductSections && <TrackedProductsTable entries={list.items} rowStates={rowStates} hasMore={list.nextCursor !== null}
        loadingMore={loadingMore} loadMoreError={loadMoreError} onLoadMore={() => void loadMore()} onOpen={(id) => void open(id)}
        renderActions={(entry) => <RowActionsMenu id={entry.tracked.id} title={entry.tracked.product.title} href={entry.tracked.product.canonical_url}
          disabled={rowStates[entry.tracked.id]?.busy ?? false} onRefresh={() => void refreshRow(entry.tracked.id)} onStop={() => requestStop(entry.tracked.id)} />}
        message={productsMessage} headingRef={trackedHeading} skeleton={loading ? <ProductsSkeleton /> : undefined} />}

      {showProductSections && <section aria-labelledby="updates-title" aria-busy={loading}>
        <div className="section-heading"><span className="eyebrow">HISTÓRICO RECENTE</span><h2 id="updates-title">Atualizações recentes</h2></div>
        {loading && <TimelineSkeleton />}
        {dashboard?.recent_updates.length ? <ul className="feed">{dashboard.recent_updates.map((event) =>
          <li key={event.id}>{event.type === 'price_changed' ? 'Preço alterado' : 'Disponibilidade alterada'} · {instant(event.observed_at)}</li>)}</ul> :
          dashboard && <p className="empty">As mudanças confirmadas aparecerão aqui.</p>}
      </section>}

      <section id="alertas" aria-labelledby="notifications-title">
        <div className="section-heading"><span className="eyebrow">ALERTAS</span><h2 id="notifications-title" ref={alertsHeading} tabIndex={-1}>Alertas</h2></div>
        {notifications.all.status === 'error' && <p role="alert" className="error-box">{notifications.all.message}</p>}
        {alertsError && <p role="alert" className="error-box">{alertsError}</p>}
        {notifications.all.items.length ? <ul className="feed">{notifications.all.items.map(({ notification }) =>
          <li key={notification.id} className="notification-row">
            <span>{notification.product_title} chegou a {money(notification.observed_price)} · {instant(notification.created_at)}</span>
            <span className="read-state">{notification.read_at ? 'Lida' : 'Não lida'}</span>
            {!notification.read_at && <button type="button" className="text-button" onClick={() => void readNotification(notification.id)}>Marcar como lida</button>}
          </li>)}</ul> :
          notifications.all.status === 'ready' && <p className="empty">Sem notificações por enquanto.</p>}
        {notifications.all.nextCursor && <button type="button" disabled={notifications.all.loadingMore} className="text-button" onClick={() => void notifications.loadMoreAll()}>Carregar mais notificações</button>}
      </section>
    </div>
    </main>

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
          <ExternalListingLink href={selected.product.canonical_url} />
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
