import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { taskApi, teamApi } from '../server/services'
import { useAuth } from '../context/AuthContext'
import type { Task, Team } from '../types'
import { CheckSquare, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge, PriorityBadge } from '../component/tasks/StatusBadge'
import './Dashboard.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [teams,   setTeams]   = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      taskApi.myTasks({ page: 0, size: 6, sortBy: 'createdAt', direction: 'desc' }),
      teamApi.myTeams({ page: 0, size: 10 }),
    ]).then(([t, tm]) => {
      setTasks(t.data.data.content)
      setTeams(tm.data.data.content)
    }).finally(() => setLoading(false))
  }, [])

  const open   = tasks.filter(t => t.status === 'OPEN').length
  const inProg = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const done   = tasks.filter(t => t.status === 'COMPLETED').length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good to see you, {user?.username} 👋</h1>
          <p className="page-subtitle">Here's what's happening in your workspace</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {([
          { label: 'Open',        value: open,         icon: CheckSquare, color: 'blue'   },
          { label: 'In Progress', value: inProg,        icon: TrendingUp,  color: 'accent' },
          { label: 'Completed',   value: done,          icon: Clock,       color: 'green'  },
          { label: 'Teams',       value: teams.length,  icon: Users,       color: 'purple' },
        ] as const).map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card stat-${color}`}>
            <div className="stat-icon"><Icon size={18} /></div>
            <div className="stat-value">{loading ? '—' : value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Recent tasks */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Recent Tasks</h2>
            <Link to="/tasks" className="see-all">See all <ArrowRight size={13} /></Link>
          </div>
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : tasks.length === 0 ? (
            <div className="empty"><CheckSquare size={36} /><p>No tasks yet</p></div>
          ) : (
            <div className="task-list-mini">
              {tasks.map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="task-row-mini">
                  <div className="task-row-left">
                    <StatusBadge status={task.status} />
                    <span className="task-row-title">{task.title}</span>
                  </div>
                  <div className="task-row-right">
                    <PriorityBadge priority={task.priority} />
                    <span className="task-row-date">
                      {task.dueDate
                        ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
                        : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">My Teams</h2>
            <Link to="/teams" className="see-all">See all <ArrowRight size={13} /></Link>
          </div>
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : teams.length === 0 ? (
            <div className="empty"><Users size={36} /><p>No teams yet</p></div>
          ) : (
            <div className="team-list-mini">
              {teams.map(team => (
                <Link key={team.id} to={`/teams/${team.id}`} className="team-row-mini">
                  <div className="team-avatar-mini">{team.name[0].toUpperCase()}</div>
                  <div className="team-row-info">
                    <span className="team-row-name">{team.name}</span>
                    <span className="team-row-meta">{team.memberCount} members</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}