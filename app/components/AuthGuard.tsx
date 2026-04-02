'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

const ADMIN_ONLY_PATHS = ['/', '/dashboard', '/prospects', '/users', '/skills', '/linkedin-profiles']
const DCR_ONLY_PATHS = ['/dcr']
const LH_ONLY_PATHS = ['/lh']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isLoginPage = pathname === '/login'
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isDCROnlyPath = DCR_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isLHOnlyPath = LH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const searchParamsString = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.search || ''
  }, [pathname])
  const parsedSearchParams = useMemo(
    () => new URLSearchParams(searchParamsString.startsWith('?') ? searchParamsString.slice(1) : searchParamsString),
    [searchParamsString]
  )
  const redirectParam = parsedSearchParams.get('redirect')
  const redirectTarget = redirectParam && redirectParam.startsWith('/') ? redirectParam : null
  const currentPathWithQuery = `${pathname}${parsedSearchParams.toString() ? `?${parsedSearchParams.toString()}` : ''}`

  useEffect(() => {
    if (loading) return
    if (isLoginPage) {
      if (token) {
        if (redirectTarget) router.replace(redirectTarget)
        else {
          const role = user?.role
          if (role === 'admin') router.replace('/dashboard')
          else if (role === 'LH') router.replace('/lh')
          else router.replace('/dcr')
        }
      }
      return
    }
    if (!token) router.replace(`/login?redirect=${encodeURIComponent(currentPathWithQuery)}`)
    else if (isAdminOnlyPath && user?.role !== 'admin') {
      router.replace(user?.role === 'LH' ? '/lh' : '/dcr')
    } else if (isDCROnlyPath && user?.role !== 'admin' && user?.role !== 'DC_R') {
      router.replace('/lh')
    } else if (isLHOnlyPath && user?.role !== 'admin' && user?.role !== 'LH') {
      router.replace('/dcr')
    }
  }, [loading, token, user?.role, isLoginPage, isAdminOnlyPath, isDCROnlyPath, isLHOnlyPath, router, redirectTarget, currentPathWithQuery])

  if (loading) {
    return (
      <div className="auth-loading">
        <span>Loading…</span>
      </div>
    )
  }
  if (isLoginPage) return <>{children}</>
  if (!token) return null

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="dashboard-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
      />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} onNavClick={closeSidebar} />
      <main className="main-content">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {children}
      </main>
    </div>
  )
}
