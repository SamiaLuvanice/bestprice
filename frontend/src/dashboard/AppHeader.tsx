import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AccountMenu } from './AccountMenu'
import { BoxIcon, BellIcon, HomeIcon } from './Icons'
import bestPriceLogo from '../assets/logo-bestprice.png'

export type SectionKey = 'home' | 'products' | 'alerts'

const items: { key: SectionKey; href: string; label: string; icon: ReactNode }[] = [
  { key: 'home', href: '/', label: 'Início', icon: <HomeIcon /> },
  { key: 'products', href: '/produtos', label: 'Produtos', icon: <BoxIcon /> },
  { key: 'alerts', href: '/alertas', label: 'Alertas', icon: <BellIcon /> },
]

type Props = {
  email: string
  current: SectionKey
  bell?: ReactNode
  logoutError: string | null
  loggingOut: boolean
  onLogout: () => void
}

/** Marca, navegação de página única (aria-current no item ativado), sino e menu da conta. */
export function AppHeader({ email, current, bell, logoutError, loggingOut, onLogout }: Props) {
  return <header className="app-header">
    <div className="app-header-inner">
      <span className="brand"><img className="brand-logo" src={bestPriceLogo} alt="BestPrice" /><span className="brand-name" aria-hidden="true">BestPrice</span></span>
      <nav aria-label="Principal" className="main-nav">
        <ul>
          {items.map((item) => <li key={item.key}>
            <NavLink to={item.href} aria-current={current === item.key ? 'page' : undefined}>
              {item.icon}<span>{item.label}</span>
            </NavLink>
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
