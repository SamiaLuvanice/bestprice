import { useId, type Ref } from 'react'

type Props = {
  title: string
  alertActive: boolean
  busy: boolean
  cancelRef: Ref<HTMLButtonElement>
  onCancel: () => void
  onConfirm: () => void
  /** Ids para o diálogo que envolve o conteúdo (aria-labelledby / aria-describedby). */
  ids?: { title: string; description: string }
}

/** Conteúdo da confirmação de “Parar de monitorar”, usado no diálogo da linha e dentro do detalhe. */
export function StopTrackingConfirm({ title, alertActive, busy, cancelRef, onCancel, onConfirm, ids }: Props) {
  const fallbackTitle = useId()
  const fallbackDescription = useId()
  const titleId = ids?.title ?? fallbackTitle
  const descriptionId = ids?.description ?? fallbackDescription
  return <div className="stop-confirm">
    <h2 id={titleId}>Parar de monitorar “{title}”?</h2>
    <div id={descriptionId}>
      <p>O histórico de preços é mantido. Você pode voltar a monitorar colando o link novamente.</p>
      {alertActive && <p>O alerta deste produto será pausado.</p>}
    </div>
    <div className="confirm-actions">
      <button ref={cancelRef} type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
      <button type="button" className="danger-button" disabled={busy} onClick={onConfirm}>Parar de monitorar</button>
    </div>
  </div>
}
