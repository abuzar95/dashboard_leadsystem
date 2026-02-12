'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const NICHES = ['Individual', 'Business', 'Both'] as const
type Niche = typeof NICHES[number]

const NICHE_BADGE: Record<Niche, string> = {
  Individual: 'badge-orange',
  Business: 'badge-green',
  Both: 'badge-purple',
}

interface LinkedInProfile {
  id: string
  name: string
  niche: Niche | null
  created_at: string
  updated_at: string
}

export default function LinkedInProfilesPage() {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<LinkedInProfile | null>(null)
  const [formName, setFormName] = useState('')
  const [formNiche, setFormNiche] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/linkedin-profiles`)
      setProfiles(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch LinkedIn profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const openCreateModal = () => {
    setEditingProfile(null)
    setFormName('')
    setFormNiche('')
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (profile: LinkedInProfile) => {
    setEditingProfile(profile)
    setFormName(profile.name)
    setFormNiche(profile.niche || '')
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Profile name is required')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload: { name: string; niche: string | null } = {
        name: formName.trim(),
        niche: formNiche || null,
      }
      if (editingProfile) {
        await axios.put(`${API_URL}/linkedin-profiles/${editingProfile.id}`, payload)
      } else {
        await axios.post(`${API_URL}/linkedin-profiles`, payload)
      }
      setShowModal(false)
      fetchProfiles()
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (profile: LinkedInProfile) => {
    if (!confirm(`Are you sure you want to delete "${profile.name}"?`)) return
    try {
      await axios.delete(`${API_URL}/linkedin-profiles/${profile.id}`)
      fetchProfiles()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete profile')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">LinkedIn Profiles</h1>
          <p className="page-subtitle">Manage LinkedIn profiles and their niche</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + New Profile
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading profiles...</p>}
      {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="card">
          {profiles.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No LinkedIn profiles yet. Click &quot;+ New Profile&quot; to create one.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Niche</th>
                  <th>Date</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td style={{ fontWeight: 500 }}>{profile.name}</td>
                    <td>
                      {profile.niche ? (
                        <span className={`badge ${NICHE_BADGE[profile.niche] || 'badge-slate'}`}>
                          {profile.niche}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(profile)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(profile)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingProfile ? 'Edit LinkedIn Profile' : 'Create LinkedIn Profile'}</h2>

            <div className="form-group">
              <label className="form-label">
                Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Sabeeh - CTO"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Niche</label>
              <select
                className="form-select"
                value={formNiche}
                onChange={(e) => setFormNiche(e.target.value)}
              >
                <option value="">Select niche</option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{formError}</p>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
