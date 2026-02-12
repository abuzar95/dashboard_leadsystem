'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/skills`)
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
        await axios.put(`${API_URL}/skills/${editingSkill.id}`, {
          name: formName.trim(),
        })
      } else {
        await axios.post(`${API_URL}/skills`, {
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
      await axios.delete(`${API_URL}/skills/${skill.id}`)
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td style={{ fontWeight: 500 }}>{skill.name}</td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(skill.created_at).toLocaleDateString()}
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
