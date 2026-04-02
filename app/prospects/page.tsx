'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'
import { formatDatePKT } from '../lib/date'
import { useAuth } from '../context/AuthContext'
import { cacheFirstLoad, syncIfStale, setCachedData, markSynced } from '../lib/indexedDbCache'

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
  last_contacted_at_em?: string | null
  next_follow_up_date?: string | null
  user_id: string
  lh_user_id: string | null
  created_at: string
  updated_at: string
}

interface UserOption {
  id: string
  name: string | null
  email: string
  role: string
}

const STAGE_GROUPS = [
  { key: 'new_refined', label: 'New & Data Refined', statuses: ['new', 'data_refined'] },
  { key: 'lnc', label: 'LNC (incl. B-LNC)', statuses: ['LNC', 'B_LNC'] },
  { key: 'lc', label: 'LC (incl. B-LC)', statuses: ['LC', 'B_LC'] },
  { key: 'blnc_blc', label: 'BLNC / BLC', statuses: ['B_LNC', 'B_LC'] },
  { key: 'other', label: 'Other', statuses: ['use_in_campaign', 'pitch', 'COMMUNICATION', 'TRASH'] },
] as const

const ProspectCard = ({
  prospect,
  statusStyle,
  statusLabels,
  onClick,
  onDelete,
}: {
  prospect: Prospect
  statusStyle: Record<string, { bg: string; text: string }>
  statusLabels: Record<string, string>
  onClick?: () => void
  onDelete?: () => void
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    style={{
      padding: '14px',
      borderRadius: '8px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      fontSize: '13px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.background = '#f1f5f9'
        e.currentTarget.style.borderColor = '#cbd5e1'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.background = '#f8fafc'
        e.currentTarget.style.borderColor = '#e2e8f0'
        e.currentTarget.style.boxShadow = 'none'
      }
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
      Last contacted: {formatDatePKT(prospect.last_contacted_at)}
    </div>
    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
      Next follow-up: {formatDatePKT(prospect.next_follow_up_date)}
    </div>
    {Array.isArray(prospect.intent_skills) && prospect.intent_skills.length > 0 && (
      <div style={{ marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Skills: </span>
        <span style={{ fontSize: '12px', color: '#475569' }}>{prospect.intent_skills.join(', ')}</span>
      </div>
    )}
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }} onClick={(e) => e.stopPropagation()}>
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
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          style={{ color: '#dc2626', fontSize: '12px', textDecoration: 'underline', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          Delete
        </button>
      )}
    </div>
  </div>
)

export default function ProspectsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [lhUsers, setLhUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLeadScore, setFilterLeadScore] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLhUserId, setFilterLhUserId] = useState('')
  const [filterIntentCategory, setFilterIntentCategory] = useState('')
  const [filterNotPitchedLh, setFilterNotPitchedLh] = useState('')
  const [filterNotPitchedEm, setFilterNotPitchedEm] = useState('')
  const [creating, setCreating] = useState(false)
  const [newProspectName, setNewProspectName] = useState('')
  const [newProspectCategory, setNewProspectCategory] = useState('')
  const [newProspectIntentCategory, setNewProspectIntentCategory] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    prospects.forEach((p) => { if (p.category) set.add(p.category) })
    return Array.from(set).sort()
  }, [prospects])

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (searchQuery.trim()) {
        const name = (p.name || '').toLowerCase()
        const company = (p.company_name || '').toLowerCase()
        const email = (p.email || '').toLowerCase()
        const q = searchQuery.trim().toLowerCase()
        if (!name.includes(q) && !company.includes(q) && !email.includes(q)) return false
      }
      if (filterCategory && p.category !== filterCategory) return false
      if (filterLeadScore.trim()) {
        const ls = p.lead_score
        const val = parseInt(filterLeadScore, 10)
        if (Number.isNaN(val) || ls == null || ls < val) return false
      }
      if (filterStatus && p.status !== filterStatus) return false
      if (filterLhUserId && p.lh_user_id !== filterLhUserId) return false
      if (filterIntentCategory && p.intent_category !== filterIntentCategory) return false
      if (filterNotPitchedLh === 'only' && p.last_contacted_at != null) return false
      if (filterNotPitchedEm === 'only' && (p as Prospect & { last_contacted_at_em?: string | null }).last_contacted_at_em != null) return false
      return true
    })
  }, [
    prospects,
    searchQuery,
    filterCategory,
    filterLeadScore,
    filterStatus,
    filterLhUserId,
    filterIntentCategory,
    filterNotPitchedLh,
    filterNotPitchedEm,
  ])

  const prospectsGroupedByStage = useMemo(() => {
    const byStage: Record<string, Prospect[]> = {}
    STAGE_GROUPS.forEach((g) => { byStage[g.key] = [] })
    filteredProspects.forEach((p) => {
      const group = STAGE_GROUPS.find((g) => (g.statuses as readonly string[]).includes(p.status))
      byStage[group?.key ?? 'other'].push(p)
    })
    return byStage
  }, [filteredProspects])

  const fetchProspects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/prospects')
      setProspects(response.data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prospects')
    } finally {
      setLoading(false)
    }
  }

  const fetchLhUsers = async () => {
    try {
      const res = await api.get('/users')
      const list = Array.isArray(res.data) ? res.data : []
      setLhUsers(list.filter((u: UserOption) => u.role === 'LH'))
    } catch {
      setLhUsers([])
    }
  }

  const refreshFromApiAndCache = async () => {
    const [prospectsRes, usersRes] = await Promise.all([
      api.get('/prospects'),
      api.get('/users'),
    ])
    const pList = Array.isArray(prospectsRes.data) ? prospectsRes.data : []
    const uList = Array.isArray(usersRes.data) ? usersRes.data : []
    setProspects(pList)
    setLhUsers(uList.filter((u: UserOption) => u.role === 'LH'))
    await Promise.all([
      setCachedData('prospects_all', pList),
      setCachedData('users_all', uList),
      markSynced('prospects'),
      markSynced('users'),
    ])
  }

  const createProspect = async () => {
    if (!user?.id) return
    setCreating(true)
    try {
      const created = await api.post('/prospects', {
        user_id: user.id,
        name: newProspectName.trim() || null,
        category: newProspectCategory || null,
        intent_category: newProspectIntentCategory || null,
        status: 'new',
      })
      setNewProspectName('')
      setNewProspectCategory('')
      setNewProspectIntentCategory('')
      const next = [created.data, ...prospects]
      setProspects(next)
      await setCachedData('prospects_all', next)
      await markSynced('prospects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prospect')
    } finally {
      setCreating(false)
    }
  }

  const deleteProspect = async (id: string) => {
    if (!confirm('Delete this prospect?')) return
    try {
      await api.delete(`/prospects/${id}`)
      const next = prospects.filter((p) => p.id !== id)
      setProspects(next)
      await setCachedData('prospects_all', next)
      await markSynced('prospects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prospect')
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [pCached, uCached] = await Promise.all([
          cacheFirstLoad('prospects', 'prospects_all', async () => (await api.get('/prospects')).data),
          cacheFirstLoad('users', 'users_all', async () => (await api.get('/users')).data),
        ])
        if (cancelled) return
        setProspects(Array.isArray(pCached.data) ? pCached.data : [])
        const users = Array.isArray(uCached.data) ? uCached.data : []
        setLhUsers(users.filter((u: UserOption) => u.role === 'LH'))
        setError(null)
        setLoading(false)
        if (pCached.stale) {
          const synced = await syncIfStale('prospects', 'prospects_all', async () => (await api.get('/prospects')).data)
          if (!cancelled && Array.isArray(synced.data)) setProspects(synced.data)
        }
        if (uCached.stale) {
          const syncedUsers = await syncIfStale('users', 'users_all', async () => (await api.get('/users')).data)
          if (!cancelled && Array.isArray(syncedUsers.data)) {
            setLhUsers(syncedUsers.data.filter((u: UserOption) => u.role === 'LH'))
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load prospects')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Prospects</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>View and manage all prospects</p>
        </div>
        <button
          type="button"
          onClick={refreshFromApiAndCache}
          style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Refresh
        </button>
      </header>

      <section style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#1e293b' }}>Create Prospect</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px' }}>
          <input
            type="text"
            placeholder="Prospect name"
            value={newProspectName}
            onChange={(e) => setNewProspectName(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
          />
          <select value={newProspectCategory} onChange={(e) => setNewProspectCategory(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
            <option value="">Category</option>
            <option value="Entrepreneur">Entrepreneur</option>
            <option value="Subcontractor">Subcontractor</option>
            <option value="SME">SME</option>
            <option value="HR">HR</option>
            <option value="C_Level">C-Level</option>
          </select>
          <select value={newProspectIntentCategory} onChange={(e) => setNewProspectIntentCategory(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
            <option value="">Intent category</option>
            <option value="Individual">Individual</option>
            <option value="Business">Business</option>
            <option value="Both">Both</option>
          </select>
          <button type="button" disabled={creating} onClick={createProspect} style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </section>

      {loading && <p style={{ color: '#64748b', padding: '20px' }}>Loading prospects...</p>}
      {error && <p style={{ color: '#dc2626', padding: '20px' }}>Error: {error}</p>}

      {!loading && !error && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
              Prospects ({filteredProspects.length}{filteredProspects.length !== prospects.length ? ` of ${prospects.length}` : ''})
            </h2>
          </div>

          <div className="search-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <input
              type="search"
              placeholder="Search name/company/email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
            />
          </div>

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
            <select value={filterLhUserId} onChange={(e) => setFilterLhUserId(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '160px' }}>
              <option value="">All LH users</option>
              {lhUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
            <select value={filterIntentCategory} onChange={(e) => setFilterIntentCategory(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '160px' }}>
              <option value="">All intent categories</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Both">Both</option>
            </select>
            <select value={filterNotPitchedLh} onChange={(e) => setFilterNotPitchedLh(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '180px' }}>
              <option value="">LH pitch: all</option>
              <option value="only">LH not pitched</option>
            </select>
            <select value={filterNotPitchedEm} onChange={(e) => setFilterNotPitchedEm(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '180px' }}>
              <option value="">EM pitch: all</option>
              <option value="only">EM not pitched</option>
            </select>
          </div>

          {prospects.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No prospects found. Start adding prospects using the extension!</p>
          ) : filteredProspects.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No prospects match your filters.</p>
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
                      <ProspectCard
                        key={p.id}
                        prospect={p}
                        statusStyle={STATUS_STYLE}
                        statusLabels={STATUS_LABELS}
                        onClick={() => router.push(`/prospects/${p.id}`)}
                        onDelete={() => deleteProspect(p.id)}
                      />
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
      )}
    </div>
  )
}
