'use client'

import { useEffect, useState, useMemo } from 'react'
import api from './lib/api'
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
  new:              'New',
  data_refined:     'Data Refined',
  use_in_campaign:  'Use in Campaign',
  pitch:            'Pitch',
  LNC:              'LNC',
  B_LNC:            'B-LNC',
  LC:               'LC',
  B_LC:             'B-LC',
  COMMUNICATION:    'Communication',
  TRASH:            'Trash',
}

interface Prospect {
  id: string
  name: string | null
  email: string | null
  job_title: string | null
  company_name: string | null
  website_link: string | null
  linkedin_url: string | null
  category: string | null
  intent_category: string | null
  intent_proof_link: string | null
  intent_skills?: string[]
  status: string
  sources: string | null
  lead_score?: number | null
  last_contacted_at?: string | null
  next_follow_up_date?: string | null
  user_id: string
  lh_user_id: string | null
  created_at: string
  updated_at: string
}

// Stage groups for display
const STAGE_GROUPS = [
  { key: 'new_refined', label: 'New & Data Refined', statuses: ['new', 'data_refined'] },
  { key: 'lnc', label: 'LNC (incl. B-LNC)', statuses: ['LNC', 'B_LNC'] },
  { key: 'lc', label: 'LC (incl. B-LC)', statuses: ['LC', 'B_LC'] },
  { key: 'blnc_blc', label: 'BLNC / BLC', statuses: ['B_LNC', 'B_LC'] },
  { key: 'other', label: 'Other', statuses: ['use_in_campaign', 'pitch', 'COMMUNICATION', 'TRASH'] },
] as const

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

interface StageConversion {
  lncToLcToday: number
  lncToLcAllTime: number
}

interface StageCount {
  stage: string
  count: number
}

interface ProspectsByStage {
  total: number
  byStage: StageCount[]
}

const formatSource = (s: string | null) => {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

const formatCategory = (c: string) => {
  if (c === 'Uncategorized') return c
  return c.replace(/_/g, '-')
}

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

const ProspectCard = ({
  prospect,
  statusStyle,
  statusLabels,
}: {
  prospect: Prospect
  statusStyle: Record<string, { bg: string; text: string }>
  statusLabels: Record<string, string>
}) => (
  <div
    style={{
      padding: '14px',
      borderRadius: '8px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      fontSize: '13px',
    }}
  >
    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>{prospect.name || '—'}</div>
    <div style={{ color: '#64748b', marginBottom: '4px' }}>{prospect.company_name || '—'}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
      {prospect.category && (
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontSize: '11px' }}>
          {prospect.category.replace(/_/g, '-')}
        </span>
      )}
      {prospect.lead_score != null && (
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontSize: '11px' }}>
          Score: {prospect.lead_score}
        </span>
      )}
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: statusStyle[prospect.status]?.bg || '#f1f5f9',
          color: statusStyle[prospect.status]?.text || '#475569',
          fontSize: '11px',
        }}
      >
        {statusLabels[prospect.status] || prospect.status}
      </span>
    </div>
    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
      Last contacted: {prospect.last_contacted_at ? new Date(prospect.last_contacted_at).toLocaleDateString() : '—'}
    </div>
    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
      Next follow-up: {prospect.next_follow_up_date ? new Date(prospect.next_follow_up_date).toLocaleDateString() : '—'}
    </div>
    {Array.isArray(prospect.intent_skills) && prospect.intent_skills.length > 0 && (
      <div style={{ marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Skills: </span>
        <span style={{ fontSize: '12px', color: '#475569' }}>{prospect.intent_skills.join(', ')}</span>
      </div>
    )}
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
      {prospect.linkedin_url && (
        <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontSize: '12px', textDecoration: 'underline' }}>
          LinkedIn →
        </a>
      )}
      {prospect.website_link && (
        <a
          href={prospect.website_link.startsWith('http') ? prospect.website_link : `https://${prospect.website_link}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4f46e5', fontSize: '12px', textDecoration: 'underline' }}
        >
          Website →
        </a>
      )}
      {prospect.email && (
        <a href={`mailto:${prospect.email}`} style={{ color: '#4f46e5', fontSize: '12px', textDecoration: 'underline' }}>
          {prospect.email}
        </a>
      )}
    </div>
  </div>
)

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [stats, setStats] = useState<DCRStats | null>(null)
  const [lhStats, setLhStats] = useState<LHStats | null>(null)
  const [topSources, setTopSources] = useState<TopSource[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [lhStatsLoading, setLhStatsLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [categoryChartData, setCategoryChartData] = useState<CategoryCount[]>([])
  const [categoryChartLoading, setCategoryChartLoading] = useState(true)
  const [categoryChartMinLeadScore, setCategoryChartMinLeadScore] = useState<string>('')
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([])
  const [userActivityLoading, setUserActivityLoading] = useState(true)
  const [stageConversion, setStageConversion] = useState<StageConversion | null>(null)
  const [stageConversionLoading, setStageConversionLoading] = useState(true)
  const [prospectsByStage, setProspectsByStage] = useState<ProspectsByStage | null>(null)
  const [prospectsByStageLoading, setProspectsByStageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')
  const [searchCompany, setSearchCompany] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLeadScore, setFilterLeadScore] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLastContactedFrom, setFilterLastContactedFrom] = useState('')
  const [filterLastContactedTo, setFilterLastContactedTo] = useState('')
  const [filterNextFollowUpFrom, setFilterNextFollowUpFrom] = useState('')
  const [filterNextFollowUpTo, setFilterNextFollowUpTo] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    prospects.forEach((p) => { if (p.category) set.add(p.category) })
    return Array.from(set).sort()
  }, [prospects])

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const searchLower = searchName.trim().toLowerCase() || searchCompany.trim().toLowerCase() || searchEmail.trim().toLowerCase()
      if (searchLower) {
        const name = (p.name || '').toLowerCase()
        const company = (p.company_name || '').toLowerCase()
        const email = (p.email || '').toLowerCase()
        const matchesName = !searchName.trim() || name.includes(searchName.trim().toLowerCase())
        const matchesCompany = !searchCompany.trim() || company.includes(searchCompany.trim().toLowerCase())
        const matchesEmail = !searchEmail.trim() || email.includes(searchEmail.trim().toLowerCase())
        if (!matchesName || !matchesCompany || !matchesEmail) return false
      }
      if (filterCategory && p.category !== filterCategory) return false
      if (filterLeadScore.trim()) {
        const ls = p.lead_score
        const val = parseInt(filterLeadScore, 10)
        if (Number.isNaN(val) || ls == null || ls < val) return false
      }
      if (filterStatus && p.status !== filterStatus) return false
      if (filterLastContactedFrom || filterLastContactedTo) {
        const lc = p.last_contacted_at ? new Date(p.last_contacted_at) : null
        if (!lc) return false
        const lcDate = lc.toISOString().slice(0, 10)
        if (filterLastContactedFrom && lcDate < filterLastContactedFrom) return false
        if (filterLastContactedTo && lcDate > filterLastContactedTo) return false
      }
      if (filterNextFollowUpFrom || filterNextFollowUpTo) {
        const nf = p.next_follow_up_date ? new Date(p.next_follow_up_date) : null
        if (!nf) return false
        const nfDate = nf.toISOString().slice(0, 10)
        if (filterNextFollowUpFrom && nfDate < filterNextFollowUpFrom) return false
        if (filterNextFollowUpTo && nfDate > filterNextFollowUpTo) return false
      }
      return true
    })
  }, [
    prospects,
    searchName,
    searchCompany,
    searchEmail,
    filterCategory,
    filterLeadScore,
    filterStatus,
    filterLastContactedFrom,
    filterLastContactedTo,
    filterNextFollowUpFrom,
    filterNextFollowUpTo,
  ])

  const prospectsGroupedByStage = useMemo(() => {
    const byStage: Record<string, Prospect[]> = {}
    STAGE_GROUPS.forEach((g) => { byStage[g.key] = [] })
    filteredProspects.forEach((p) => {
      const group = STAGE_GROUPS.find((g) => g.statuses.includes(p.status))
      byStage[group?.key ?? 'other'].push(p)
    })
    return byStage
  }, [filteredProspects])

  useEffect(() => {
    fetchProspects()
    fetchStats()
    fetchLhStats()
    fetchTopSources()
    fetchUserActivity()
    fetchStageConversion()
    fetchProspectsByStage()
  }, [])

  useEffect(() => {
    fetchCategoryChart()
  }, [categoryChartMinLeadScore])

  const fetchProspects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/prospects')
      setProspects(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prospects')
      console.error('Error fetching prospects:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await api.get('/stats/dc-r')
      setStats(response.data)
    } catch (err: any) {
      console.error('Error fetching stats:', err)
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchLhStats = async () => {
    try {
      setLhStatsLoading(true)
      const response = await api.get('/stats/lh')
      setLhStats(response.data)
    } catch (err: any) {
      console.error('Error fetching LH stats:', err)
      setLhStats(null)
    } finally {
      setLhStatsLoading(false)
    }
  }

  const fetchTopSources = async () => {
    try {
      setSourcesLoading(true)
      const response = await api.get('/stats/top-sources?limit=3')
      setTopSources(response.data)
    } catch (err: any) {
      console.error('Error fetching top sources:', err)
      setTopSources([])
    } finally {
      setSourcesLoading(false)
    }
  }

  const fetchCategoryChart = async () => {
    try {
      setCategoryChartLoading(true)
      const params = categoryChartMinLeadScore.trim() !== ''
        ? `?minLeadScore=${encodeURIComponent(categoryChartMinLeadScore.trim())}`
        : ''
      const response = await api.get(`/stats/prospects-by-category${params}`)
      setCategoryChartData(response.data)
    } catch (err: any) {
      console.error('Error fetching prospects by category:', err)
      setCategoryChartData([])
    } finally {
      setCategoryChartLoading(false)
    }
  }

  const fetchUserActivity = async () => {
    try {
      setUserActivityLoading(true)
      const response = await api.get('/stats/user-activity')
      setUserActivity(response.data)
    } catch (err: any) {
      console.error('Error fetching user activity:', err)
      setUserActivity([])
    } finally {
      setUserActivityLoading(false)
    }
  }

  const fetchStageConversion = async () => {
    try {
      setStageConversionLoading(true)
      const response = await api.get('/stats/stage-conversion')
      setStageConversion(response.data)
    } catch (err: any) {
      console.error('Error fetching stage conversion:', err)
      setStageConversion(null)
    } finally {
      setStageConversionLoading(false)
    }
  }

  const fetchProspectsByStage = async () => {
    try {
      setProspectsByStageLoading(true)
      const response = await api.get('/stats/prospects-by-stage')
      setProspectsByStage(response.data)
    } catch (err: any) {
      console.error('Error fetching prospects by stage:', err)
      setProspectsByStage(null)
    } finally {
      setProspectsByStageLoading(false)
    }
  }

  const refreshAll = () => {
    fetchProspects()
    fetchStats()
    fetchLhStats()
    fetchTopSources()
    fetchCategoryChart()
    fetchUserActivity()
    fetchStageConversion()
    fetchProspectsByStage()
  }

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
          Prospect Management Dashboard
        </h1>
        <p style={{ color: '#666' }}>View and manage all your prospects</p>
      </header>

      {loading && <p>Loading prospects...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <div>
          {/* DC_R role statistics section */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
              DC_R Role — Statistics
            </h2>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {statsLoading ? '—' : (stats?.totalProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {statsLoading ? '—' : (stats?.todaysProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>This Week&apos;s Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {statsLoading ? '—' : (stats?.thisWeeksProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Assigned Leads</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {statsLoading ? '—' : (stats?.assignedLeads ?? '—')}
                </div>
              </div>
            </div>
          </section>

          {/* LH role statistics section */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
              LH Role — Statistics
            </h2>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Assigned Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {lhStatsLoading ? '—' : (lhStats?.totalAssignedProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LC Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {lhStatsLoading ? '—' : (lhStats?.totalLCProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total LNC Prospects</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {lhStatsLoading ? '—' : (lhStats?.totalLNCProspects ?? '—')}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Today&apos;s Tasks</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                  {lhStatsLoading ? '—' : (lhStats?.todaysTasks ?? '—')}
                </div>
              </div>
            </div>
          </section>

          {/* User Performance & Prospect Tracking */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
              User Performance & Prospect Tracking
            </h2>

            {/* User Activity: prospects captured by each DC_R user */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>User Activity (DC&amp;R)</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Number of prospects captured by each DC&amp;R user</p>
              {userActivityLoading ? (
                <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>Loading...</p>
              ) : userActivity.length === 0 ? (
                <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>No DC&amp;R users or data yet.</p>
              ) : (
                <div className="user-activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {userActivity.map((u) => (
                    <div
                      key={u.userId}
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{u.name}</div>
                      {u.email && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{u.email}</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Today</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0ea5e9' }}>{u.today}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>This Week</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{u.thisWeek}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>This Month</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#4f46e5' }}>{u.thisMonth}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stage Conversion Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>Stage Conversion</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>LNC → LC conversions</p>
              {stageConversionLoading ? (
                <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>Loading...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>LNC → LC Today</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stageConversion?.lncToLcToday ?? '—'}</div>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>LNC → LC All Time</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stageConversion?.lncToLcAllTime ?? '—'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Prospect Counts by Stage */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#334155' }}>Prospect Counts by Stage</h3>
              {prospectsByStageLoading ? (
                <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>Loading...</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'white', padding: '16px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>Total prospects:</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{prospectsByStage?.total ?? '—'}</span>
                  </div>
                  {prospectsByStage?.byStage?.map(({ stage, count }) => (
                    <div
                      key={stage}
                      style={{
                        background: STATUS_STYLE[stage]?.bg || '#f1f5f9',
                        color: STATUS_STYLE[stage]?.text || '#475569',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {STATUS_LABELS[stage] || stage}: {count}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Charts row: Stage distribution + User-wise captured */}
            <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Stage-wise prospect distribution (Pie) */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
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
                        />
                        <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Prospects']} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {/* User-wise captured prospects (Bar) */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>User-wise captured (this month)</h4>
                {userActivityLoading || userActivity.length === 0 ? (
                  <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No data</p>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userActivity.map((u) => ({ name: u.name.length > 12 ? u.name.slice(0, 10) + '…' : u.name, count: u.thisMonth }))}
                        margin={{ top: 16, right: 16, left: 0, bottom: 24 }}
                      >
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

          {/* Top 3 Sources graph */}
          <section style={{ marginBottom: '30px', background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
              Top 3 Prospect Sources
            </h2>
            {sourcesLoading ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading chart...</p>
            ) : topSources.length === 0 ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>No source data yet.</p>
            ) : (
              <>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSources.map(({ source, count }) => ({ name: formatSource(source), count }))}
                      margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} prospects`, 'Count']}
                        contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
                      <span style={{ fontSize: '14px', color: '#334155' }}>
                        {formatSource(source)} – {count} prospects
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Prospects by Category with Lead Score Filter */}
          <section style={{ marginBottom: '30px', background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
              Prospects by Category
            </h2>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '14px', color: '#64748b' }} htmlFor="category-chart-min-score">
                Min lead score:
              </label>
              <input
                id="category-chart-min-score"
                type="number"
                min={0}
                max={100}
                placeholder="Any"
                value={categoryChartMinLeadScore}
                onChange={(e) => setCategoryChartMinLeadScore(e.target.value)}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {categoryChartMinLeadScore.trim() === '' ? 'Showing all prospects' : `Only prospects with lead_score ≥ ${categoryChartMinLeadScore}`}
              </span>
            </div>
            {categoryChartLoading ? (
              <p style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading chart...</p>
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

          {/* Prospects: grouped by stage, card-based, with search & filters */}
          <section style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
                Prospects ({filteredProspects.length}{filteredProspects.length !== prospects.length ? ` of ${prospects.length}` : ''})
              </h2>
              <button
                type="button"
                onClick={refreshAll}
                style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="search-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <input
                type="search"
                placeholder="Search by name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <input
                type="search"
                placeholder="Search by company"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <input
                type="search"
                placeholder="Search by email (optional)"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            {/* Filters */}
            <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '140px' }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, '-')}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Min Lead Score"
                value={filterLeadScore}
                onChange={(e) => setFilterLeadScore(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '120px' }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '140px' }}
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([s, l]) => (
                  <option key={s} value={s}>{l}</option>
                ))}
              </select>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Last Contacted:</span>
              <input
                type="date"
                value={filterLastContactedFrom}
                onChange={(e) => setFilterLastContactedFrom(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <span style={{ color: '#64748b' }}>–</span>
              <input
                type="date"
                value={filterLastContactedTo}
                onChange={(e) => setFilterLastContactedTo(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Next Follow-up:</span>
              <input
                type="date"
                value={filterNextFollowUpFrom}
                onChange={(e) => setFilterNextFollowUpFrom(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <span style={{ color: '#64748b' }}>–</span>
              <input
                type="date"
                value={filterNextFollowUpTo}
                onChange={(e) => setFilterNextFollowUpTo(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            {prospects.length === 0 ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No prospects found. Start adding prospects using the extension!
              </p>
            ) : filteredProspects.length === 0 ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No prospects match your filters.
              </p>
            ) : (
              <div className="prospects-stage-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {STAGE_GROUPS.map((group) => (
                  <div
                    key={group.key}
                    style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      minHeight: '200px',
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      {group.label} ({prospectsGroupedByStage[group.key]?.length ?? 0})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {(prospectsGroupedByStage[group.key] ?? []).map((p) => (
                        <ProspectCard key={p.id} prospect={p} statusStyle={STATUS_STYLE} statusLabels={STATUS_LABELS} />
                      ))}
                      {(prospectsGroupedByStage[group.key] ?? []).length === 0 && (
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No prospects</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
