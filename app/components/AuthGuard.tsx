'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (loading) return
    if (isLoginPage) {
      if (token) router.replace('/')
      return
    }
    if (!token) router.replace('/login')
  }, [loading, token, isLoginPage, router])

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
