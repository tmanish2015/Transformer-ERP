import type { Tables } from '@/types/database.types'

export type TestType = Tables<'test_types'>
export type TestReport = Tables<'test_reports'>
export type TestReportResult = Tables<'test_report_results'>
export type TestCertificate = Tables<'test_certificates'>

export interface TestTypeParameter {
  key: string
  label: string
  unit: string
}

export type TestReportStatus = 'draft' | 'completed'

export const TEST_REPORT_STATUS_LABELS: Record<TestReportStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
}

export interface TestReportWithRelations extends TestReport {
  customer: { id: string; name: string }
  repair_job: { id: string; job_number: string } | null
  production_order: { id: string; order_number: string } | null
  test_type: { id: string; name: string; code: string }
}
