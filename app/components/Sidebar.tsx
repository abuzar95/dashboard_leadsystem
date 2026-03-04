'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', adminOnly: true },
  { href: '/prospects', label: 'Prospects', icon: '📋', adminOnly: true },
  { href: '/dcr', label: 'DC&R Dashboard', icon: '📊', dcROnly: true },
  { href: '/lh', label: 'LH Dashboard', icon: '📈', lhOnly: true },
  { href: '/users', label: 'Users & Roles', icon: '👥', adminOnly: true },
  { href: '/skills', label: 'Skills', icon: '🛠️', adminOnly: true },
  { href: '/linkedin-profiles', label: 'LinkedIn Profiles', icon: '💼', adminOnly: true },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  onNavClick?: () => void
}

export default function Sidebar({ open = false, onClose, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isDCR = user?.role === 'DC_R'
  const isLH = user?.role === 'LH'
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    if ((item as { dcROnly?: boolean }).dcROnly) return isDCR
    if ((item as { lhOnly?: boolean }).lhOnly) return isLH
    return true
  })

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleNavClick = () => {
    onNavClick?.()
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">Lead System</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <span className="sidebar-user" title={user.email}>
            {user.username || user.email}
          </span>
        )}
        <button type="button" className="sidebar-link logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
