import { useId } from 'react'
import { useDisclosure } from '../lib/focus'
import { ExternalListingLink } from './ExternalListingLink'
import { MoreIcon } from './Icons'

type Props = {
  id: string
  title: string
  href: string
  disabled: boolean
  onRefresh: () => void
  onStop: () => void
}

/** Menu de ações da linha (disclosure, sem setas). O botão recebe o foco de volta ao fim das ações da linha. */
export function RowActionsMenu({ id, title, href, disabled, onRefresh, onStop }: Props) {
  const menu = useDisclosure()
  const panelId = useId()
  function select(action: () => void) {
    menu.close()
    action()
  }
  return <div className="disclosure row-menu" ref={menu.containerRef} onKeyDown={menu.onKeyDown} onBlur={menu.onBlur}>
    <button ref={menu.buttonRef} type="button" className="icon-button row-menu-button" data-row-menu={id} disabled={disabled}
      aria-expanded={menu.open} aria-controls={panelId} onClick={menu.toggle}>
      <MoreIcon /><span className="sr-only">Ações de {title}</span>
    </button>
    {menu.open && <div id={panelId} ref={menu.panelRef} role="group" aria-label={`Ações de ${title}`} className="disclosure-panel row-menu-panel">
      <button type="button" className="panel-item" onClick={() => select(onRefresh)}>Atualizar agora</button>
      <ExternalListingLink href={href} className="panel-item" onClick={() => menu.close()} />
      <button type="button" className="panel-item" onClick={() => select(onStop)}>Parar de monitorar</button>
    </div>}
  </div>
}
