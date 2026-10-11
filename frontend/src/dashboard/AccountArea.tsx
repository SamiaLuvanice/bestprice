import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type FormEvent } from 'react'
import { api, ApiFailure, type Dashboard, type HistoryEntry, type TrackedProduct, type User } from '../api'
import { retryHint } from '../lib/format'
import { AlertsSection } from './AlertsSection'
import { AppHeader, type SectionKey } from './AppHeader'
import { ConfirmStopDialog } from './ConfirmStopDialog'
import { HeroTrackForm, type TrackFeedback } from './HeroTrackForm'
import { attemptResult } from './labels'
import { initialTrackedList, trackedListReducer } from './trackedList'
import { NotificationBell } from './NotificationBell'
import { ProductDetailDialog, type DetailMode } from './ProductDetailDialog'
import { OpportunityList } from './OpportunityList'
import { IndicatorsSkeleton, OpportunitiesSkeleton, ProductsSkeleton, TimelineSkeleton } from './Skeletons'
import { RecentUpdatesTimeline, type KnownProduct } from './RecentUpdatesTimeline'
import { RowActionsMenu } from './RowActionsMenu'
import { SummaryIndicators } from './SummaryIndicators'
import type { RowState } from './productColumns'
import { TrackedProductsTable } from './TrackedProductsTable'
import { useDashboard } from './useDashboard'
import { useNotifications } from './useNotifications'

type Feedback = { message: string; trackedProductId: string | null }

function message(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
}

function feedback(error: unknown): Feedback {
  if (!(error instanceof ApiFailure)) return { message: message(error), trackedProductId: null }
  const text = error.retryAfterSeconds === null ? error.message : `${error.message} ${retryHint(error.retryAfterSeconds)}`
  return { message: text, trackedProductId: error.code === 'already_tracked' ? error.trackedProductId : null }
}

// 404 ou 409 tracking_inactive: o vínculo não existe mais para a pessoa (convenção de produto removido).
function trackingGone(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure && (error.status === 404 || error.code === 'tracking_inactive')
}

function unauthenticated(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure && error.status === 401
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
  const [detailMode, setDetailMode] = useState<DetailMode>('detail')
  const [detailStopBusy, setDetailStopBusy] = useState(false)
  const [stopRequest, setStopRequest] = useState<{ id: string; title: string; alertActive: boolean; busy: boolean } | null>(null)
  const [error, setError] = useState<Feedback | null>(null)
  const [selected, setSelected] = useState<TrackedProduct | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyCursor, setHistoryCursor] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const detailOpener = useRef<HTMLElement | null>(null)
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
  const openSequence = useRef(0)
  useEffect(() => { openDetailId.current = selected?.id ?? null }, [selected])

  const endSession = useCallback((failure: ApiFailure) => onUnauthenticated(failure.message), [onUnauthenticated])
  const onDashboardLoaded = useCallback((data: Dashboard, receivedAt: Date) => {
    dispatchList({ type: 'dashboard', page: data.tracked_products, receivedAt })
  }, [])
  const { view: dashboardView, reload: reloadDashboard } = useDashboard({ clock, onLoaded: onDashboardLoaded, onUnauthenticated: endSession })
  const dashboard = dashboardView.status === 'ready' ? dashboardView.data : null
  const loading = dashboardView.status === 'loading'
  const dashboardError = dashboardView.status === 'error' ? dashboardView.message
    : dashboardView.status === 'ready' ? dashboardView.refreshError : null
  // Sem produtos: hero em destaque e seções de produtos ocultas (AC23).
  const isEmpty = dashboard !== null && list.loaded && list.items.length === 0 && list.nextCursor === null
  const knownProducts = useMemo(() => {
    const known = new Map<string, KnownProduct>()
    const all = [...(dashboard?.opportunities ?? []), ...list.items.map((entry) => entry.tracked)]
    for (const tracked of all) known.set(tracked.id, { title: tracked.product.title, imageUrl: tracked.product.image_url })
    return known
  }, [dashboard, list.items])
  const showProductSections = !isEmpty && dashboardView.status !== 'error'
  const notifications = useNotifications({ clock, onUnauthenticated: endSession })
  const focusAlertsHeading = useCallback(() => alertsHeading.current?.focus(), [])

  // Ao fechar o detalhe, o foco volta ao elemento que o abriu; se ele saiu da página, ao título da lista
  // (ou ao campo de link, sem lista). O foco inicial dentro do diálogo é do próprio ProductDetailDialog.
  useEffect(() => {
    if (detailOpen) return
    setDetailMode('detail')
    const opener = detailOpener.current
    detailOpener.current = null
    if (!opener) return
    if (opener.isConnected) opener.focus()
    else (trackedHeading.current ?? linkInput.current)?.focus()
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

  async function track(url: string): Promise<boolean> {
    setTrackError(null)
    setTrackSuccess(null)
    setSubmitting(true)
    try {
      const result = await api.track(url)
      dispatchList({ type: 'upsert', tracked: result.tracked, receivedAt: clock() })
      setTrackSuccess(result.outcome === 'created' ? 'Produto adicionado ao monitoramento.' : 'Você voltou a monitorar este produto.')
      // Indicadores recalculados pela API; a lista já carregada permanece.
      void reloadDashboard()
      return true
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else setTrackError(feedback(failure))
      return false
    } finally { setSubmitting(false) }
  }

  async function open(id: string) {
    const opening = !selected
    if (opening && document.activeElement instanceof HTMLElement) detailOpener.current = document.activeElement
    setError(null)
    // Vale a última abertura: resposta de uma abertura anterior que chega depois é descartada.
    const current = ++openSequence.current
    try {
      const [detail, priceHistory] = await Promise.all([api.detail(id), api.history(id)])
      if (current !== openSequence.current) return
      setSelected(detail)
      setHistory(priceHistory.items)
      setHistoryCursor(priceHistory.next_cursor)
    } catch (failure) {
      if (current !== openSequence.current) return
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

  // Falha de ação no detalhe: produto que deixou de existir fecha o detalhe e segue a convenção
  // de produto removido; as demais falhas aparecem no próprio detalhe.
  function failInDetail(id: string, failure: unknown): boolean {
    if (!trackingGone(failure)) { fail(failure); return false }
    detailOpener.current = null
    setSelected(null)
    removeTracked(id, failure.message)
    recalculate()
    return true
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
    } catch (failure) { failInDetail(selected.id, failure) }
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
    } catch (failure) { failInDetail(selected.id, failure) }
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
    } catch (failure) { failInDetail(selected.id, failure) }
    finally { setBusy(false) }
  }

  // Confirmação dentro do detalhe: sucesso fecha o detalhe e aplica a convenção de produto removido;
  // falha volta ao conteúdo do detalhe com o erro anunciado e foco em “Parar de monitorar”.
  async function confirmDetailStop() {
    if (!selected || detailStopBusy) return
    const id = selected.id
    setDetailStopBusy(true)
    const failure = await stopTrackingRequest(id)
    setDetailStopBusy(false)
    if (failure) {
      setError({ message: failure, trackedProductId: null })
      setDetailMode('detail')
      return
    }
    detailOpener.current = null
    setSelected(null)
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
      if (failInDetail(id, failure)) return
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
      else if (trackingGone(failure)) failInDetail(id, failure)
    }
  }

  // Lista carregada vazia com próxima página (ex.: todos os itens da 1ª página saíram): busca a
  // página seguinte em vez de mostrar uma tabela vazia. Uma falha para aqui e mostra a mensagem.
  const listNeedsNextPage = list.loaded && list.items.length === 0 && list.nextCursor !== null && !loadingMore && !loadMoreError
  useEffect(() => {
    if (listNeedsNextPage) void loadMore()
    // loadMore lê o cursor atual; a condição acima evita repetição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listNeedsNextPage])

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
    forgetRow(id)
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
      if (trackingGone(failure)) {
        removeTracked(id, failure.message)
        recalculate()
        return
      }
      text = feedback(failure).message
      // 429 mantém os dados; nas demais falhas o backend registra a tentativa e a linha é recarregada.
      if (!(failure instanceof ApiFailure && failure.status === 429)) await reloadRow(id)
    }
    recalculate()
    // Produto removido durante a consulta (ex.: parado pelo detalhe): não grava estado nem foco da linha.
    if (!isListed(id)) { forgetRow(id); return }
    setRow(id, { busy: false, message: text })
    setPendingFocus({ kind: 'rowMenu', id })
  }

  function forgetRow(id: string) {
    setRowStates((states) => {
      const next = { ...states }
      delete next[id]
      return next
    })
  }

  function isListed(id: string): boolean {
    return listRef.current.items.some((entry) => entry.tracked.id === id)
  }

  async function reloadRow(id: string) {
    try {
      const latest = await api.detail(id)
      dispatchList({ type: 'replace', tracked: latest, receivedAt: clock() })
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
    }
  }

  function requestStop(id: string) {
    const entry = listRef.current.items.find((item) => item.tracked.id === id)
    if (!entry) return
    setStopRequest({ id, title: entry.tracked.product.title, alertActive: Boolean(entry.tracked.alert?.enabled), busy: false })
  }

  function cancelStop() {
    if (!stopRequest) return
    const id = stopRequest.id
    setStopRequest(null)
    setPendingFocus({ kind: 'rowMenu', id })
  }

  /** DELETE do vínculo; devolve a mensagem de erro (produto mantido) ou null quando o produto saiu da lista. */
  async function stopTrackingRequest(id: string): Promise<string | null> {
    try {
      await api.stop(id)
      removeTracked(id, 'Você parou de monitorar este produto.')
      void reloadDashboard()
      return null
    } catch (failure) {
      if (unauthenticated(failure)) { endSession(failure); return null }
      // 404: o vínculo já não existe para a pessoa — segue a convenção de produto removido (plano D10).
      if (failure instanceof ApiFailure && failure.status === 404) {
        removeTracked(id, failure.message)
        void reloadDashboard()
        return null
      }
      return feedback(failure).message
    }
  }

  async function confirmStop() {
    if (!stopRequest || stopRequest.busy) return
    const id = stopRequest.id
    setStopRequest({ ...stopRequest, busy: true })
    const failure = await stopTrackingRequest(id)
    setStopRequest(null)
    if (failure && isListed(id)) {
      setRow(id, { busy: false, message: failure })
      setPendingFocus({ kind: 'rowMenu', id })
    }
  }

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
    <HeroTrackForm onSubmit={track} submitting={submitting}
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
        {dashboardError && <div className="region-error">
          <p role="alert" className="error-box">{dashboardError}</p>
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
        {dashboardView.status === 'ready' && <RecentUpdatesTimeline events={dashboardView.data.recent_updates}
          receivedAt={dashboardView.receivedAt} known={knownProducts} onOpen={(id) => void open(id)} />}
      </section>}

      <AlertsSection notifications={notifications.all} headingRef={alertsHeading} focusHeading={focusAlertsHeading}
        onMarkRead={notifications.markRead} onLoadMore={() => void notifications.loadMoreAll()} onRetry={() => void notifications.reloadAll()} />
    </div>
    </main>

    {stopRequest && <ConfirmStopDialog title={stopRequest.title} alertActive={stopRequest.alertActive} busy={stopRequest.busy}
      onCancel={cancelStop} onConfirm={() => void confirmStop()} />}

    {selected && <ProductDetailDialog tracked={selected} history={history} historyCursor={historyCursor} busy={busy} error={error?.message ?? null}
      target={target} onTargetChange={setTarget} onClose={closeDetail} onRefresh={() => void refreshSelected()}
      onLoadMoreHistory={() => void loadMoreHistory()} onCreateAlert={(event) => void createAlert(event)}
      onUpdateAlert={() => void updateAlert()} onRemoveAlert={() => void removeAlert()}
      mode={detailMode} stopBusy={detailStopBusy} onRequestStop={() => { setError(null); setDetailMode('confirm') }}
      onCancelStop={() => setDetailMode('detail')} onConfirmStop={() => void confirmDetailStop()} />}
  </>
}
