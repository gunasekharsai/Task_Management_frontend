import type { AxiosResponse } from 'axios'
import api from './client'
import type {
  ApiResponse, PageResponse,
  AuthResponse, LoginPayload, RegisterPayload,
  Task, CreateTaskPayload, UpdateTaskPayload,
  Team, CreateTeamPayload,
  Comment, Attachment, Notification, User,
} from '../types'

type AR<T> = Promise<AxiosResponse<ApiResponse<T>>>
type PR<T> = Promise<AxiosResponse<ApiResponse<PageResponse<T>>>>

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterPayload):                   AR<AuthResponse> => api.post('/auth/register', data),
  login:    (data: LoginPayload):                      AR<AuthResponse> => api.post('/auth/login', data),
  refresh:  (refreshToken: string):                    AR<AuthResponse> => api.post('/auth/refresh', { refreshToken }),
  logout:   ():                                        AR<null>         => api.post('/auth/logout'),
  me:       ():                                        AR<User>         => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }): AR<null> =>
    api.put('/auth/change-password', data),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMe:    ():                        AR<User> => api.get('/users/me'),
  getUser:  (id: string):              AR<User> => api.get(`/users/${id}`),
  updateMe: (data: Partial<Pick<User, 'fullName' | 'bio' | 'username'>>): AR<User> =>
    api.put('/users/me', data),
  uploadAvatar: (file: File): AR<User> => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const taskApi = {
  create:   (data: CreateTaskPayload):                    AR<Task>  => api.post('/tasks', data),
  get:      (id: string):                                 AR<Task>  => api.get(`/tasks/${id}`),
  update:   (id: string | null, data: UpdateTaskPayload):        AR<Task>  => api.put(`/tasks/${id}`, data),
  delete:   (id: string):                                 AR<null>  => api.delete(`/tasks/${id}`),
  assign:   (id: string, assigneeId: string):             AR<Task>  => api.patch(`/tasks/${id}/assign`, { assigneeId }),
  complete: (id: string):                                 AR<Task>  => api.patch(`/tasks/${id}/complete`),
  myTasks:  (params?: Record<string, unknown>):           PR<Task>  => api.get('/tasks/my', { params }),
  teamTasks:(teamId: string, params?: Record<string, unknown>): PR<Task> => api.get(`/tasks/team/${teamId}`, { params }),
  search:   (params: Record<string, unknown>):            PR<Task>  => api.get('/tasks/search', { params }),
  generateDescription: (prompt: string):                  AR<{ description: string }> =>
    api.post('/tasks/generate-description', { prompt }),
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export const teamApi = {
  create:       (data: CreateTeamPayload):                  AR<Team> => api.post('/teams', data),
  get:          (id: string):                               AR<Team> => api.get(`/teams/${id}`),
  update:       (id: string, data: Partial<CreateTeamPayload>): AR<Team> => api.put(`/teams/${id}`, data),
  delete:       (id: string):                               AR<null> => api.delete(`/teams/${id}`),
  myTeams:      (params?: Record<string, unknown>):         PR<Team> => api.get('/teams/my', { params }),
  invite:       (teamId: string, email: string):            AR<null> => api.post(`/teams/${teamId}/invite`, { email }),
  acceptInvite: (token: string):                            AR<Team> => api.post(`/teams/invites/${token}/accept`),
  removeMember: (teamId: string, memberId: string):         AR<null> => api.delete(`/teams/${teamId}/members/${memberId}`),
  leave:        (teamId: string):                           AR<null> => api.post(`/teams/${teamId}/leave`),
}

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentApi = {
  add:    (taskId: string, content: string):             AR<Comment> => api.post(`/tasks/${taskId}/comments`, { content }),
  list:   (taskId: string, params?: Record<string, unknown>): Promise<AxiosResponse<ApiResponse<PageResponse<Comment>>>> =>
    api.get(`/tasks/${taskId}/comments`, { params }),
  update: (commentId: string, content: string):          AR<Comment> => api.put(`/comments/${commentId}`, { content }),
  delete: (commentId: string):                           AR<null>    => api.delete(`/comments/${commentId}`),
}

// ── Attachments ───────────────────────────────────────────────────────────────
export const attachmentApi = {
  upload: (taskId: string, file: File): AR<Attachment> => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/tasks/${taskId}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  list:        (taskId: string):        AR<Attachment[]> => api.get(`/tasks/${taskId}/attachments`),
  downloadUrl: (attachmentId: string):  string           => `/api/v1/attachments/download/${attachmentId}`,
  delete:      (attachmentId: string):  AR<null>         => api.delete(`/attachments/${attachmentId}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list:        (params?: Record<string, unknown>): PR<Notification> => api.get('/notifications', { params }),
  unreadCount: ():                                 AR<{ unreadCount: number }> => api.get('/notifications/unread-count'),
  markRead:    (id: string):                       AR<null> => api.patch(`/notifications/${id}/read`),
  markAllRead: ():                                 AR<null> => api.patch('/notifications/read-all'),
}


