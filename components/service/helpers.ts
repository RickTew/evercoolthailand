import { ServiceRecord, ServiceVisit, FREQUENCY_DAYS } from '@/types'

export type DueStatus = 'overdue' | 'due-soon' | 'ok' | 'no-date'

export function getDueStatus(dueDate: string | null): DueStatus {
  if (!dueDate) return 'no-date'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 30) return 'due-soon'
  return 'ok'
}

// Returns days difference: negative = overdue, positive = days until due
export function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.floor((due.getTime() - today.getTime()) / 86400000)
}

export interface CountdownLabel {
  key: string
  params?: Record<string, number>
}

export function getCountdownLabel(dueDate: string | null): CountdownLabel {
  const d = daysUntilDue(dueDate)
  if (d == null) return { key: 'service.countdown.noDate' }
  if (d < -1) return { key: 'service.countdown.overdueDays', params: { n: -d } }
  if (d === -1) return { key: 'service.countdown.overdue1' }
  if (d === 0) return { key: 'service.countdown.today' }
  if (d === 1) return { key: 'service.countdown.tomorrow' }
  if (d <= 21) return { key: 'service.countdown.inDays', params: { n: d } }
  return { key: 'service.countdown.inWeeks', params: { n: Math.round(d / 7) } }
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Auto-calc due date from first visit + frequency
export function calculateDueDate(
  firstVisitDate: string | null,
  visitsPerYear: number | null
): string | null {
  if (!firstVisitDate || !visitsPerYear) return null
  const days = FREQUENCY_DAYS[visitsPerYear]
  if (!days) return null
  const d = new Date(firstVisitDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Calc next due date when a visit is marked complete
export function calculateNextDue(
  completedDate: string,
  visitsPerYear: number | null
): string | null {
  if (!visitsPerYear) return null
  const days = FREQUENCY_DAYS[visitsPerYear]
  if (!days) return null
  const d = new Date(completedDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function visitsForRecord(visits: ServiceVisit[], recordId: string): ServiceVisit[] {
  return visits.filter((v) => v.service_record_id === recordId)
}

export function lastVisitDate(visits: ServiceVisit[], recordId: string): string | null {
  const recordVisits = visitsForRecord(visits, recordId)
  if (recordVisits.length === 0) return null
  // Already sorted newest first from server
  return recordVisits[0].completed_date
}

// Status priority for sorting: overdue first, then due-soon, then ok, then no-date
export const STATUS_ORDER: Record<DueStatus, number> = {
  overdue: 0,
  'due-soon': 1,
  ok: 2,
  'no-date': 3,
}

export function isInCurrentMonth(date: string | null): boolean {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function isInNextNDays(date: string | null, n: number): boolean {
  if (!date) return false
  const d = daysUntilDue(date)
  if (d == null) return false
  return d >= 0 && d <= n
}

export function applyQuickFilter(
  records: ServiceRecord[],
  filter: 'all' | 'mine' | 'overdue' | 'this-month' | 'next-30',
  displayName: string | null
): ServiceRecord[] {
  switch (filter) {
    case 'mine':
      return displayName
        ? records.filter((r) => r.notes?.includes(displayName) || false)
        : records
    case 'overdue':
      return records.filter((r) => getDueStatus(r.due_date) === 'overdue')
    case 'this-month':
      return records.filter((r) => isInCurrentMonth(r.due_date))
    case 'next-30':
      return records.filter((r) => isInNextNDays(r.due_date, 30))
    default:
      return records
  }
}
