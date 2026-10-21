import { useId, useLayoutEffect, useRef } from 'react'
import { useModalFocus } from '../lib/focus'
import { StopTrackingConfirm } from './StopTrackingConfirm'

type Props = { title: string; alertActive: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void }

/** Confirmação pela linha: alertdialog modal; Cancelar, Esc ou clique fora não enviam requisição. */
export function ConfirmStopDialog({ title, alertActive, busy, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useModalFocus(true, dialog, cancel, onCancel)
  useLayoutEffect(() => { cancel.current?.focus() }, [])
  return <div className="dialog-backdrop" role="presentation" data-testid="confirm-backdrop"
    // preventDefault: sem ele, a ação padrão do mousedown levava o foco ao body depois do cancelamento.
    onMouseDown={(event) => { event.preventDefault(); onCancel() }}>
    <div ref={dialog} className="confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
      onMouseDown={(event) => event.stopPropagation()}>
      <StopTrackingConfirm title={title} alertActive={alertActive} busy={busy} cancelRef={cancel}
        onCancel={onCancel} onConfirm={onConfirm} ids={{ title: titleId, description: descriptionId }} />
    </div>
  </div>
}
