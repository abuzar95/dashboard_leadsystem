'use client'

import { useEffect, useState, useMemo } from 'react'
import api from './lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import TablePagination from './components/TablePagination'

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
  status: string
  sources: string | null
  user_id: string
  lh_user_id: string | null
  created_at: string
  updated_at: string
}

interface DCRStats {
  totalProspects: number
  todaysProspects: number
  thisWeeksProspects: number
  assignedLeads: number
}

interface TopSource {
  source: string
  count: number
}

const formatSource = (s: string | null) => {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [stats, setStats] = useState<DCRStats | null>(null)
  const [topSources, setTopSources] = useState<TopSource[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const paginatedProspects = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return prospects.slice(start, start + rowsPerPage)
  }, [prospects, page, rowsPerPage])

  useEffect(() => {
    setPage(1)
  }, [prospects.length, rowsPerPage])

  useEffect(() => {
    fetchProspects()
    fetchStats()
    fetchTopSources()
  }, [])

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

  const refreshAll = () => {
    fetchProspects()
    fetchStats()
    fetchTopSources()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
            <div style={{
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

          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>All Prospects ({prospects.length})</h2>
            <button 
              onClick={refreshAll}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          {prospects.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No prospects found. Start adding prospects using the extension!
            </p>
          ) : (
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Intent Category</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Intent Proof</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProspects.map((prospect) => (
                    <tr key={prospect.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{prospect.name || '-'}</td>
                      <td style={{ padding: '12px' }}>{prospect.email || '-'}</td>
                      <td style={{ padding: '12px' }}>{prospect.company_name || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        {prospect.category ? (
                          <span style={{ textTransform: 'capitalize' }}>
                            {prospect.category.replace('_', '-')}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {prospect.intent_category ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: prospect.intent_category === 'Individual' ? '#fff3e0' : prospect.intent_category === 'Business' ? '#e0f2f1' : '#ede7f6',
                            color: prospect.intent_category === 'Individual' ? '#e65100' : prospect.intent_category === 'Business' ? '#00695c' : '#4527a0',
                            fontSize: '12px'
                          }}>
                            {prospect.intent_category}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {prospect.intent_proof_link ? (
                          <a
                            href={prospect.intent_proof_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'underline', fontSize: '13px' }}
                          >
                            View Proof
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: STATUS_STYLE[prospect.status]?.bg || '#f1f5f9',
                          color: STATUS_STYLE[prospect.status]?.text || '#475569',
                          fontSize: '12px'
                        }}>
                          {STATUS_LABELS[prospect.status] || prospect.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {prospect.sources ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            fontSize: '12px',
                            textTransform: 'capitalize'
                          }}>
                            {prospect.sources}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                        {new Date(prospect.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <TablePagination
                totalItems={prospects.length}
                page={page}
                onPageChange={setPage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
