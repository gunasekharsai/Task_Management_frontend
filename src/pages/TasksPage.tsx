import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { taskApi } from '../server/services'
import type { Task, TaskStatus } from '../types'
import { Plus, Search, CheckSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge, PriorityBadge } from '../component/tasks/StatusBadge'
import TaskModal from '../component/tasks/TaskModal'
import toast from 'react-hot-toast'
import './TasksPage.css'

const STATUSES: Array<TaskStatus | 'ALL'> = ['ALL', 'OPEN', 'COMPLETED']

export default function TasksPage() {
  const [tasks,      setTasks]      = useState<Task[]>([])
  const [loading,    setLoading]    = useState(true)
  const [status,     setStatus]     = useState<TaskStatus | 'ALL'>('ALL')
  const [keyword,    setKeyword]    = useState('')
  const [page,       setPage]       = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal,  setShowModal]  = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = keyword.trim()
        ? await taskApi.search({ keyword: keyword.trim(), page, size: 20 })
        : await taskApi.myTasks({ status: status === 'ALL' ? undefined : status, page, size: 20, sortBy: 'createdAt', direction: 'desc' })
      setTasks(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [status, keyword, page])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [keyword, status])

  const handleCreated = (task: Task) => {
    setTasks(prev => [task, ...prev])
    setShowModal(false)
    toast.success('Task created!')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">All tasks assigned to you</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input className="input search-input" placeholder="Search tasks…"
            value={keyword} onChange={e => setKeyword(e.target.value)} />
        </div>
        <div className="status-tabs">
          {STATUSES.map(s => (
            <button key={s}
              className={'status-tab' + (status === s ? ' active' : '')}
              onClick={() => setStatus(s)}>
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <CheckSquare size={40} />
          <p>No tasks found</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create your first task
          </button>
        </div>
      ) : (
        <>
          <div className="tasks-table">
            <div className="tasks-table-header">
              <span>Title</span><span>Status</span><span>Priority</span><span>Due Date</span><span>Team</span>
            </div>
            {tasks.map((task, i) => (
              <Link key={task.id} to={`/tasks/${task.id}`}
                className="tasks-table-row fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}>
                <span className="task-title-cell">{task.title}</span>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className="task-date-cell">
                  {task.dueDate
                    ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
                    : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </span>
                <span className="task-team-cell">
                  {task.teamName
                    ? <span className="team-chip">{task.teamName}</span>
                    : <span style={{ color: 'var(--text-3)' }}>Personal</span>}
                </span>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span className="page-info">Page {page + 1} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={handleCreated} />}
    </div>
  )
}



