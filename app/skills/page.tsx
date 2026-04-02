'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../lib/api'
import TablePagination from '../components/TablePagination'
import { formatDatePKT } from '../lib/date'

interface Skill {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const paginatedSkills = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return skills.slice(start, start + rowsPerPage)
  }, [skills, page, rowsPerPage])

  useEffect(() => {
    setPage(1)
  }, [skills.length, rowsPerPage])

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/skills')
      setSkills(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch skills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const openCreateModal = () => {
    setEditingSkill(null)
    setFormName('')
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill)
    setFormName(skill.name)
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Skill name is required')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editingSkill) {
        await api.put(`/skills/${editingSkill.id}`, {
          name: formName.trim(),
        })
      } else {
        await api.post('/skills', {
          name: formName.trim(),
        })
      }
      setShowModal(false)
      fetchSkills()
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (skill: Skill) => {
    if (!confirm(`Are you sure you want to delete "${skill.name}"?`)) return
    try {
      await api.delete(`/skills/${skill.id}`)
      fetchSkills()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete skill')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills</h1>
          <p className="page-subtitle">Manage skills for your team</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + New Skill
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading skills...</p>}
      {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="card">
          {skills.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No skills yet. Click &quot;+ New Skill&quot; to create one.
            </p>
          ) : (
            <>
            <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td style={{ fontWeight: 500 }}>{skill.name}</td>
                    <td style={{ color: '#64748b' }}>
                      {formatDatePKT(skill.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(skill)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(skill)}>
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
              totalItems={skills.length}
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
            <h2 className="modal-title">{editingSkill ? 'Edit Skill' : 'Create New Skill'}</h2>

            <div className="form-group">
              <label className="form-label">
                Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter skill name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
                autoFocus
              />
            </div>

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{formError}</p>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingSkill ? 'Update Skill' : 'Create Skill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
