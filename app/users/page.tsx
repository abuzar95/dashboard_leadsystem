'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../lib/api'
import TablePagination from '../components/TablePagination'

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
  username: string | null
  name: string | null
  role: Role
  em_prospect_type: 'business' | 'individual' | null
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
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<Role>('DC_R')
  const [formLinkedinProfileId, setFormLinkedinProfileId] = useState('')
  const [formEmProspectType, setFormEmProspectType] = useState<'business' | 'individual' | ''>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return users.slice(start, start + rowsPerPage)
  }, [users, page, rowsPerPage])

  useEffect(() => {
    setPage(1)
  }, [users.length, rowsPerPage])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data)
      setError(null)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to fetch users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLinkedinProfiles = useCallback(async () => {
    try {
      const response = await api.get('/linkedin-profiles')
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
    setFormUsername('')
    setFormPassword('')
    setFormRole('DC_R')
    setFormLinkedinProfileId('')
    setFormEmProspectType('')
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormName(user.name || '')
    setFormEmail(user.email)
    setFormUsername(user.username || '')
    setFormPassword('')
    setFormRole(user.role)
    setFormLinkedinProfileId(user.linkedin_profile_id || '')
    setFormEmProspectType((user.em_prospect_type as 'business' | 'individual' | null) || '')
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formEmail.trim()) {
      setFormError('Email is required')
      return
    }
    if (!formUsername.trim()) {
      setFormError('Username is required for dashboard login')
      return
    }
    if (!editingUser && !formPassword) {
      setFormError('Password is required for new users')
      return
    }
    if (formRole === 'LH' && !formLinkedinProfileId) {
      setFormError('LinkedIn Profile is required for LH role')
      return
    }
    if (formRole === 'EM' && !formEmProspectType) {
      setFormError('Prospect type is required for EM role')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim() || null,
        email: formEmail.trim(),
        role: formRole,
        em_prospect_type: formRole === 'EM' ? formEmProspectType : null,
        linkedin_profile_id: formLinkedinProfileId || null,
      }
      if (formUsername.trim()) payload.username = formUsername.trim()
      if (formPassword) payload.password = formPassword
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload)
      } else {
        await api.post('/users', payload)
      }
      setShowModal(false)
      fetchUsers()
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data
        : undefined
      setFormError(data?.error || (err instanceof Error ? err.message : 'Failed to save user'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      fetchUsers()
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data
        : undefined
      alert(data?.error || 'Failed to delete user')
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
            <>
            <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>LinkedIn Profile</th>
                  <th>Created</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.name || '—'}</td>
                    <td>{user.username || '—'}</td>
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
            </div>
            <TablePagination
              totalItems={users.length}
              page={page}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
            />
            </>
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
                Username <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="For dashboard login"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {editingUser ? 'New password (leave blank to keep current)' : 'Password'}
                {!editingUser && <span style={{ color: '#dc2626' }}> *</span>}
              </label>
              <input
                className="form-input"
                type="password"
                placeholder={editingUser ? 'Leave blank to keep current' : 'Set password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                autoComplete={editingUser ? 'new-password' : 'new-password'}
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
                  if (newRole !== 'EM') setFormEmProspectType('')
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

            {formRole === 'EM' && (
              <div className="form-group">
                <label className="form-label">
                  Prospect Type <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formEmProspectType}
                  onChange={(e) => setFormEmProspectType(e.target.value as 'business' | 'individual' | '')}
                >
                  <option value="">Select prospect type</option>
                  <option value="business">Business</option>
                  <option value="individual">Individual</option>
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
