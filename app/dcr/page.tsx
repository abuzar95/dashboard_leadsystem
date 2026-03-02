'use client'

import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  new:              { bg: '#e3f2fd', text: '#1565c0' },
  data_refined:     { bg: '#f3e5f5', text: '#7b1fa2' },
  use_in_campaign:  { bg: '#fff8e1', text: '#f57f17' },
  pitch:            { bg: '#e8f5e9', text: '#2e7d32' },
  LNC:              { bg: '#fce4ec', text: '#c62828' },
  B_LNC:            { bg: '#fbe9e7', text: '#d84315' },
  LC:               { bg: '#e0f7fa', text: '#00838f' },
  B_LC:             { bg: '#e0f2f1', text: '#00695c' },
  COMMUNICATION:    { bg: '#ede7f6', text: '#4527a0' },
  TRASH:            { bg: '#efebe9', text: '#4e342e' },
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New', data_refined: 'Data Refined', use_in_campaign: 'Use in Campaign', pitch: 'Pitch',
  LNC: 'LNC', B_LNC: 'B-LNC', LC: 'LC', B_LC: 'B-LC', COMMUNICATION: 'Communication', TRASH: 'Trash',
}

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4445']

interface DCRStats {
  totalProspects: number
  todaysProspects: number
  thisWeeksProspects: number
  assignedLeads: number
}

interface UserActivityItem {
  userId: string
  name: string
  email: string | null
  today: number
  thisWeek: number
  thisMonth: number
}

interface StageConversion { lncToLcToday: number; lncToLcAllTime: number }

interface StageCount { stage: string; count: number }

interface ProspectsByStage { total: number; byStage: StageCount[] }

interface TopSource { source: string; count: number }

interface CategoryCount { category: string; count: number }

const formatSource = (s: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
const formatCategory = (c: string) => c === 'Uncategorized' ? c : c.replace(/_/g, '-')

const cardStyle = {
  background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
}

export default function DCRDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DCRStats | null>(null)
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([])
  const [stageConversion, setStageConversion] = useState<StageConversion | null>(null)
  const [prospectsByStage, setProspectsByStage] = useState<ProspectsByStage | null>(null)
  const [topSources, setTopSources] = useState<TopSource[]>([])
  const [categoryChartData, setCategoryChartData] = useState<CategoryCount[]>([])
  const [categoryChartMinLeadScore, setCategoryChartMinLeadScore] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [categoryChartLoading, setCategoryChartLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = () => {
    setError(null)
    api.get('/stats/dc-r').then((r) => setStats(r.data)).catch(() => setStats(null))
    api.get('/stats/user-activity').then((r) => setUserActivity(r.data)).catch(() => setUserActivity([]))
    api.get('/stats/stage-conversion').then((r) => setStageConversion(r.data)).catch(() => setStageConversion(null))
    api.get('/stats/prospects-by-stage').then((r) => setProspectsByStage(r.data)).catch(() => setProspectsByStage(null))
    api.get('/stats/top-sources?limit=3').then((r) => setTopSources(r.data)).catch(() => setTopSources([]))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      api.get('/stats/dc-r'),
      api.get('/stats/user-activity'),
      api.get('/stats/stage-conversion'),
      api.get('/stats/prospects-by-stage'),
      api.get('/stats/top-sources?limit=3'),
    ])
      .then(([dcr, ua, sc, ps, ts]) => {
        if (cancelled) return
        setStats(dcr.data)
        setUserActivity(ua.data)
        setStageConversion(sc.data)
        setProspectsByStage(ps.data)
        setTopSources(ts.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load stats') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const params = categoryChartMinLeadScore.trim() ? `?minLeadScore=${encodeURIComponent(categoryChartMinLeadScore.trim())}` : ''
    setCategoryChartLoading(true)
    api.get(`/stats/prospects-by-category${params}`)
      .then((r) => setCategoryChartData(r.data))
      .catch(() => setCategoryChartData([]))
      .finally(() => setCategoryChartLoading(false))
  }, [categoryChartMinLeadScore])

  if (loading) {
    return <p style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading stats…</p>
  }
  if (error) {
    return <p style={{ color: '#dc2626', padding: '20px' }}>Error: {error}</p>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>DC&R Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}. Use the extension to capture and manage prospects.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Refresh
        </button>
      </header>

      {/* DC_R Statistics */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>DC&R Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats?.totalProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats?.todaysProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>This Week&apos;s Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats?.thisWeeksProspects ?? '—'}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Assigned Leads</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats?.assignedLeads ?? '—'}</div>
          </div>
        </div>
      </section>

      {/* User Performance & Prospect Tracking */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User Performance & Prospect Tracking</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>User Activity (DC&R)</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Number of prospects captured by each DC&R user</p>
          {userActivity.length === 0 ? (
            <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>No DC&R users or data yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {userActivity.map((u) => (
                <div key={u.userId} style={{ ...cardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{u.name}</div>
                  {u.email && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{u.email}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Today</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0ea5e9' }}>{u.today}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>This Week</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{u.thisWeek}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>This Month</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#4f46e5' }}>{u.thisMonth}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>Stage Conversion</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>LNC → LC conversions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>LNC → LC Today</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stageConversion?.lncToLcToday ?? '—'}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>LNC → LC All Time</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stageConversion?.lncToLcAllTime ?? '—'}</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>Prospect Counts by Stage</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ ...cardStyle, padding: '16px 20px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>Total prospects:</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{prospectsByStage?.total ?? '—'}</span>
            </div>
            {prospectsByStage?.byStage?.map(({ stage, count }) => (
              <div key={stage} style={{ background: STATUS_STYLE[stage]?.bg || '#f1f5f9', color: STATUS_STYLE[stage]?.text || '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
                {STATUS_LABELS[stage] || stage}: {count}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={cardStyle}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Stage-wise prospect distribution</h4>
            {!prospectsByStage?.byStage?.length ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={prospectsByStage.byStage.map((s, i) => ({ name: STATUS_LABELS[s.stage] || s.stage, value: s.count, fill: CHART_COLORS[i % CHART_COLORS.length] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`} />
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Prospects']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div style={cardStyle}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User-wise captured (this month)</h4>
            {userActivity.length === 0 ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userActivity.map((u) => ({ name: u.name.length > 12 ? u.name.slice(0, 10) + '…' : u.name, count: u.thisMonth }))} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} prospects`, 'This month']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top 3 Prospect Sources */}
      <section style={{ marginBottom: '30px', ...cardStyle, padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Top 3 Prospect Sources</h2>
        {topSources.length === 0 ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No source data yet.</p>
        ) : (
          <>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSources.map(({ source, count }) => ({ name: formatSource(source), count }))} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} prospects`, 'Count']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>{topSources.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              {topSources.map(({ source, count }, i) => (
                <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span style={{ fontSize: '14px', color: '#334155' }}>{formatSource(source)} – {count} prospects</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Prospects by Category */}
      <section style={{ marginBottom: '30px', ...cardStyle, padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Prospects by Category</h2>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }} htmlFor="dcr-category-min-score">Min lead score:</label>
          <input id="dcr-category-min-score" type="number" min={0} max={100} placeholder="Any" value={categoryChartMinLeadScore} onChange={(e) => setCategoryChartMinLeadScore(e.target.value)} style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
          <span style={{ fontSize: '13px', color: '#64748b' }}>{categoryChartMinLeadScore.trim() ? `Only prospects with lead_score ≥ ${categoryChartMinLeadScore}` : 'Showing all prospects'}</span>
        </div>
        {categoryChartLoading ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading chart…</p>
        ) : categoryChartData.length === 0 ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data for this filter.</p>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData.map((d) => ({ ...d, name: formatCategory(d.category) }))} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Prospects']} labelFormatter={(label) => `Category: ${label}`} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
