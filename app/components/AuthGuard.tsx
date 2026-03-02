'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

const ADMIN_ONLY_PATHS = ['/', '/users', '/skills', '/linkedin-profiles']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    if (loading) return
    if (isLoginPage) {
      if (token) router.replace(user?.role === 'admin' ? '/' : '/dcr')
      return
    }
    if (!token) router.replace('/login')
    else if (isAdminOnlyPath && user?.role !== 'admin') router.replace('/dcr')
  }, [loading, token, user?.role, isLoginPage, isAdminOnlyPath, router])

  if (loading) {
    return (
      <div className="auth-loading">
        <span>Loading…</span>
      </div>
    )
  }
  if (isLoginPage) return <>{children}</>
  if (!token) return null

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}
