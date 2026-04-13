import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { teamApi } from '../server/services'
import type { Team } from '../types'
import { Plus, Users, X, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import './TeamsPage.css'

export default function TeamsPage() {
  const [teams,      setTeams]      = useState<Team[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    teamApi.myTeams({ page: 0, size: 50 })
      .then(r => setTeams(r.data.data.content))
      .finally(() => setLoading(false))
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Team name is required'); return }
    setSubmitting(true)
    try {
      const { data } = await teamApi.create(form)
      setTeams(prev => [data.data, ...prev])
      setShowModal(false)
      setForm({ name: '', description: '' })
      toast.success('Team created!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Collaborate with your team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Team
        </button>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : teams.length === 0 ? (
        <div className="empty">
          <Users size={40} />
          <p>No teams yet</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create your first team
          </button>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team, i) => (
            <Link key={team.id} to={`/teams/${team.id}`}
              className="team-card fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="team-card-icon">{team.name[0].toUpperCase()}</div>
              <div className="team-card-body">
                <h3 className="team-card-name">{team.name}</h3>
                {team.description && <p className="team-card-desc">{team.description}</p>}
                <div className="team-card-meta">
                  <div className="member-avatars">
                    {team.members.slice(0, 4).map(m => (
                      <div key={m.id} className="member-avatar-xs" title={m.username}>
                        {m.username[0].toUpperCase()}
                      </div>
                    ))}
                    {team.memberCount > 4 && (
                      <div className="member-avatar-xs more">+{team.memberCount - 4}</div>
                    )}
                  </div>
                  <span className="team-meta-text">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <ArrowRight size={16} className="team-card-arrow" />
            </Link>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Team</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label className="label">Team Name *</label>
                <input className="input" placeholder="e.g. Backend Guild" value={form.name} onChange={set('name')} required />
              </div>
              <div className="field">
                <label className="label">Description</label>
                <textarea className="input" placeholder="What does this team work on?" value={form.description} onChange={set('description')} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" />Creating…</> : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}