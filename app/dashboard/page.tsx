'use client'

import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

function useAnimatedNumber(value: number | null, loading: boolean, duration = 600) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    if (loading || value === null) {
      setDisplay(0)
      prevRef.current = 0
      return
    }
    const target = value
    const start = prevRef.current
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - (1 - progress) ** 2
      setDisplay(Math.round(start + (target - start) * easeOut))
      prevRef.current = target
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, loading, duration])

  return loading || value === null ? null : display
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  new: { bg: '#e3f2fd', text: '#1565c0' },
  data_refined: { bg: '#f3e5f5', text: '#7b1fa2' },
  use_in_campaign: { bg: '#fff8e1', text: '#f57f17' },
  pitch: { bg: '#e8f5e9', text: '#2e7d32' },
  LNC: { bg: '#fce4ec', text: '#c62828' },
  B_LNC: { bg: '#fbe9e7', text: '#d84315' },
  LC: { bg: '#e0f7fa', text: '#00838f' },
  B_LC: { bg: '#e0f2f1', text: '#00695c' },
  COMMUNICATION: { bg: '#ede7f6', text: '#4527a0' },
  TRASH: { bg: '#efebe9', text: '#4e342e' },
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  data_refined: 'Data Refined',
  use_in_campaign: 'Use in Campaign',
  pitch: 'Pitch',
  LNC: 'LNC',
  B_LNC: 'B-LNC',
  LC: 'LC',
  B_LC: 'B-LC',
  COMMUNICATION: 'Communication',
  TRASH: 'Trash',
}

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

interface DCRStats {
  totalProspects: number
  todaysProspects: number
  thisWeeksProspects: number
  assignedLeads: number
}

interface LHStats {
  totalAssignedProspects: number
  totalLCProspects: number
  totalLNCProspects: number
  todaysTasks: number
  overdueTasks: number
}

interface TopSource {
  source: string
  count: number
}

interface CategoryCount {
  category: string
  count: number
}

interface UserActivityItem {
  userId: string
  name: string
  email: string | null
  today: number
  thisWeek: number
  thisMonth: number
}

interface LHUserActivityItem {
  userId: string
  name: string
  email: string | null
  assigned: number
  lc: number
  lnc: number
  todaysTasks: number
  overdueTasks: number
}

interface StageCount {
  stage: string
  count: number
}

interface ProspectsByStage {
  total: number
  byStage: StageCount[]
}

const formatSource = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '')
const formatCategory = (c: string) => (c === 'Uncategorized' ? c : c.replace(/_/g, '-'))

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DCRStats | null>(null)
  const [lhStats, setLhStats] = useState<LHStats | null>(null)
  const [topSources, setTopSources] = useState<TopSource[]>([])
  const [categoryChartData, setCategoryChartData] = useState<CategoryCount[]>([])
  const [categoryChartMinLeadScore, setCategoryChartMinLeadScore] = useState<string>('')
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([])
  const [lhUserActivity, setLhUserActivity] = useState<LHUserActivityItem[]>([])
  const [prospectsByStage, setProspectsByStage] = useState<ProspectsByStage | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [lhStatsLoading, setLhStatsLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [categoryChartLoading, setCategoryChartLoading] = useState(true)
  const [userActivityLoading, setUserActivityLoading] = useState(true)
  const [lhUserActivityLoading, setLhUserActivityLoading] = useState(true)
  const [prospectsByStageLoading, setProspectsByStageLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAll = () => {
    setIsRefreshing(true)
    setStatsLoading(true)
    setLhStatsLoading(true)
    setSourcesLoading(true)
    setUserActivityLoading(true)
    setProspectsByStageLoading(true)
    const done = () => {
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }
    Promise.all([
      api.get('/stats/dc-r').then((r) => setStats(r.data)).catch(() => setStats(null)).finally(() => setStatsLoading(false)),
      api.get('/stats/lh').then((r) => setLhStats(r.data)).catch(() => setLhStats(null)).finally(() => setLhStatsLoading(false)),
      api.get('/stats/top-sources?limit=3').then((r) => setTopSources(r.data)).catch(() => setTopSources([])).finally(() => setSourcesLoading(false)),
      api.get('/stats/user-activity').then((r) => setUserActivity(r.data)).catch(() => setUserActivity([])).finally(() => setUserActivityLoading(false)),
      api.get('/stats/lh-user-activity').then((r) => setLhUserActivity(r.data)).catch(() => setLhUserActivity([])).finally(() => setLhUserActivityLoading(false)),
      api.get('/stats/prospects-by-stage').then((r) => setProspectsByStage(r.data)).catch(() => setProspectsByStage(null)).finally(() => setProspectsByStageLoading(false)),
    ]).then(done)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const params = categoryChartMinLeadScore.trim() ? `?minLeadScore=${encodeURIComponent(categoryChartMinLeadScore.trim())}` : ''
    setCategoryChartLoading(true)
    api.get(`/stats/prospects-by-category${params}`)
      .then((r) => setCategoryChartData(r.data))
      .catch(() => setCategoryChartData([]))
      .finally(() => setCategoryChartLoading(false))
  }, [categoryChartMinLeadScore])

  const animTotal = useAnimatedNumber(stats?.totalProspects ?? null, statsLoading)
  const animToday = useAnimatedNumber(stats?.todaysProspects ?? null, statsLoading)
  const animWeek = useAnimatedNumber(stats?.thisWeeksProspects ?? null, statsLoading)
  const animAssigned = useAnimatedNumber(stats?.assignedLeads ?? null, statsLoading)
  const animLhTotal = useAnimatedNumber(lhStats?.totalAssignedProspects ?? null, lhStatsLoading)
  const animLhLC = useAnimatedNumber(lhStats?.totalLCProspects ?? null, lhStatsLoading)
  const animLhLNC = useAnimatedNumber(lhStats?.totalLNCProspects ?? null, lhStatsLoading)
  const animLhTasks = useAnimatedNumber(lhStats?.todaysTasks ?? null, lhStatsLoading)
  const animLhOverdue = useAnimatedNumber(lhStats?.overdueTasks ?? null, lhStatsLoading)

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Overview of prospect metrics and analytics
            {lastUpdated && (
              <span style={{ marginLeft: '12px', fontSize: '13px' }}>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          disabled={isRefreshing}
          className={`dashboard-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
          style={{
            padding: '10px 20px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRefreshing ? 'wait' : 'pointer',
            fontWeight: 600,
            transition: 'opacity 0.2s',
          }}
        >
          {isRefreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </header>

      {/* DC_R Role Statistics */}
      <section className="dashboard-section" style={{ marginBottom: '30px', animationDelay: '0.05s' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>DC_R Role — Statistics</h2>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#4f46e5', minHeight: 36 }}>
              {statsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animTotal ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669', minHeight: 36 }}>
              {statsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animToday ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>This Week&apos;s Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0284c7', minHeight: 36 }}>
              {statsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animWeek ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Assigned Leads</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed', minHeight: 36 }}>
              {statsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animAssigned ?? '—')}
            </div>
          </div>
        </div>
      </section>

      {/* LH Role Statistics */}
      <section className="dashboard-section" style={{ marginBottom: '30px', animationDelay: '0.1s' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>LH Role — Statistics</h2>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Assigned Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#4f46e5', minHeight: 36 }}>
              {lhStatsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animLhTotal ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LC Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0d9488', minHeight: 36 }}>
              {lhStatsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animLhLC ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LNC Prospects</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#d97706', minHeight: 36 }}>
              {lhStatsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animLhLNC ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', minHeight: 36 }}>
              {lhStatsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animLhTasks ?? '—')}
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ ...cardStyle, cursor: 'default' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Overdue Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#b91c1c', minHeight: 36 }}>
              {lhStatsLoading ? <div className="dashboard-skeleton" style={{ height: 32, width: 60 }} /> : (animLhOverdue ?? '—')}
            </div>
          </div>
        </div>
      </section>

      {/* User Performance & Prospect Tracking */}
      <section className="dashboard-section" style={{ marginBottom: '30px', animationDelay: '0.15s' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User Performance & Prospect Tracking</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>User Activity (DC&R)</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Number of prospects captured by each DC&R user</p>
          {userActivityLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ ...cardStyle, padding: '16px' }}>
                  <div className="dashboard-skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                  <div className="dashboard-skeleton" style={{ height: 12, width: '80%', marginBottom: 12 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="dashboard-skeleton" style={{ height: 40, borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : userActivity.length === 0 ? (
            <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>No DC&R users or data yet.</p>
          ) : (
            <div className="user-activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {userActivity.map((u) => (
                <div key={u.userId} className="dashboard-user-card" style={{ ...cardStyle, padding: '16px', cursor: 'default' }}>
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
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>User Activity (LH)</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Assigned prospects and pipeline per LH user</p>
          {lhUserActivityLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ ...cardStyle, padding: '16px' }}>
                  <div className="dashboard-skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                  <div className="dashboard-skeleton" style={{ height: 12, width: '80%', marginBottom: 12 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="dashboard-skeleton" style={{ height: 40, borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : lhUserActivity.length === 0 ? (
            <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>No LH users or data yet.</p>
          ) : (
            <div className="user-activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {lhUserActivity.map((u) => (
                <div key={u.userId} className="dashboard-user-card" style={{ ...cardStyle, padding: '16px', cursor: 'default' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{u.name}</div>
                  {u.email && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{u.email}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Assigned</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#4f46e5' }}>{u.assigned}</div></div>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>LC</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0d9488' }}>{u.lc}</div></div>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>LNC</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>{u.lnc}</div></div>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Today&apos;s Tasks</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{u.todaysTasks}</div></div>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Overdue</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#b91c1c' }}>{u.overdueTasks}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>Prospect Counts by Stage</h3>
          {prospectsByStageLoading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div className="dashboard-skeleton" style={{ height: 48, width: 160, borderRadius: 8 }} />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dashboard-skeleton" style={{ height: 36, width: 100, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ ...cardStyle, padding: '16px 20px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>Total prospects:</span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#4f46e5' }}>{prospectsByStage?.total ?? '—'}</span>
              </div>
              {prospectsByStage?.byStage?.map(({ stage, count }) => (
                <div
                  key={stage}
                  className="dashboard-stage-pill"
                  style={{
                    background: STATUS_STYLE[stage]?.bg || '#f1f5f9',
                    color: STATUS_STYLE[stage]?.text || '#475569',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABELS[stage] || stage}: {count}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="dashboard-chart-card" style={{ ...cardStyle, padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Stage-wise prospect distribution</h4>
            {prospectsByStageLoading || !prospectsByStage?.byStage?.length ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prospectsByStage.byStage.map((s, i) => ({ name: STATUS_LABELS[s.stage] || s.stage, value: s.count, fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Prospects']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="dashboard-chart-card" style={{ ...cardStyle, padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User-wise captured (DC&R, this month)</h4>
            {userActivityLoading || userActivity.length === 0 ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userActivity.map((u) => ({ name: u.name.length > 12 ? u.name.slice(0, 10) + '…' : u.name, count: u.thisMonth }))} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} prospects`, 'This month']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#4f46e5" isAnimationActive animationDuration={600} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="dashboard-chart-card" style={{ ...cardStyle, padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User-wise assigned (LH)</h4>
            {lhUserActivityLoading || lhUserActivity.length === 0 ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lhUserActivity.map((u) => ({ name: u.name.length > 12 ? u.name.slice(0, 10) + '…' : u.name, count: u.assigned }))} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} assigned`, 'Assigned']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#0d9488" isAnimationActive animationDuration={600} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top 3 Sources */}
      <section className="dashboard-section dashboard-chart-card" style={{ marginBottom: '30px', ...cardStyle, padding: '24px', animationDelay: '0.2s' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Top 3 Prospect Sources</h2>
        {sourcesLoading ? (
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="dashboard-skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
          </div>
        ) : topSources.length === 0 ? (
          <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No source data yet.</p>
        ) : (
          <>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSources.map(({ source, count }) => ({ name: formatSource(source), count }))} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} prospects`, 'Count']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600} animationEasing="ease-out">
                    {topSources.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
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
      <section className="dashboard-section dashboard-chart-card" style={{ marginBottom: '30px', ...cardStyle, padding: '24px', animationDelay: '0.25s' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Prospects by Category</h2>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }} htmlFor="dashboard-category-min-score">Min lead score:</label>
          <input
            id="dashboard-category-min-score"
            type="number"
            min={0}
            max={100}
            placeholder="Any"
            value={categoryChartMinLeadScore}
            onChange={(e) => setCategoryChartMinLeadScore(e.target.value)}
            style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
          />
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {categoryChartMinLeadScore.trim() === '' ? 'Showing all prospects' : `Only prospects with lead_score ≥ ${categoryChartMinLeadScore}`}
          </span>
        </div>
        {categoryChartLoading ? (
          <div style={{ width: '100%', height: 300, borderRadius: 8 }}>
            <div className="dashboard-skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
          </div>
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
