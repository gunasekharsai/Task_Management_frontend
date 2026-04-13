import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { teamApi } from '../server/services'
import type { Notification, NotificationType } from '../types'
import { Bell, CheckCheck, CheckSquare, Users, MessageSquare, UserPlus, Loader } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import './NotificationsPage.css'

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  TASK_ASSIGNED:  <CheckSquare   size={15} />,
  TASK_UPDATED:   <CheckSquare   size={15} />,
  TASK_COMPLETED: <CheckSquare   size={15} />,
  COMMENT_ADDED:  <MessageSquare size={15} />,
  TEAM_INVITE:    <UserPlus      size={15} />,
  TEAM_JOINED:    <Users         size={15} />,
}

const TYPE_COLOR: Record<NotificationType, string> = {
  TASK_ASSIGNED:  'var(--blue)',
  TASK_UPDATED:   'var(--accent)',
  TASK_COMPLETED: 'var(--green)',
  COMMENT_ADDED:  'var(--purple)',
  TEAM_INVITE:    'var(--accent)',
  TEAM_JOINED:    'var(--green)',
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, fetchNotifications } = useNotifications()
  const navigate = useNavigate()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  // Re-fetch when page opens
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleClick = async (n: Notification) => {
    // Always mark as read on click
    if (!n.read) await markRead(n.id)

    switch (n.type) {
      // ── Team invite: accept directly from notification ─────────────────────
      case 'TEAM_INVITE': {
        if (!n.referenceId) {
          toast.error('Invite token not found')
          return
        }
        setAcceptingId(n.id)
        try {
          const { data } = await teamApi.acceptInvite(n.referenceId)
          toast.success(`You joined ${data.data.name}!`)
          navigate(`/teams/${data.data.id}`)
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          toast.error(msg ?? 'Invite is invalid or has expired')
        } finally {
          setAcceptingId(null)
        }
        break
      }

      // ── Task notifications: navigate to the task ───────────────────────────
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
      case 'TASK_COMPLETED':
      case 'COMMENT_ADDED': {
        if (n.referenceId) navigate(`/tasks/${n.referenceId}`)
        break
      }

      // ── Team joined: navigate to the team ─────────────────────────────────
      case 'TEAM_JOINED': {
        if (n.referenceId) navigate(`/teams/${n.referenceId}`)
        break
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty">
          <Bell size={40} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n, i) => (
            <NotificationItem
              key={n.id}
              notification={n}
              index={i}
              accepting={acceptingId === n.id}
              onClick={handleClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n, index, accepting, onClick,
}: {
  notification: Notification
  index:        number
  accepting:    boolean
  onClick:      (n: Notification) => void
}) {
  const isClickable = Boolean(n.referenceId)

  return (
    <div
      className={`notif-item fade-up${n.read ? '' : ' unread'}${isClickable ? ' clickable' : ''}`}
      style={{ animationDelay: `${index * 0.03}s` }}
      onClick={() => isClickable && onClick(n)}
    >
      <div
        className="notif-icon"
        style={{
          background: TYPE_COLOR[n.type] + '22',
          color:      TYPE_COLOR[n.type],
        }}
      >
        {accepting
          ? <Loader size={15} className="notif-spin" />
          : TYPE_ICON[n.type]}
      </div>

      <div className="notif-body">
        <p className="notif-message">{n.message}</p>

        {/* Invite action hint */}
        {n.type === 'TEAM_INVITE' && !accepting && (
          <span className="notif-action-hint">
            {n.read ? 'Click to join team' : '👆 Click to accept invite'}
          </span>
        )}

        <span className="notif-time">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </div>

      {accepting && (
        <span className="notif-accepting">Joining…</span>
      )}
      {!n.read && !accepting && <div className="notif-dot" />}
    </div>
  )
}