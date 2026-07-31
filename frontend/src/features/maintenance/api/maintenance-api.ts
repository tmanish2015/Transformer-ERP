import { supabase } from '@/lib/supabase'
import type { MaintenanceScheduleFormValues, MaintenanceVisitFormValues } from '@/features/maintenance/schemas/maintenance-schemas'
import type { MaintenanceSchedule, MaintenanceVisit } from '@/features/maintenance/types/maintenance-types'

export async function fetchMaintenanceSchedules(referenceType: string): Promise<MaintenanceSchedule[]> {
  const { data, error } = await supabase.from('maintenance_schedules').select('*').eq('reference_type', referenceType).order('next_due_at')
  if (error) throw error
  return data
}

export async function createMaintenanceSchedule(referenceType: string, values: MaintenanceScheduleFormValues) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert({ reference_type: referenceType, reference_id: values.reference_id, frequency_days: values.frequency_days, next_due_at: values.next_due_at, notes: values.notes || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchVisitsForSchedule(scheduleId: string): Promise<MaintenanceVisit[]> {
  const { data, error } = await supabase.from('maintenance_visits').select('*').eq('schedule_id', scheduleId).order('visited_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaintenanceVisit(scheduleId: string, values: MaintenanceVisitFormValues) {
  const { data, error } = await supabase
    .from('maintenance_visits')
    .insert({ schedule_id: scheduleId, visited_at: values.visited_at, status: values.status, notes: values.notes || null })
    .select()
    .single()
  if (error) throw error
  return data
}
