'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'

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
  next_follow_up_date?: string | null
  user_id: string
  lh_user_id: string | null
  created_at: string
  updated_at: string
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
}: {
  prospect: Prospect
  statusStyle: Record<string, { bg: string; text: string }>
  statusLabels: Record<string, string>
  onClick?: () => void
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
    </div>
  </div>
)

export default function ProspectsPage() {
  const router = useRouter()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
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
      if (searchName.trim() || searchCompany.trim() || searchEmail.trim()) {
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

  useEffect(() => {
    fetchProspects()
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
          onClick={fetchProspects}
          style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Refresh
        </button>
      </header>

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
            <input type="date" value={filterLastContactedFrom} onChange={(e) => setFilterLastContactedFrom(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            <span style={{ color: '#64748b' }}>–</span>
            <input type="date" value={filterLastContactedTo} onChange={(e) => setFilterLastContactedTo(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>Next Follow-up:</span>
            <input type="date" value={filterNextFollowUpFrom} onChange={(e) => setFilterNextFollowUpFrom(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            <span style={{ color: '#64748b' }}>–</span>
            <input type="date" value={filterNextFollowUpTo} onChange={(e) => setFilterNextFollowUpTo(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
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
