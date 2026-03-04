'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') router.replace('/dashboard')
    else if (user.role === 'LH') router.replace('/lh')
    else router.replace('/dcr')
  }, [user, router])

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
      <p>Redirecting...</p>
    </div>
  )
}
