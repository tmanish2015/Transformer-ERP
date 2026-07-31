import type { Tables } from '@/types/database.types'

export type MaintenanceSchedule = Tables<'maintenance_schedules'>
export type MaintenanceVisit = Tables<'maintenance_visits'>

export type MaintenanceVisitStatus = 'scheduled' | 'completed' | 'skipped'

export const MAINTENANCE_VISIT_STATUS_LABELS: Record<MaintenanceVisitStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  skipped: 'Skipped',
}
