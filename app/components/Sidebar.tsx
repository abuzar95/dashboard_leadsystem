'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { href: '/', label: 'Prospects', icon: '📋' },
  { href: '/users', label: 'Users & Roles', icon: '👥' },
  { href: '/skills', label: 'Skills', icon: '🛠️' },
  { href: '/linkedin-profiles', label: 'LinkedIn Profiles', icon: '💼' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

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
