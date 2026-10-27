import { useId, useRef } from 'react'
import { Button } from '../../components/ui/button'
import { useModalFocus } from '../../lib/focus'

export function AIInformation() {
  return <aside className="research-disclosure" aria-label="Sobre o processamento por IA">
    <p>Suas mensagens são processadas pelo Google. Na cota gratuita, o conteúdo pode ser usado para melhorar os produtos do fornecedor. Não inclua dados pessoais ou confidenciais.</p>
    <p>As pesquisas são excluídas do BestPrice após 90 dias da criação. Isso não elimina registros do fornecedor nem backups. A IA pode errar: preços, estoque e especificações não são verificados.</p>
  </aside>
}

export function ResearchError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return <div className="research-error"><p role="alert">{text}</p>{onRetry && <Button variant="outline" onClick={onRetry}>Tentar novamente</Button>}</div>
}

export function DeleteResearchDialog({ title, busy, error, onCancel, onConfirm }: {
  title: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useModalFocus(true, dialog, cancel, () => { if (!busy) onCancel() })
  return <div className="dialog-backdrop" role="presentation">
    <div ref={dialog} className="confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <h2 id={titleId}>Excluir pesquisa?</h2><p id={descriptionId}>“{title}” será removida, junto com suas mensagens ou análise. Essa ação não pode ser desfeita.</p>
      {error && <p role="alert">{error}</p>}
      <div className="research-actions"><Button ref={cancel} variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button>
        <Button variant="destructive" disabled={busy} onClick={onConfirm}>{busy ? 'Excluindo…' : 'Excluir pesquisa'}</Button></div>
    </div>
  </div>
}
