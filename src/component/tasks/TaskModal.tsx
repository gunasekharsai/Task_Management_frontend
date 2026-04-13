import { useState, useEffect } from 'react'
import { taskApi, teamApi } from '../../server/services'
import type { Task, Team, User, CreateTaskPayload, UpdateTaskPayload, TaskPriority } from '../../types'
import { X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface TaskModalProps {
  onClose:  () => void
  onSaved:  (task: Task) => void
  task?:    Task | null
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function TaskModal({ onClose, onSaved, task = null }: TaskModalProps) {
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    priority:    (task?.priority   ?? 'MEDIUM') as TaskPriority,
    dueDate:     task?.dueDate     ?? '',
    teamId:      task?.teamId      ?? '',
    assigneeId:  task?.assignee?.id ?? '',
  })
  const [teams,     setTeams]     = useState<Team[]>([])
  const [members,   setMembers]   = useState<User[]>([])
  const [loading,   setLoading]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    teamApi.myTeams({ page: 0, size: 50 }).then(r => setTeams(r.data.data.content))
  }, [])

  useEffect(() => {
    if (!form.teamId) { setMembers([]); return }
    teamApi.get(form.teamId).then(r => setMembers(r.data.data.members ?? []))
  }, [form.teamId])

  const handleAiGenerate = async () => {
    if (!form.title.trim()) { toast.error('Enter a title first'); return }
    setAiLoading(true)
    try {
      const { data } = await taskApi.generateDescription(form.title)
      setForm(f => ({ ...f, description: data.data.description }))
      toast.success('Description generated!')
    } catch {
      toast.error('AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("logging task", task);

    if (!form.title.trim()) { toast.error('Title is required'); return }
    setLoading(true)
    try {
      const payload: CreateTaskPayload | UpdateTaskPayload = {
        title:       form.title,
        description: form.description || undefined,
        priority:    form.priority,
        dueDate:     form.dueDate || undefined,
        teamId:      form.teamId || undefined,
        assigneeId:  form.assigneeId || undefined,
      }
      const { data } = isEdit
        ? await taskApi.update(task!.id, payload as UpdateTaskPayload)
        : await taskApi.create(payload as CreateTaskPayload)
      onSaved(data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (isEdit ? 'Failed to update task' : 'Failed to create task'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="field">
            <label className="label">Title *</label>
            <input className="input" placeholder="What needs to be done?"
              value={form.title} onChange={set('title')} required />
          </div>

          <div className="field">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <label className="label">Description</label>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={handleAiGenerate} disabled={aiLoading}
                style={{ fontSize:12, padding:'4px 10px' }}>
                {aiLoading ? <><span className="spinner" style={{ width:12, height:12 }} />Generating…</>
                           : <><Sparkles size={12} />AI Generate</>}
              </button>
            </div>
            <textarea className="input" placeholder="Describe the task…"
              value={form.description} onChange={set('description')} rows={4} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="field">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div className="field">
            <label className="label">Team (optional)</label>
            <select className="input" value={form.teamId} onChange={set('teamId')}>
              <option value="">— Personal task —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {members.length > 0 && (
            <div className="field">
              <label className="label">Assign to</label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">— Unassigned —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
              </select>
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />{isEdit ? 'Saving…' : 'Creating…'}</>
                       : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}