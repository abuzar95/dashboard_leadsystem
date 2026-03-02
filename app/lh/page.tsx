'use client'

import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface LHStats {
  totalAssignedProspects: number
  totalLCProspects: number
  totalLNCProspects: number
  todaysTasks: number
}

interface CategoryCount {
  category: string
  count: number
}

const formatCategory = (c: string) => (c === 'Uncategorized' ? c : c.replace(/_/g, '-'))

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
}

export default function LHDashboardPage() {
  const { user } = useAuth()
  const [lhStats, setLhStats] = useState<LHStats | null>(null)
  const [categoryChartData, setCategoryChartData] = useState<CategoryCount[]>([])
  const [categoryChartMinLeadScore, setCategoryChartMinLeadScore] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [categoryChartLoading, setCategoryChartLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = () => {
    setError(null)
    api.get('/stats/lh').then((r) => setLhStats(r.data)).catch(() => setLhStats(null))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get('/stats/lh')
      .then((r) => {
        if (!cancelled) setLhStats(r.data)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load LH stats')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const params = categoryChartMinLeadScore.trim()
      ? `?minLeadScore=${encodeURIComponent(categoryChartMinLeadScore.trim())}`
      : ''
    setCategoryChartLoading(true)
    api
      .get(`/stats/prospects-by-category${params}`)
      .then((r) => setCategoryChartData(r.data))
      .catch(() => setCategoryChartData([]))
      .finally(() => setCategoryChartLoading(false))
  }, [categoryChartMinLeadScore])

  if (loading) {
    return <p style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading stats…</p>
  }
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
        <button
          type="button"
          onClick={fetchStats}
          style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>LH Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your assigned prospects and follow-ups.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Refresh
        </button>
      </header>

      {/* Statistics (DB aggregation) */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Statistics</h2>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Assigned Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{lhStats?.totalAssignedProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LC Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>{lhStats?.totalLCProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LNC Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>{lhStats?.totalLNCProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#4f46e5' }}>{lhStats?.todaysTasks ?? '—'}</div>
          </div>
        </div>
      </section>

      {/* Prospects by Category */}
      <section style={{ marginBottom: '30px', ...cardStyle, padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Prospects by Category</h2>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }} htmlFor="lh-category-min-score">
            Min lead score:
          </label>
          <input
            id="lh-category-min-score"
            type="number"
            min={0}
            max={100}
            placeholder="Any"
            value={categoryChartMinLeadScore}
            onChange={(e) => setCategoryChartMinLeadScore(e.target.value)}
            style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
          />
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {categoryChartMinLeadScore.trim() ? `Only prospects with lead_score ≥ ${categoryChartMinLeadScore}` : 'Showing all prospects'}
          </span>
        </div>
        {categoryChartLoading ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading chart…</p>
        ) : categoryChartData.length === 0 ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data for this filter.</p>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData.map((d) => ({ ...d, name: formatCategory(d.category) }))}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | undefined) => [value ?? 0, 'Prospects']}
                  labelFormatter={(label) => `Category: ${label}`}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
