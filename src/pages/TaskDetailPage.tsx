import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { taskApi, commentApi, attachmentApi } from '../server/services'
import { useAuth } from '../context/AuthContext'
import type { Task, Comment, Attachment } from '../types'
import { StatusBadge, PriorityBadge } from '../component/tasks/StatusBadge'
import TaskModal from '../component/tasks/TaskModal'
import { ArrowLeft, Edit2, Trash2, CheckCircle, MessageSquare, Paperclip, Download, X, Send } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import './TaskDetailPage.css'

export default function TaskDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [task,        setTask]        = useState<Task | null>(null)
  const [comments,    setComments]    = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showEdit,    setShowEdit]    = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [completing,  setCompleting]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchAll = async () => {
    if (!id) return
    try {
      const [t, c, a] = await Promise.all([
        taskApi.get(id),
        commentApi.list(id, { page: 0, size: 50 }),
        attachmentApi.list(id),
      ])
      setTask(t.data.data)
      setComments(c.data.data.content)
      setAttachments(a.data.data)
    } catch {
      toast.error('Failed to load task')
      navigate('/tasks')
    } finally {
      setLoading(false)
    }
  }

  async function downloadFile(attachmentId: string, filename: string) {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`/api/v1/attachments/download/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`)
  }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

  useEffect(() => { fetchAll() }, [id])

  const handleComplete = async () => {
    if (!task) return
    setCompleting(true)
    try {
      const { data } = await taskApi.complete(task.id)
      setTask(data.data)
      toast.success('Task marked as completed!')
    } catch {
      toast.error('Failed to complete task')
    } finally {
      setCompleting(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task? This cannot be undone.')) return
    try {
      await taskApi.delete(task.id)
      toast.success('Task deleted')
      navigate('/tasks')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!task || !commentText.trim()) return
    setSubmitting(true)
    try {
      const { data } = await commentApi.add(task.id, commentText.trim())
      setComments(prev => [...prev, data.data])
      setCommentText('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.delete(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return
    setUploading(true)
    try {
      const { data } = await attachmentApi.upload(task.id, file)
      setAttachments(prev => [...prev, data.data])
      toast.success('File uploaded!')
    } catch {
      toast.error('Upload failed — check file type and size (max 10 MB)')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handledownloadAttachment = async (attachmentId: string) => {
    try {
      await attachmentApi.downloadUrl(attachmentId)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      toast.success('Attachment downloaded')
    } catch {
      toast.error('Failed to download attachment')
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await attachmentApi.delete(attachmentId)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      toast.success('Attachment deleted')
    } catch {
      toast.error('Failed to delete attachment')
    }
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  if (!task) return null

  const isCreator   = task.creator?.id === user?.id
  const isAssignee  = task.assignee?.id === user?.id
  const canModify   = isCreator
  const canComplete = isCreator || isAssignee

  return (
    <div className="page">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="task-detail-grid">
        {/* ── Left: Main content ── */}
        <div className="task-detail-main">
          {/* Header */}
          <div className="task-detail-header">
            <div className="task-detail-badges">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.teamName && <span className="team-chip-lg">{task.teamName}</span>}
            </div>
            <div className="task-detail-actions">
              {canComplete && task.status !== 'COMPLETED' && (
                <button className="btn btn-ghost btn-sm" onClick={handleComplete} disabled={completing}>
                  <CheckCircle size={14} />
                  {completing ? 'Completing…' : 'Mark Complete'}
                </button>
              )}
              {canModify && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <h1 className="task-detail-title">{task.title}</h1>

          {task.description && (
            <p className="task-detail-desc">{task.description}</p>
          )}

          {/* Comments */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <MessageSquare size={15} /> Comments ({comments.length})
            </h3>

            <div className="comments-list">
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '12px 0' }}>No comments yet. Be the first!</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">{c.author.username[0].toUpperCase()}</div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.author.username}</span>
                      <span className="comment-time">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                      {c.author.id === user?.id && (
                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                          onClick={() => handleDeleteComment(c.id)}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <p className="comment-content">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <input className="input" placeholder="Write a comment…"
                value={commentText} onChange={e => setCommentText(e.target.value)} />
              <button className="btn btn-primary btn-icon" type="submit"
                disabled={submitting || !commentText.trim()}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
              </button>
            </form>
          </div>

          {/* Attachments */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <Paperclip size={15} /> Attachments ({attachments.length})
            </h3>

            <div className="attachment-list">
              {attachments.map(a => (
                <div key={a.id} className="attachment-item">
                  <Paperclip size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  <span className="attachment-name">{a.originalFileName}</span>
                  <span className="attachment-size">{(a.fileSize / 1024).toFixed(1)} KB</span>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Download"
                    onClick={async () => {
                      try {
                        await downloadFile(a.id, a.originalFileName)
                      } catch {
                        toast.error('Download failed — please try again')
                      }
                    }}
                  >
                    <Download size={13} />
                  </button>
                  {(isCreator || a.uploadedBy.id === user?.id) && (
                    <button className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleDeleteAttachment(a.id)}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <input ref={fileRef} type="file" hidden onChange={handleFileUpload} />
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}
                disabled={uploading}>
                <Paperclip size={14} />
                {uploading ? 'Uploading…' : 'Attach File'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar info ── */}
        <aside className="task-detail-sidebar">
          <div className="sidebar-info-card">
            <div className="info-row">
              <span className="info-label">Created by</span>
              <span className="info-value">{task.creator?.username ?? '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Assigned to</span>
              <span className="info-value">{task.assignee?.username ?? 'Unassigned'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Due date</span>
              <span className="info-value">
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Created</span>
              <span className="info-value">{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            </div>
            {task.completedAt && (
              <div className="info-row">
                <span className="info-label">Completed</span>
                <span className="info-value" style={{ color: 'var(--green)' }}>
                  {format(new Date(task.completedAt), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {showEdit && (
        <TaskModal task={task} onClose={() => setShowEdit(false)}
          onSaved={updated => { setTask(updated); setShowEdit(false); toast.success('Task updated!') }} />
      )}
    </div>
  )
}