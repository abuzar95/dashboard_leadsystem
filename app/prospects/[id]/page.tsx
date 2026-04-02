'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'
import { formatDatePKT } from '../../lib/date'

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
  const params = useParams()
  const id = params?.id as string
  const [prospect, setProspect] = useState<ProspectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .get(`/prospects/${id}`)
      .then((r) => setProspect(r.data))
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Prospect not found' : err.message || 'Failed to load prospect')
      })
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (d: string | null | undefined) => formatDatePKT(d)
  const formatSource = (s: string | null | undefined) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—')

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

  const statusStyle = STATUS_STYLE[prospect.status] || { bg: '#f1f5f9', text: '#475569' }

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
      </header>

      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{prospect.name || 'Unnamed Prospect'}</h1>
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
            {STATUS_LABELS[prospect.status] || prospect.status}
          </span>
          {prospect.lead_score != null && (
            <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontSize: '13px', fontWeight: 600 }}>
              Score: {prospect.lead_score}
            </span>
          )}
          {prospect.category && (
            <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', fontSize: '13px' }}>
              {prospect.category.replace(/_/g, '-')}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Company</h2>
            <DetailRow label="Company" value={prospect.company_name} />
            <DetailRow label="Job Title" value={prospect.job_title} />
            <DetailRow label="Email" value={prospect.email} />
            <DetailRow label="Location" value={prospect.location} />
            <DetailRow label="Company Size" value={prospect.company_size} />
            {prospect.email && (
              <div style={{ marginTop: '8px' }}>
                <a href={`mailto:${prospect.email}`} style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'underline' }}>
                  Send email →
                </a>
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Links & Source</h2>
            {prospect.linkedin_url && <DetailLink label="LinkedIn" href={prospect.linkedin_url} text="Open LinkedIn →" />}
            {prospect.website_link && (
              <DetailLink
                label="Website"
                href={prospect.website_link.startsWith('http') ? prospect.website_link : `https://${prospect.website_link}`}
                text="Open website →"
              />
            )}
            {prospect.intent_proof_link && <DetailLink label="Intent Proof" href={prospect.intent_proof_link} text="View proof →" />}
            <DetailRow label="Source" value={formatSource(prospect.sources)} />
          </section>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intent & Engagement</h2>
          <DetailRow label="Intent Category" value={prospect.intent_category?.replace(/_/g, ' ')} />
          {Array.isArray(prospect.intent_skills) && prospect.intent_skills.length > 0 && (
            <DetailRow label="Intent Skills" value={prospect.intent_skills.join(', ')} />
          )}
          <DetailRow label="LinkedIn Connection" value={prospect.linkedin_connection?.replace(/_/g, ' ')} />
          <DetailRow label="Priority" value={prospect.priority} />
        </div>

        {prospect.about_prospect && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h2>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{prospect.about_prospect}</p>
          </div>
        )}

        {prospect.pitch_description && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pitch Description</h2>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{prospect.pitch_description}</p>
            {prospect.pitch_response && <DetailRow label="Pitch Response" value={prospect.pitch_response.replace(/_/g, ' ')} />}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <DetailRow label="Last Contacted" value={formatDate(prospect.last_contacted_at)} />
          <DetailRow label="Next Follow-up" value={formatDate(prospect.next_follow_up_date)} />
          <DetailRow label="Data Refined" value={formatDate(prospect.data_refined_date)} />
          <DetailRow label="Pitch Date" value={formatDate(prospect.pitch_date)} />
          <DetailRow label="Created" value={formatDate(prospect.created_at)} />
          <DetailRow label="Updated" value={formatDate(prospect.updated_at)} />
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</h2>
          <DetailRow label="Captured By (DC&R)" value={prospect.user?.name || prospect.user?.email || '—'} />
          <DetailRow label="Assigned LH" value={prospect.lh_user?.name || prospect.lh_user?.email || '—'} />
          <DetailRow label="Assigned EM" value={prospect.em_user?.name || prospect.em_user?.email || '—'} />
          <DetailRow label="LinkedIn Profile" value={prospect.linkedin_profile?.name || '—'} />
          {prospect.campaign_name && <DetailRow label="Campaign" value={prospect.campaign_name} />}
        </div>
      </div>
    </div>
  )
}
