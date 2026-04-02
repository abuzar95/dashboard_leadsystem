'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login: doLogin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectTarget = redirectParam && redirectParam.startsWith('/') ? redirectParam : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!login.trim() || !password) {
      setError('Enter username or email and password.')
      return
    }
    setSubmitting(true)
    try {
      const user = await doLogin(login.trim(), password)
      if (redirectTarget) router.replace(redirectTarget)
      else {
        const role = user?.role
        if (role === 'admin') router.replace('/dashboard')
        else if (role === 'LH') router.replace('/lh')
        else router.replace('/dcr')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Lead System</h1>
        <p className="login-subtitle">Sign in to the dashboard</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login">Username or email</label>
            <input
              id="login"
              type="text"
              className="form-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              placeholder="Username or email"
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              disabled={submitting}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
