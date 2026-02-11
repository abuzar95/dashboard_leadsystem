'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Prospect {
  id: string
  name: string | null
  email: string | null
  job_title: string | null
  company_name: string | null
  website_link: string | null
  linkedin_url: string | null
  category: string | null
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
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: prospect.status === 'new' ? '#e3f2fd' : '#f3e5f5',
                          color: prospect.status === 'new' ? '#1976d2' : '#7b1fa2',
                          fontSize: '12px'
                        }}>
                          {prospect.status}
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
