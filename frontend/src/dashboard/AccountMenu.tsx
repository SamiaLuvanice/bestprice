import { Button } from '@/components/ui/button'
import { useId } from 'react'
import { useDisclosure } from '../lib/focus'
import { ChevronDownIcon } from './Icons'

type Props = { email: string; onLogout: () => void; loggingOut: boolean }

/** Menu da conta (disclosure): identifica a pessoa pelo e-mail — o contrato não fornece nome — e oferece Sair. */
export function AccountMenu({ email, onLogout, loggingOut }: Props) {
  const menu = useDisclosure()
  const panelId = useId()
  const initial = email.trim().charAt(0).toUpperCase()
  return <div className="disclosure account-menu" ref={menu.containerRef} onKeyDown={menu.onKeyDown} onBlur={menu.onBlur}>
    <Button variant="ghost" ref={menu.buttonRef} type="button" className="account-button" aria-label={`Conta: ${email}`} aria-expanded={menu.open} aria-controls={panelId} onClick={menu.toggle}>
      {/* #259: a inicial vem do CSS (data-initial) para o texto visível estar contido no nome acessível (WCAG 2.5.3). */}
      <span className="avatar" aria-hidden="true" data-initial={initial} />
      <span className="sr-only">Conta: </span>
      <span className="account-email">{email}</span>
      <ChevronDownIcon className="chevron" />
    </Button>
    {menu.open && <div id={panelId} ref={menu.panelRef} className="disclosure-panel account-panel">
      <p className="account-panel-email">{email}</p>
      <Button variant="ghost" type="button" className="panel-item" disabled={loggingOut} onClick={onLogout}>Sair</Button>
    </div>}
  </div>
}
