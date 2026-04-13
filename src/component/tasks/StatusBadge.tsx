import type { TaskStatus, TaskPriority } from '../../types'

const STATUS_MAP: Record<TaskStatus, [string, string]> = {
  OPEN:        ['badge-open',     'Open'],
  IN_PROGRESS: ['badge-progress', 'In Progress'],
  ON_HOLD:     ['badge-hold',     'On Hold'],
  COMPLETED:   ['badge-done',     'Done'],
  CANCELLED:   ['badge-cancel',   'Cancelled'],
}

const PRIORITY_MAP: Record<TaskPriority, [string, string]> = {
  LOW:      ['badge-low',      'Low'],
  MEDIUM:   ['badge-medium',   'Medium'],
  HIGH:     ['badge-high',     'High'],
  CRITICAL: ['badge-critical', 'Critical'],
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const [cls, label] = STATUS_MAP[status] ?? ['badge-open', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const [cls, label] = PRIORITY_MAP[priority] ?? ['badge-medium', priority]
  return <span className={`badge ${cls}`}>{label}</span>
}