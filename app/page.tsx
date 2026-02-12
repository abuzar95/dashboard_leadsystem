'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
  created_at: string
  updated_at: string
}

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProspects()
  }, [])

  const fetchProspects = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/prospects`)
      setProspects(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prospects')
      console.error('Error fetching prospects:', err)
    } finally {
      setLoading(false)
    }
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
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>All Prospects ({prospects.length})</h2>
            <button 
              onClick={fetchProspects}
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
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  {prospects.map((prospect) => (
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
          )}
        </div>
      )}
    </div>
  )
}
