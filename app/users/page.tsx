'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const ROLES = ['admin', 'DC_R', 'LH', 'EM'] as const
type Role = typeof ROLES[number]

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  DC_R: 'DC&R',
  LH: 'LH',
  EM: 'EM',
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-purple',
  DC_R: 'badge-blue',
  LH: 'badge-green',
  EM: 'badge-orange',
}

interface LinkedInProfileRef {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string | null
  role: Role
  linkedin_profile_id: string | null
  linkedin_profile: LinkedInProfileRef | null
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkedinProfiles, setLinkedinProfiles] = useState<LinkedInProfileRef[]>([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<Role>('DC_R')
  const [formLinkedinProfileId, setFormLinkedinProfileId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/users`)
      setUsers(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLinkedinProfiles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/linkedin-profiles`)
      setLinkedinProfiles(response.data)
    } catch {
      setLinkedinProfiles([])
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchLinkedinProfiles()
  }, [fetchUsers, fetchLinkedinProfiles])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormRole('DC_R')
    setFormLinkedinProfileId('')
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormName(user.name || '')
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormLinkedinProfileId(user.linkedin_profile_id || '')
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formEmail.trim()) {
      setFormError('Email is required')
      return
    }
    if (formRole === 'LH' && !formLinkedinProfileId) {
      setFormError('LinkedIn Profile is required for LH role')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: formName.trim() || null,
        email: formEmail.trim(),
        role: formRole,
        linkedin_profile_id: formLinkedinProfileId || null,
      }
      if (editingUser) {
        await axios.put(`${API_URL}/users/${editingUser.id}`, payload)
      } else {
        await axios.post(`${API_URL}/users`, payload)
      }
      setShowModal(false)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) return
    try {
      await axios.delete(`${API_URL}/users/${user.id}`)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">Create users and assign roles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + New User
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading users...</p>}
      {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="card">
          {users.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No users yet. Click &quot;+ New User&quot; to create one.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>LinkedIn Profile</th>
                  <th>Created</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.name || '—'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[user.role] || 'badge-slate'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>
                      {user.linkedin_profile?.name || '—'}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(user)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user)}>
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
            <h2 className="modal-title">{editingUser ? 'Edit User' : 'Create New User'}</h2>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter email address"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formRole}
                onChange={(e) => {
                  const newRole = e.target.value as Role
                  setFormRole(newRole)
                  if (newRole !== 'LH') setFormLinkedinProfileId('')
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {formRole === 'LH' && (
              <div className="form-group">
                <label className="form-label">
                  LinkedIn Profile <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formLinkedinProfileId}
                  onChange={(e) => setFormLinkedinProfileId(e.target.value)}
                >
                  <option value="">Select LinkedIn profile</option>
                  {linkedinProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{formError}</p>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
