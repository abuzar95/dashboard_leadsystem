'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const ALL_NAV_ITEMS = [
  { href: '/', label: 'Prospects', icon: '📋', adminOnly: true },
  { href: '/dcr', label: 'DC&R Dashboard', icon: '📊', nonAdminOnly: true },
  { href: '/users', label: 'Users & Roles', icon: '👥', adminOnly: true },
  { href: '/skills', label: 'Skills', icon: '🛠️', adminOnly: true },
  { href: '/linkedin-profiles', label: 'LinkedIn Profiles', icon: '💼', adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    if ((item as { nonAdminOnly?: boolean }).nonAdminOnly) return !isAdmin
    return true
  })

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Lead System</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
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
