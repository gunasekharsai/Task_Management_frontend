import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
// import { Client } from '@stomp/stompjs'
// import SockJS from 'sockjs-client'
import { notificationApi } from '../server/services'
import { useAuth } from './AuthContext'
import type { Notification } from '../types'
// import toast from 'react-hot-toast'

interface NotificationContextType {
  notifications:     Notification[]
  unreadCount:       number
  markRead:          (id: string) => Promise<void>
  markAllRead:       () => Promise<void>
  fetchNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  // const stompRef = useRef<Client | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationApi.list({ page: 0, size: 30 })
      setNotifications(data.data.content)
    } catch { /* ignore */ }
  }, [user])

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationApi.unreadCount()
      setUnreadCount(data.data.unreadCount)
    } catch { /* ignore */ }
  }, [user])

  // WebSocket connection
  // useEffect(() => {
  //   if (!user) return
  //   const token = localStorage.getItem('accessToken')

  //   const client = new Client({
  //     webSocketFactory: () => new SockJS('/ws'),
  //     connectHeaders: { Authorization: `Bearer ${token}` },
  //     reconnectDelay: 5000,
  //     onConnect: () => {
  //       client.subscribe('/user/queue/notifications', (msg) => {
  //         const notification: Notification = JSON.parse(msg.body)
  //         setNotifications(prev => [notification, ...prev])
  //         setUnreadCount(c => c + 1)
  //         toast(notification.message, { icon: '🔔' })
  //       })
  //     },
  //   })
  //   client.activate()
  //   stompRef.current = client
  //   return () => { client.deactivate() }
  // }, [user])

  useEffect(() => {
    fetchNotifications()
    fetchUnread()
  }, [fetchNotifications, fetchUnread])

  const markRead = async (id: string) => {
    try {
      await notificationApi.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}