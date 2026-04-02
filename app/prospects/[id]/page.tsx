'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'
import { formatDatePKT } from '../../lib/date'
import { useAuth } from '../../context/AuthContext'

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

interface ProspectDetail {
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
  pitch_description?: string | null
  about_prospect?: string | null
  priority?: string | null
  linkedin_connection?: string | null
  pitch_response?: string | null
  company_size?: string | null
  location?: string | null
  user_id: string
  lh_user_id: string | null
  em_user_id: string | null
  linkedin_profile_id: string | null
  created_at: string
  updated_at: string
  data_refined_date?: string | null
  pitch_date?: string | null
  intent_date?: string | null
  campaign_name?: string | null
  campaign_added_date?: string | null
  user?: { id: string; name: string | null; email: string } | null
  lh_user?: { id: string; name: string | null; email: string } | null
  em_user?: { id: string; name: string | null; email: string } | null
  linkedin_profile?: { id: string; name: string; niche: string | null } | null
  last_contacted_at_em?: string | null
  pitched_description_em?: string | null
  next_follow_up_em?: string | null
  lead_score_em?: number | null
  response_em?: boolean | null
}

interface UserOption {
  id: string
  name: string | null
  email: string
  role: string
  linkedin_profile?: { niche: string | null } | null
}

const cardStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const v = value == null || value === '' ? '—' : String(value)
  return (
    <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '13px', color: '#64748b', minWidth: '140px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{v}</span>
    </div>
  )
}

function DetailLink({ label, href, text }: { label: string; href: string; text: string }) {
  return (
    <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '13px', color: '#64748b', minWidth: '140px' }}>{label}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'underline', wordBreak: 'break-all' }}>
        {text}
      </a>
    </div>
  )
}

export default function ProspectDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const id = params?.id as string
  const [prospect, setProspect] = useState<ProspectDetail | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [lhUsers, setLhUsers] = useState<UserOption[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!id) return
    api
      .get(`/prospects/${id}`)
      .then((r) => {
        setProspect(r.data)
        setForm(r.data)
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Prospect not found' : err.message || 'Failed to load prospect')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isAdmin) return
    api.get('/users')
      .then((r) => {
        const users = Array.isArray(r.data) ? r.data : []
        setLhUsers(users.filter((u: UserOption) => u.role === 'LH'))
      })
      .catch(() => setLhUsers([]))
  }, [isAdmin])

  const formatDate = (d: string | null | undefined) => formatDatePKT(d)
  const formatSource = (s: string | null | undefined) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—')
  const setField = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }))

  const saveChanges = async () => {
    if (!prospect) return
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      const res = await api.put(`/prospects/${prospect.id}`, payload)
      setProspect(res.data)
      setForm(res.data)
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update prospect')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading prospect...</p>
      </div>
    )
  }

  if (error || !prospect) {
    return (
      <div className="page-content" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: '#dc2626', padding: '20px' }}>{error || 'Prospect not found'}</p>
        <Link href="/prospects" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
          ← Back to Prospects
        </Link>
      </div>
    )
  }

  const editable = editing && isAdmin
  const active: ProspectDetail = editable ? (form as unknown as ProspectDetail) : prospect
  const eligibleLhUsers = lhUsers.filter((u) => {
    const niche = u.linkedin_profile?.niche
    return !active.intent_category || niche === active.intent_category
  })

  const statusStyle = STATUS_STYLE[active.status] || { bg: '#f1f5f9', text: '#475569' }

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Link
          href="/prospects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          ← Back to Prospects
        </Link>
        {isAdmin && !editing && (
          <button type="button" onClick={() => setEditing(true)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
            Edit
          </button>
        )}
        {isAdmin && editing && (
          <>
            <button type="button" onClick={() => { setEditing(false); setForm(prospect as unknown as Record<string, unknown>) }} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={saveChanges} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      </header>

      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{active.name || 'Unnamed Prospect'}</h1>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: statusStyle.bg,
              color: statusStyle.text,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {STATUS_LABELS[active.status] || active.status}
          </span>
          {active.lead_score != null && (
            <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontSize: '13px', fontWeight: 600 }}>
              Score: {active.lead_score}
            </span>
          )}
          {active.category && (
            <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', fontSize: '13px' }}>
              {active.category.replace(/_/g, '-')}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Company</h2>
            <DetailRow label="Company" value={active.company_name} />
            {editable && <input value={(active.company_name || '') as string} onChange={(e) => setField('company_name', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
            <DetailRow label="Job Title" value={active.job_title} />
            {editable && <input value={(active.job_title || '') as string} onChange={(e) => setField('job_title', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
            <DetailRow label="Email" value={active.email} />
            {editable && <input type="email" value={(active.email || '') as string} onChange={(e) => setField('email', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
            <DetailRow label="Location" value={active.location} />
            {editable && <input value={(active.location || '') as string} onChange={(e) => setField('location', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
            <DetailRow label="Company Size" value={active.company_size} />
            {editable && <input value={(active.company_size || '') as string} onChange={(e) => setField('company_size', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
            {active.email && (
              <div style={{ marginTop: '8px' }}>
                <a href={`mailto:${active.email}`} style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'underline' }}>
                  Send email →
                </a>
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Links & Source</h2>
            {active.linkedin_url && <DetailLink label="LinkedIn" href={active.linkedin_url} text="Open LinkedIn →" />}
            {active.website_link && (
              <DetailLink
                label="Website"
                href={active.website_link.startsWith('http') ? active.website_link : `https://${active.website_link}`}
                text="Open website →"
              />
            )}
            {active.intent_proof_link && <DetailLink label="Intent Proof" href={active.intent_proof_link} text="View proof →" />}
            <DetailRow label="Source" value={formatSource(active.sources)} />
            {editable && (
              <>
                <input value={(active.linkedin_url || '') as string} onChange={(e) => setField('linkedin_url', e.target.value || null)} placeholder="LinkedIn URL" style={{ width: '100%', marginBottom: 8 }} />
                <input value={(active.website_link || '') as string} onChange={(e) => setField('website_link', e.target.value || null)} placeholder="Website URL" style={{ width: '100%', marginBottom: 8 }} />
                <input value={(active.intent_proof_link || '') as string} onChange={(e) => setField('intent_proof_link', e.target.value || null)} placeholder="Intent proof URL" style={{ width: '100%', marginBottom: 8 }} />
              </>
            )}
          </section>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intent & Engagement</h2>
          <DetailRow label="Intent Category" value={active.intent_category?.replace(/_/g, ' ')} />
          {editable && (
            <select value={(active.intent_category || '') as string} onChange={(e) => setField('intent_category', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }}>
              <option value="">Select intent category</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Both">Both</option>
            </select>
          )}
          {Array.isArray(active.intent_skills) && active.intent_skills.length > 0 && (
            <DetailRow label="Intent Skills" value={active.intent_skills.join(', ')} />
          )}
          <DetailRow label="LinkedIn Connection" value={active.linkedin_connection?.replace(/_/g, ' ')} />
          {editable && (
            <select value={(active.linkedin_connection || 'none') as string} onChange={(e) => setField('linkedin_connection', e.target.value)} style={{ width: '100%', marginBottom: 10 }}>
              <option value="none">none</option>
              <option value="invite">invite</option>
              <option value="connected">connected</option>
            </select>
          )}
          <DetailRow label="Priority" value={active.priority} />
          {editable && <input value={(active.priority || '') as string} onChange={(e) => setField('priority', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }} />}
        </div>

        {(active.about_prospect || editable) && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h2>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{active.about_prospect}</p>
            {editable && <textarea value={(active.about_prospect || '') as string} onChange={(e) => setField('about_prospect', e.target.value || null)} rows={4} style={{ width: '100%' }} />}
          </div>
        )}

        {(active.pitch_description || editable) && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pitch Description</h2>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{active.pitch_description}</p>
            {editable && <textarea value={(active.pitch_description || '') as string} onChange={(e) => setField('pitch_description', e.target.value || null)} rows={3} style={{ width: '100%', marginBottom: 10 }} />}
            {active.pitch_response && <DetailRow label="Pitch Response" value={active.pitch_response.replace(/_/g, ' ')} />}
            {editable && <input value={(active.pitch_response || '') as string} onChange={(e) => setField('pitch_response', e.target.value || null)} style={{ width: '100%' }} />}
            <h3 style={{ fontSize: '14px', marginTop: 14, marginBottom: 8, color: '#475569' }}>EM details</h3>
            <DetailRow label="EM Pitch Description" value={active.pitched_description_em} />
            <DetailRow label="EM Last Contacted" value={formatDate(active.last_contacted_at_em)} />
            <DetailRow label="EM Next Follow-up" value={formatDate(active.next_follow_up_em)} />
            <DetailRow label="EM Lead Score" value={active.lead_score_em} />
            {editable && (
              <>
                <textarea value={(active.pitched_description_em || '') as string} onChange={(e) => setField('pitched_description_em', e.target.value || null)} rows={3} style={{ width: '100%', marginBottom: 8 }} />
                <input type="date" value={active.next_follow_up_em ? String(active.next_follow_up_em).slice(0, 10) : ''} onChange={(e) => setField('next_follow_up_em', e.target.value ? `${e.target.value}T00:00:00.000Z` : null)} style={{ width: '100%', marginBottom: 8 }} />
                <input type="number" value={(active.lead_score_em ?? '') as number | ''} onChange={(e) => setField('lead_score_em', e.target.value === '' ? null : Number(e.target.value))} style={{ width: '100%' }} />
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <DetailRow label="Last Contacted" value={formatDate(active.last_contacted_at)} />
          <DetailRow label="Next Follow-up" value={formatDate(active.next_follow_up_date)} />
          <DetailRow label="Data Refined" value={formatDate(active.data_refined_date)} />
          <DetailRow label="Pitch Date" value={formatDate(active.pitch_date)} />
          <DetailRow label="Created" value={formatDate(active.created_at)} />
          <DetailRow label="Updated" value={formatDate(active.updated_at)} />
          {editable && (
            <>
              <input type="date" value={active.next_follow_up_date ? String(active.next_follow_up_date).slice(0, 10) : ''} onChange={(e) => setField('next_follow_up_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : null)} style={{ width: '100%' }} />
              <input type="number" value={(active.lead_score ?? '') as number | ''} onChange={(e) => setField('lead_score', e.target.value === '' ? null : Number(e.target.value))} style={{ width: '100%' }} />
            </>
          )}
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</h2>
          <DetailRow label="Captured By (DC&R)" value={active.user?.name || active.user?.email || '—'} />
          <DetailRow label="Assigned LH" value={active.lh_user?.name || active.lh_user?.email || '—'} />
          {editable && (
            <select value={(active.lh_user_id || '') as string} onChange={(e) => setField('lh_user_id', e.target.value || null)} style={{ width: '100%', marginBottom: 10 }}>
              <option value="">Unassigned</option>
              {eligibleLhUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          )}
          <DetailRow label="Assigned EM" value={active.em_user?.name || active.em_user?.email || '—'} />
          <DetailRow label="LinkedIn Profile" value={active.linkedin_profile?.name || '—'} />
          {active.campaign_name && <DetailRow label="Campaign" value={active.campaign_name} />}
          {editable && (
            <>
              <select value={(active.status || 'new') as string} onChange={(e) => setField('status', e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
                {Object.entries(STATUS_LABELS).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
              </select>
              <input value={(active.campaign_name || '') as string} onChange={(e) => setField('campaign_name', e.target.value || null)} placeholder="Campaign name" style={{ width: '100%' }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
