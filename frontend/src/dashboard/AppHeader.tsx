import type { MouseEvent, ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { BoxIcon, BellIcon, BrandIcon, HomeIcon } from './Icons'

export type SectionKey = 'home' | 'products' | 'alerts'

const items: { key: SectionKey; href: string; label: string; icon: ReactNode }[] = [
  { key: 'home', href: '#inicio', label: 'Início', icon: <HomeIcon /> },
  { key: 'products', href: '#seus-produtos', label: 'Produtos', icon: <BoxIcon /> },
  { key: 'alerts', href: '#alertas', label: 'Alertas', icon: <BellIcon /> },
]

type Props = {
  email: string
  current: SectionKey
  onNavigate: (section: SectionKey) => void
  bell?: ReactNode
  logoutError: string | null
  loggingOut: boolean
  onLogout: () => void
}

/** Marca, navegação de página única (aria-current no item ativado), sino e menu da conta. */
export function AppHeader({ email, current, onNavigate, bell, logoutError, loggingOut, onLogout }: Props) {
  function navigate(event: MouseEvent<HTMLAnchorElement>, section: SectionKey) {
    event.preventDefault()
    onNavigate(section)
  }
  return <header className="app-header">
    <div className="app-header-inner">
      <span className="brand"><BrandIcon className="brand-icon" /><span className="brand-name">BestPrice</span></span>
      <nav aria-label="Principal" className="main-nav">
        <ul>
          {items.map((item) => <li key={item.key}>
            <a href={item.href} aria-current={current === item.key ? 'location' : undefined} onClick={(event) => navigate(event, item.key)}>
              {item.icon}<span>{item.label}</span>
            </a>
          </li>)}
        </ul>
      </nav>
      <div className="header-actions">
        {bell}
        <AccountMenu email={email} onLogout={onLogout} loggingOut={loggingOut} />
      </div>
    </div>
    {logoutError && <p role="alert" className="header-error">{logoutError}</p>}
  </header>
}
