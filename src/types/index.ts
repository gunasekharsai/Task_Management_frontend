// ── Enums ────────────────────────────────────────────────────────────────────

export type TaskStatus   = 'OPEN' |'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type UserRole     = 'USER' | 'ADMIN'
export type NotificationType =
  | 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED'
  | 'COMMENT_ADDED' | 'TEAM_INVITE'  | 'TEAM_JOINED'

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:         string
  username:   string
  email:      string
  fullName:   string | null
  bio:        string | null
  avatarUrl:  string | null
  role:       UserRole
  createdAt:  string
}

// ── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id:              string
  title:           string
  description:     string | null
  status:          TaskStatus
  priority:        TaskPriority
  dueDate:         string | null
  creator:         User | null
  assignee:        User | null
  teamId:          string | null
  teamName:        string | null
  commentCount:    number
  attachmentCount: number
  createdAt:       string
  updatedAt:       string
  completedAt:     string | null
}

export interface CreateTaskPayload {
  title:       string
  description?: string
  priority?:   TaskPriority
  dueDate?:    string
  teamId?:     string
  assigneeId?: string
}

export interface UpdateTaskPayload {
  title?:       string
  description?: string
  status?:      TaskStatus
  priority?:    TaskPriority
  dueDate?:     string
  assigneeId?:  string
}

// ── Comment ──────────────────────────────────────────────────────────────────

export interface Comment {
  id:        string
  content:   string
  author:    User
  taskId:    string
  createdAt: string
  updatedAt: string
}

// ── Attachment ───────────────────────────────────────────────────────────────

export interface Attachment {
  id:               string
  originalFileName: string
  fileType:         string
  fileSize:         number
  downloadUrl:      string
  uploadedBy:       User
  uploadedAt:       string
}

// ── Team ─────────────────────────────────────────────────────────────────────

export interface Team {
  id:          string
  name:        string
  description: string | null
  owner:       User
  members:     User[]
  memberCount: number
  createdAt:   string
}

export interface CreateTeamPayload {
  name:         string
  description?: string
}

// ── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id:            string
  type:          NotificationType
  message:       string
  referenceId:   string | null
  referenceType: string | null
  read:          boolean
  createdAt:     string
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken:  string
  refreshToken: string
  tokenType:    string
  user:         User
}

export interface LoginPayload {
  emailOrUsername: string
  password:        string
}

export interface RegisterPayload {
  username:  string
  email:     string
  password:  string
  fullName?: string
}

// ── API wrapper ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data:    T
}

export interface PageResponse<T> {
  content:          T[]
  totalElements:    number
  totalPages:       number
  number:           number
  size:             number
  first:            boolean
  last:             boolean
}