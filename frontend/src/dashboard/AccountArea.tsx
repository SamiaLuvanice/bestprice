import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiFailure, type Dashboard, type HistoryEntry, type TrackedProduct, type User } from '../api'
import { retryHint } from '../lib/format'
import { targetPriceInput } from '../lib/targetPrice'
import { AlertsSection } from './AlertsSection'
import { AppHeader, type SectionKey } from './AppHeader'
import { ConfirmStopDialog } from './ConfirmStopDialog'
import { ConfiguredAlerts } from './ConfiguredAlerts'
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

/** Texto inicial do campo de alvo: o valor atual com vírgula, ou vazio sem alerta. */
function alertTarget(tracked: TrackedProduct): string {
  return tracked.alert ? targetPriceInput(tracked.alert.target_price) : ''
}

function unauthenticated(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure && error.status === 401
}

type PendingFocus = { kind: 'rowMenu'; id: string } | { kind: 'rowDetails'; id: string } | { kind: 'productsHeading' } | { kind: 'linkInput' } | null

type Props = {
  user: User
  clock: () => Date
  /** 401 em qualquer chamada: encerra a sessão local e mostra a entrada (0011) com a mensagem da API. */
  onUnauthenticated: (message: string) => void
  onLoggedOut: () => void
}

/** Área autenticada: orquestra estado e ações; componentes de apresentação não chamam fetch. */
export function AccountArea({ user, clock, onUnauthenticated, onLoggedOut }: Props) {
  const location = useLocation()
  const navigateTo = useNavigate()
  const detailId = location.pathname.startsWith('/produtos/') ? location.pathname.slice('/produtos/'.length) : null
  const currentSection: SectionKey = location.pathname === '/alertas' ? 'alerts' : location.pathname.startsWith('/produtos') ? 'products' : 'home'
  const [list, dispatchList] = useReducer(trackedListReducer, initialTrackedList)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  // Lista mais recente para ações assíncronas que decidem foco depois de a resposta chegar.
  const listRef = useRef(list)
  useEffect(() => { listRef.current = list }, [list])
  const [submitting, setSubmitting] = useState(false)
  const [trackError, setTrackError] = useState<TrackFeedback | null>(null)
  const [trackSuccess, setTrackSuccess] = useState<string | null>(null)
  const [trackSuccessId, setTrackSuccessId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({})
  const [productsMessage, setProductsMessage] = useState<string | null>(null)
  const [globalMessage, setGlobalMessage] = useState<string | null>(null)
  const [pendingFocus, setPendingFocus] = useState<PendingFocus>(null)
  const [focusAfterStop, setFocusAfterStop] = useState(false)
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
  // Em Produtos, o h1 "Seus produtos" é ao mesmo tempo o título da página e o da lista.
  const productsHeading = useCallback((element: HTMLHeadingElement | null) => {
    trackedHeading.current = element
    pageHeading.current = element
  }, [])
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const detailOpen = selected !== null
  // Produto do diálogo aberto, lido por requisições que terminam depois de a pessoa fechar ou trocar o detalhe.
  const openDetailId = useRef<string | null>(null)
  const openSequence = useRef(0)
  const detailStopSequence = useRef(0)
  useEffect(() => { openDetailId.current = selected?.id ?? null }, [selected])

  const endSession = useCallback((failure: ApiFailure) => {
    if (mounted.current) onUnauthenticated(failure.message)
  }, [onUnauthenticated])
  const onDashboardLoaded = useCallback((data: Dashboard, receivedAt: Date) => {
    dispatchList({ type: 'dashboard', page: data.tracked_products, receivedAt })
  }, [])
  const { view: dashboardView, reload: reloadDashboard } = useDashboard({
    clock, enabled: !detailId && currentSection !== 'alerts', onLoaded: onDashboardLoaded, onUnauthenticated: endSession,
  })
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
  const notifications = useNotifications({ clock, onUnauthenticated: endSession, loadAll: currentSection === 'alerts' })
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
    } else if (pendingFocus.kind === 'rowDetails') {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-row-details]'))
      buttons.find((button) => button.dataset.rowDetails === pendingFocus.id)?.focus()
    } else if (pendingFocus.kind === 'productsHeading') {
      (trackedHeading.current ?? linkInput.current)?.focus()
    } else {
      linkInput.current?.focus()
    }
  }, [pendingFocus])


  // Somente 401 encerra a sessão BestPrice; falhas da integração (503) e de rede mantêm a pessoa no painel.
  const fail = useCallback((failure: unknown) => {
    if (unauthenticated(failure)) { endSession(failure); return }
    setError(feedback(failure))
  }, [endSession])

  async function loadMore(fromUser = false) {
    if (!list.nextCursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await api.tracked(list.nextCursor)
      const known = new Set(listRef.current.items.map((entry) => entry.tracked.id))
      dispatchList({ type: 'append', page, receivedAt: clock() })
      // O botão fica desabilitado durante a carga (e some na última página), o que tira o foco dele:
      // em qualquer página, o foco vai ao primeiro item novo (ou ao título, se nada novo chegou).
      if (fromUser) {
        const added = page.items.find((tracked) => !known.has(tracked.id))
        setPendingFocus(added ? { kind: 'rowDetails', id: added.id } : { kind: 'productsHeading' })
      }
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else setLoadMoreError(message(failure))
    } finally { setLoadingMore(false) }
  }

  async function track(url: string): Promise<boolean> {
    setTrackError(null)
    setTrackSuccess(null)
    setTrackSuccessId(null)
    setSubmitting(true)
    try {
      const result = await api.track(url)
      dispatchList({ type: 'upsert', tracked: result.tracked, receivedAt: clock() })
      setTrackSuccess(result.outcome === 'created' ? 'Produto adicionado ao monitoramento.' : 'Você voltou a monitorar este produto.')
      setTrackSuccessId(result.tracked.id)
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
    setError(null)
    setSelected(null)
    setHistory([])
    setHistoryCursor(null)
    setTarget('')
    // Vale a última abertura: resposta de uma abertura anterior que chega depois é descartada.
    const current = ++openSequence.current
    try {
      const [detail, priceHistory] = await Promise.all([api.detail(id), api.history(id)])
      if (current !== openSequence.current) return
      setSelected(detail)
      setTarget(alertTarget(detail))
      setHistory(priceHistory.items)
      setHistoryCursor(priceHistory.next_cursor)
    } catch (failure) {
      if (current !== openSequence.current) return
      // Se o diálogo não chegou a abrir, não há foco a devolver depois.
      if (unauthenticated(failure)) { endSession(failure); return }
      setError(failure instanceof ApiFailure && (failure.status === 404 || failure.status === 422)
        ? { message: 'Produto não encontrado ou indisponível.', trackedProductId: null } : feedback(failure))
    }
  }

  async function loadMoreHistory() {
    if (!selected || !historyCursor) return
    const id = selected.id
    const cursor = historyCursor
    const sequence = openSequence.current
    setBusy(true)
    setError(null)
    try {
      const page = await api.history(id, cursor)
      if (!mounted.current || sequence !== openSequence.current || openDetailId.current !== id ||
        window.location.pathname !== `/produtos/${id}`) return
      setHistory((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setHistoryCursor(page.next_cursor)
    } catch (failure) {
      if (unauthenticated(failure)) endSession(failure)
      else if (mounted.current && sequence === openSequence.current && openDetailId.current === id &&
        window.location.pathname === `/produtos/${id}`) fail(failure)
    } finally {
      if (mounted.current && sequence === openSequence.current && openDetailId.current === id) setBusy(false)
    }
  }

  // Fecha o detalhe de um produto que deixou de ser monitorado e aplica a convenção de produto removido.
  // Só fecha o diálogo se ele ainda mostra este produto: a pessoa pode ter trocado de produto
  // durante a requisição. A linha sai da lista em qualquer caso.
  function closeAsRemoved(id: string, text: string) {
    if (openDetailId.current === id) {
      detailOpener.current = null
      setSelected(null)
      if (detailId === id) navigateTo('/produtos', { replace: true })
    }
    removeTracked(id, text)
    recalculate()
  }

  // Detalhe recarregado após uma ação: atualiza o diálogo e a linha. Parar é soft delete, então um
  // detalhe 200 com active=false (parado em outra aba) também fecha o diálogo. Devolve se continua aberto.
  // `resetTarget`: só criar, salvar alvo e excluir reescrevem o campo; pausar/retomar preserva o rascunho.
  async function reloadSelected(id: string, resetTarget = false): Promise<boolean> {
    const detail = await api.detail(id)
    if (!detail.active) { closeAsRemoved(id, 'Monitoramento interrompido.'); return false }
    // Fechado (ou trocado) durante a ação: atualiza só a linha, sem reabrir o detalhe.
    if (openDetailId.current === id) {
      setSelected(detail)
      if (resetTarget) setTarget(alertTarget(detail))
    }
    dispatchList({ type: 'replace', tracked: detail, receivedAt: clock() })
    return true
  }

  // Falha de ação no detalhe: produto que deixou de existir fecha o detalhe e segue a convenção
  // de produto removido; as demais falhas aparecem no próprio detalhe.
  function failInDetail(id: string, failure: unknown): boolean {
    if (!trackingGone(failure)) { fail(failure); return false }
    closeAsRemoved(id, failure.message)
    return true
  }

  // 404 vindo de /alert significa “alerta não encontrado” (excluído em outra aba), não produto
  // removido: o detalhe é recarregado e só sai da tela se o vínculo também tiver deixado de existir.
  async function recoverFromAlertFailure(id: string, failure: unknown) {
    if (!(failure instanceof ApiFailure && failure.status === 404)) { failInDetail(id, failure); return }
    try {
      if (await reloadSelected(id) && openDetailId.current === id) {
        setError({ message: failure.message, trackedProductId: null })
        recalculate()
      }
    } catch (reloadFailure) { failInDetail(id, reloadFailure) }
  }

  // Depois de uma ação de alerta concluída: detalhe, indicadores e contador do sino recalculados.
  async function afterAlertAction(id: string, resetTarget: boolean) {
    try {
      if (!await reloadSelected(id, resetTarget)) return
      await reloadDashboard()
      await notifications.refreshAfterAction()
    } catch (failure) { failInDetail(id, failure) }
  }

  // O alvo chega normalizado pelo detalhe (`"99.90"`); entrada inválida nem chama a API (0028/AC02).
  async function createAlert(targetPrice: string) {
    if (!selected) return
    setBusy(true)
    setError(null)
    const id = selected.id
    try {
      await api.createAlert(id, targetPrice)
      await afterAlertAction(id, true)
    } catch (failure) { failInDetail(id, failure) }
    finally { setBusy(false) }
  }

  // Cada controle do alerta tem uma única função (0028/AC06): salvar alvo ou pausar/retomar.
  async function updateAlert(update: { target_price: string } | { enabled: boolean }) {
    if (!selected?.alert) return
    setBusy(true)
    setError(null)
    const id = selected.id
    try {
      await api.updateAlert(id, update)
    } catch (failure) {
      await recoverFromAlertFailure(id, failure)
      setBusy(false)
      return
    }
    await afterAlertAction(id, 'target_price' in update)
    setBusy(false)
  }

  async function removeAlert() {
    if (!selected) return
    setBusy(true)
    setError(null)
    const id = selected.id
    try {
      await api.deleteAlert(id)
    } catch (failure) {
      await recoverFromAlertFailure(id, failure)
      setBusy(false)
      return
    }
    await afterAlertAction(id, true)
    setBusy(false)
  }

  // Confirmação dentro do detalhe: sucesso fecha o detalhe e aplica a convenção de produto removido;
  // falha volta ao conteúdo do detalhe com o erro anunciado e foco em “Parar de monitorar”.
  async function confirmDetailStop() {
    if (!selected || detailStopBusy) return
    const id = selected.id
    const sequence = detailStopSequence.current
    setDetailStopBusy(true)
    const failure = await stopTrackingRequest(id)
    if (!mounted.current || sequence !== detailStopSequence.current || openDetailId.current !== id ||
      window.location.pathname !== `/produtos/${id}`) return
    setDetailStopBusy(false)
    if (failure) {
      setError({ message: failure, trackedProductId: null })
      setDetailMode('detail')
      window.setTimeout(() => document.querySelector<HTMLElement>('.detail-actions button')?.focus(), 0)
      return
    }
    detailOpener.current = null
    setSelected(null)
    setFocusAfterStop(true)
    navigateTo('/produtos')
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
        if (!detail.active) { closeAsRemoved(id, 'Monitoramento interrompido.'); return }
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
    const otherDialogOpen = openDetailId.current !== null && openDetailId.current !== id
    if (remaining > 0 || current.nextCursor !== null) {
      setGlobalMessage(null)
      setProductsMessage(text)
      if (!otherDialogOpen && !detailId) setPendingFocus({ kind: 'productsHeading' })
    } else {
      setProductsMessage(null)
      setGlobalMessage(text)
      if (!otherDialogOpen && !detailId) setPendingFocus({ kind: 'linkInput' })
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
      if (!mounted.current) return null
      removeTracked(id, 'Você parou de monitorar este produto.')
      void reloadDashboard()
      return null
    } catch (failure) {
      if (!mounted.current) return message(failure)
      if (unauthenticated(failure)) { endSession(failure); return failure.message }
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

  useEffect(() => {
    ++detailStopSequence.current
    setDetailStopBusy(false)
    setBusy(false)
    setDetailMode('detail')
    if (detailId) void open(detailId)
    else { ++openSequence.current; setSelected(null) }
    // A URL é a fonte da seleção; mudanças locais de dados não devem recarregar o detalhe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId])

  useEffect(() => {
    document.title = currentSection === 'home' ? 'Início · BestPrice' : currentSection === 'alerts'
      ? 'Alertas · BestPrice' : detailId ? 'Produto · BestPrice' : 'Produtos · BestPrice'
    const frame = window.requestAnimationFrame(() => {
      if (detailId) document.getElementById('detail-title')?.focus()
      else if (currentSection === 'alerts') document.getElementById('alerts-page-title')?.focus()
      else pageHeading.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, currentSection, detailId])

  const selectedId = selected?.id
  const selectedTitle = selected?.id === detailId ? selected.product.title : null
  useEffect(() => {
    if (selectedTitle) document.title = `${selectedTitle} · BestPrice`
  }, [selectedTitle])
  useEffect(() => {
    if (selectedId && selectedId === detailId) {
      document.getElementById('detail-title')?.focus()
    }
  }, [selectedId, detailId])
  useEffect(() => {
    if (detailId && error && !selected) {
      document.title = 'Produto indisponível · BestPrice'
      document.querySelector<HTMLElement>('.region-error h1')?.focus()
    }
  }, [detailId, error, selected])

  useEffect(() => {
    if (!focusAfterStop || location.pathname !== '/produtos' || !list.loaded || loading) return
    setFocusAfterStop(false)
    if (list.items.length > 0) trackedHeading.current?.focus()
    else linkInput.current?.focus()
  }, [focusAfterStop, location.pathname, list.loaded, list.items.length, loading])

  // Campo de link: hero do Início ou, em Produtos, ação abaixo do título único "Seus produtos".
  function trackForm(embedded: boolean) {
    return <HeroTrackForm onSubmit={track} submitting={submitting}
      error={trackError} success={trackSuccess} successId={trackSuccessId} headingRef={embedded ? undefined : pageHeading}
      inputRef={linkInput} priority={isEmpty} embedded={embedded} compact={embedded && !isEmpty}
      onDismissFeedback={() => { setTrackError(null); setTrackSuccess(null); setTrackSuccessId(null) }}>
      {isEmpty && <div className="empty-state">
        <p className="empty-title">Você ainda não está acompanhando nenhum produto.</p>
        <p>Encontre um produto no Mercado Livre, copie o link do anúncio e cole acima. O BestPrice acompanha as alterações para você.</p>
      </div>}
    </HeroTrackForm>
  }

  return <>
    <AppHeader key={location.pathname} email={user.email} current={currentSection}
      bell={<NotificationBell unread={notifications.unread} onRetry={notifications.reloadUnread}
        onMarkRead={notifications.markRead} />}
      logoutError={logoutError} loggingOut={loggingOut} onLogout={() => void logout()} />

    <main id="conteudo" className="page-main">
    {currentSection === 'home' && trackForm(false)}
    <div className="content global-messages">
      <p role="status" data-testid="global-status" className={globalMessage ? 'global-status' : 'sr-only'}>{globalMessage}</p>
      {error && !selected && !detailId && <p role="alert" className="error-box">{error.message}</p>}
    </div>

    {currentSection === 'home' && <div className="content dashboard-content">
      {/* Fora das regiões aria-busy, para o anúncio não ser suprimido. */}
      <p role="status" className={loading ? 'loading-status' : 'sr-only'}>{loading ? 'Carregando seu painel…' : ''}</p>
      {/* 0028/AC09: sem produtos, o convite do hero fica sozinho, sem indicadores zerados. */}
      {(!isEmpty || dashboardError) && <section aria-label="Resumo do monitoramento" className="summary-section" aria-busy={loading}>
        {dashboardError && <div className="region-error">
          <p role="alert" className="error-box">{dashboardError}</p>
          <Button type="button" className="text-button" onClick={() => void reloadDashboard()}>Tentar novamente</Button>
        </div>}
        {loading && <IndicatorsSkeleton />}
        {dashboard && !isEmpty && <><h2 className="overview-title">Visão geral</h2><SummaryIndicators summary={dashboard.summary} /></>}
      </section>}

      {showProductSections && <section aria-labelledby="opportunities-title" className="card-section" aria-busy={loading}>
        <div className="section-heading">
          <h2 id="opportunities-title">Boas oportunidades</h2>
          <p className="section-subtitle">Produtos monitorados que tiveram redução de preço recentemente.</p>
        </div>
        {loading && <OpportunitiesSkeleton />}
        {dashboardView.status === 'ready' && <OpportunityList items={dashboardView.data.opportunities} receivedAt={dashboardView.receivedAt} />}
      </section>}

      {showProductSections && <section aria-labelledby="updates-title" aria-busy={loading}>
        <div className="section-heading"><h2 id="updates-title">Atualizações recentes</h2></div>
        {loading && <TimelineSkeleton />}
        {dashboardView.status === 'ready' && <RecentUpdatesTimeline events={dashboardView.data.recent_updates}
          receivedAt={dashboardView.receivedAt} known={knownProducts} />}
      </section>}
    </div>}

    {currentSection === 'products' && !detailId && <div className="content dashboard-content">
      {dashboardError && <div className="region-error"><p role="alert" className="error-box">{dashboardError}</p>
        <Button type="button" className="text-button" onClick={() => void reloadDashboard()}>Tentar novamente</Button></div>}
      <TrackedProductsTable entries={list.items} rowStates={rowStates} hasMore={list.nextCursor !== null}
        loadingMore={loadingMore} loadMoreError={loadMoreError} onLoadMore={() => void loadMore(true)}
        renderActions={(entry) => <RowActionsMenu id={entry.tracked.id} title={entry.tracked.product.title} href={entry.tracked.product.canonical_url}
          disabled={rowStates[entry.tracked.id]?.busy ?? false} onRefresh={() => void refreshRow(entry.tracked.id)} onStop={() => requestStop(entry.tracked.id)} />}
        message={productsMessage} headingRef={productsHeading} skeleton={loading ? <ProductsSkeleton /> : undefined}
        toolbar={trackForm(true)} />
    </div>}

    {detailId && <div className="content dashboard-content">
      {selected?.id !== detailId && !error && <p role="status">Carregando produto…</p>}
      {selected?.id !== detailId && error && <div className="region-error">
        <h1 tabIndex={-1}>Produto indisponível</h1>
        <p role="alert" className="error-box">{error.message}</p>
        <Button type="button" className="secondary-button" onClick={() => void open(detailId)}>Tentar novamente</Button>
        <Link className="text-button" to="/produtos">Ir para Produtos</Link>
      </div>}
      {selected?.id === detailId && <ProductDetailDialog tracked={selected} history={history} historyCursor={historyCursor} busy={busy} error={error?.message ?? null}
        target={target} onTargetChange={setTarget} onRefresh={() => void refreshSelected()}
        onLoadMoreHistory={() => void loadMoreHistory()} onCreateAlert={(targetPrice) => void createAlert(targetPrice)}
        onSaveTarget={(targetPrice) => void updateAlert({ target_price: targetPrice })}
        onToggleAlert={() => void updateAlert({ enabled: !selected.alert?.enabled })} onRemoveAlert={() => void removeAlert()}
        onRequestStop={() => { setError(null); setDetailMode('confirm') }} />}
    </div>}

    {currentSection === 'alerts' && <div className="content dashboard-content">
      <div className="alerts-page-heading"><h1 id="alerts-page-title" tabIndex={-1}>Alertas</h1><p className="intro">Seus valores desejados e as notificações recentes.</p></div>
      <ConfiguredAlerts onUnauthenticated={(text) => onUnauthenticated(text)} />
      <AlertsSection notifications={notifications.all} headingRef={alertsHeading} focusHeading={focusAlertsHeading}
        onMarkRead={notifications.markRead} onLoadMore={notifications.loadMoreAll} onRetry={() => void notifications.reloadAll()} />
    </div>}
    </main>

    {stopRequest && <ConfirmStopDialog title={stopRequest.title} alertActive={stopRequest.alertActive} busy={stopRequest.busy}
      onCancel={cancelStop} onConfirm={() => void confirmStop()} />}

    {detailId && selected?.id === detailId && detailMode === 'confirm' && <ConfirmStopDialog title={selected.product.title}
      alertActive={Boolean(selected.alert?.enabled)} busy={detailStopBusy}
      onCancel={() => { setDetailMode('detail'); window.setTimeout(() => document.querySelector<HTMLElement>('.detail-actions button')?.focus(), 0) }}
      onConfirm={() => void confirmDetailStop()} />}
  </>
}
