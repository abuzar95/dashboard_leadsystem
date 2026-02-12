'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Prospects', icon: '📋' },
  { href: '/users', label: 'Users & Roles', icon: '👥' },
  { href: '/skills', label: 'Skills', icon: '🛠️' },
  { href: '/linkedin-profiles', label: 'LinkedIn Profiles', icon: '💼' },
]

export default function Sidebar() {
  const pathname = usePathname()

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
    </aside>
  )
}
