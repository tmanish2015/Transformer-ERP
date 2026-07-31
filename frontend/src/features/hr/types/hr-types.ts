// These mirror hr-payroll-service's response shapes (see
// C:\Projects\hr-payroll-service\client-sdk\hr-payroll-client.ts) rather than coming
// from database.types.ts — the data lives in that standalone service's own database,
// not Transformer's, reached only through supabase/functions/hr-proxy.

export interface Employee {
  id: string
  name: string
  role_title: string | null
  skill_tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DailyAllocationWithEmployee {
  id: string
  employee_id: string
  allocation_date: string
  reference_type: string
  reference_id: string
  notes: string | null
  created_at: string
  employee: { id: string; name: string; role_title: string | null }
}
