import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { teamApi, taskApi } from '../server/services'
import { useAuth } from '../context/AuthContext'
import type { Team, Task } from '../types'
import { StatusBadge, PriorityBadge } from '../component/tasks/StatusBadge'
import TaskModal from '../component/tasks/TaskModal'
import { ArrowLeft, UserPlus, Trash2, LogOut, Plus, X, Users, CheckSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import './TeamDetailPage.css'

export default function TeamDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [team,        setTeam]        = useState<Team | null>(null)
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showInvite,  setShowInvite]  = useState(false)
  const [showTask,    setShowTask]    = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting,    setInviting]    = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      teamApi.get(id),
      taskApi.teamTasks(id, { page: 0, size: 20 }),
    ]).then(([t, ts]) => {
      setTeam(t.data.data)
      setTasks(ts.data.data.content)
    }).catch(() => {
      toast.error('Failed to load team')
      navigate('/teams')
    }).finally(() => setLoading(false))
  }, [id])

  const isOwner = team?.owner.id === user?.id

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!team || !inviteEmail.trim()) return
    setInviting(true)
    try {
      await teamApi.invite(team.id, inviteEmail.trim())
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInvite(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!team || !confirm(`Remove ${username} from the team?`)) return
    try {
      await teamApi.removeMember(team.id, memberId)
      setTeam(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId), memberCount: prev.memberCount - 1 } : prev)
      toast.success(`${username} removed`)
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const handleLeave = async () => {
    if (!team || !confirm('Leave this team?')) return
    try {
      await teamApi.leave(team.id)
      toast.success('You left the team')
      navigate('/teams')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to leave team')
    }
  }

  const handleDeleteTeam = async () => {
    if (!team || !confirm('Delete this team? This cannot be undone.')) return
    try {
      await teamApi.delete(team.id)
      toast.success('Team deleted')
      navigate('/teams')
    } catch {
      toast.error('Failed to delete team')
    }
  }

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev])
    setShowTask(false)
    toast.success('Task created!')
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  if (!team) return null

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="team-detail-header">
        <div className="team-detail-hero">
          <div className="team-detail-icon">{team.name[0].toUpperCase()}</div>
          <div>
            <h1 className="page-title">{team.name}</h1>
            {team.description && <p className="page-subtitle">{team.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isOwner && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>
                <UserPlus size={14} /> Invite
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteTeam}>
                <Trash2 size={14} /> Delete Team
              </button>
            </>
          )}
          {!isOwner && (
            <button className="btn btn-ghost btn-sm" onClick={handleLeave}>
              <LogOut size={14} /> Leave Team
            </button>
          )}
        </div>
      </div>

      <div className="team-detail-grid">
        {/* Members */}
        <div>
          <div className="section-header-row">
            <h2 className="section-heading"><Users size={15} /> Members ({team.memberCount})</h2>
          </div>
          <div className="members-list">
            {team.members.map(m => (
              <div key={m.id} className="member-row">
                <div className="member-avatar-md">{m.username[0].toUpperCase()}</div>
                <div className="member-info">
                  <span className="member-name">{m.username}</span>
                  <span className="member-email">{m.email}</span>
                </div>
                {m.id === team.owner.id && <span className="owner-badge">Owner</span>}
                {isOwner && m.id !== team.owner.id && (
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => handleRemoveMember(m.id, m.username)}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="section-header-row">
            <h2 className="section-heading"><CheckSquare size={15} /> Tasks ({tasks.length})</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowTask(true)}>
              <Plus size={14} /> Add Task
            </button>
          </div>
          <div className="team-tasks-list">
            {tasks.length === 0 && (
              <div className="empty" style={{ padding: '32px 0' }}>
                <CheckSquare size={32} /><p>No tasks yet</p>
              </div>
            )}
            {tasks.map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="team-task-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <StatusBadge status={task.status} />
                  <span className="team-task-title">{task.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <PriorityBadge priority={task.priority} />
                  {task.assignee && (
                    <span className="task-assignee-chip">{task.assignee.username}</span>
                  )}
                  {task.dueDate && (
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Invite Member</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowInvite(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="colleague@example.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                They'll receive an invite link valid for 7 days.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? <><span className="spinner" />Sending…</> : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTask && (
        <TaskModal onClose={() => setShowTask(false)} onSaved={handleTaskCreated} />
      )}
    </div>
  )
}


