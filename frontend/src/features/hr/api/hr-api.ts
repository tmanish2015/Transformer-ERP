import { supabase } from '@/lib/supabase'
import type { DailyAllocationFormValues, EmployeeFormValues } from '@/features/hr/schemas/hr-schemas'
import type { DailyAllocationWithEmployee, Employee } from '@/features/hr/types/hr-types'

// All requests go through supabase/functions/hr-proxy, which holds the
// hr-payroll-service API key server-side and enforces hr.view/hr.manage — this file
// never talks to a Supabase table directly, only to that proxy function. See
// C:\Projects\hr-payroll-service\README.md for why the data lives in a separate
// service.

function parseSkillTags(input: string | undefined): string[] {
  return (input ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function invokeProxy<T>(path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(`hr-proxy${path}`, { method, body })
  if (error) throw error
  return data as T
}

export async function fetchEmployees(): Promise<Employee[]> {
  return invokeProxy<Employee[]>('/employees', 'GET')
}

export async function createEmployee(values: EmployeeFormValues) {
  return invokeProxy<Employee>('/employees', 'POST', { name: values.name, role_title: values.role_title || null, skill_tags: parseSkillTags(values.skill_tags) })
}

export async function updateEmployee(id: string, values: Partial<EmployeeFormValues> & { is_active?: boolean }) {
  return invokeProxy<Employee>(`/employees/${id}`, 'PATCH', {
    ...(values.name !== undefined ? { name: values.name } : {}),
    ...(values.role_title !== undefined ? { role_title: values.role_title || null } : {}),
    ...(values.skill_tags !== undefined ? { skill_tags: parseSkillTags(values.skill_tags) } : {}),
    ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
  })
}

export async function deleteEmployee(id: string) {
  await invokeProxy(`/employees/${id}`, 'DELETE')
}

export async function fetchAllocationsForReference(referenceType: string, referenceId: string): Promise<DailyAllocationWithEmployee[]> {
  return invokeProxy<DailyAllocationWithEmployee[]>(`/daily-allocations?reference_type=${encodeURIComponent(referenceType)}&reference_id=${encodeURIComponent(referenceId)}`, 'GET')
}

// Unfiltered — every allocation for the tenant, across every reference_type. Used by
// the Engineer Productivity report; hr-api's GET handler already supports omitting both
// query params.
export async function fetchAllAllocations(): Promise<DailyAllocationWithEmployee[]> {
  return invokeProxy<DailyAllocationWithEmployee[]>('/daily-allocations', 'GET')
}

export async function createDailyAllocation(referenceType: string, referenceId: string, values: DailyAllocationFormValues) {
  return invokeProxy<DailyAllocationWithEmployee>('/daily-allocations', 'POST', {
    employee_id: values.employee_id,
    allocation_date: values.allocation_date,
    reference_type: referenceType,
    reference_id: referenceId,
    notes: values.notes || null,
  })
}

export async function deleteDailyAllocation(id: string) {
  await invokeProxy(`/daily-allocations/${id}`, 'DELETE')
}
