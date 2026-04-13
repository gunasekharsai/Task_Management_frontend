import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
// import { useNotifications } from '../../context/NotificationContext'
import { LayoutDashboard, CheckSquare, Users, Bell, User, LogOut, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import './AppLayout.css'

interface NavItem { to: string; icon: React.FC<{ size?: number }>; label: string }

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/tasks',         icon: CheckSquare,      label: 'My Tasks'      },
  { to: '/teams',         icon: Users,            label: 'Teams'         },
  { to: '/notifications', icon: Bell,             label: 'Notifications' },
  { to: '/profile',       icon: User,             label: 'Profile'       },
]

export default function AppLayout() {
  const { user, logout }   = useAuth()
//   const { unreadCount }    = useNotifications()
  const navigate           = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Zap size={20} fill="currentColor" />
          <span>TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <div className="nav-icon-wrap">
                <Icon size={16} />
                {/* {label === 'Notifications' && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )} */}
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar-sm">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user?.username}</span>
              <span className="sidebar-email">{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}