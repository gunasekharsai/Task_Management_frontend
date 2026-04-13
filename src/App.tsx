import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import AppLayout        from './component/layout/AppLayout'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import DashboardPage    from './pages/DashboardPage'
import TasksPage        from './pages/TasksPage'
import TaskDetailPage   from './pages/TaskDetailPage'
import TeamsPage        from './pages/TeamsPage'
import TeamDetailPage   from './pages/TeamDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage      from './pages/ProfilePage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={
        <ProtectedRoute>
          <NotificationProvider>
            <AppLayout />
          </NotificationProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<DashboardPage />} />
        <Route path="/tasks"         element={<TasksPage />} />
        <Route path="/tasks/:id"     element={<TaskDetailPage />} />
        <Route path="/teams"         element={<TeamsPage />} />
        <Route path="/teams/:id"     element={<TeamDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}