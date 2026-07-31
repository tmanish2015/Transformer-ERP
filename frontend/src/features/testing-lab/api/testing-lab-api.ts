import { supabase } from '@/lib/supabase'
import type { TestReportFormValues } from '@/features/testing-lab/schemas/testing-lab-schemas'
import type { TestCertificate, TestReportResult, TestReportWithRelations, TestType } from '@/features/testing-lab/types/testing-lab-types'

export async function fetchTestTypes(): Promise<TestType[]> {
  const { data, error } = await supabase.from('test_types').select('*').eq('is_active', true).order('name')
  if (error) throw error
  return data
}

export async function fetchTestReports(): Promise<TestReportWithRelations[]> {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*, customer:customers(id,name), repair_job:repair_jobs(id,job_number), production_order:production_orders(id,order_number), test_type:test_types(id,name,code)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTestReportsForJob(repairJobId: string): Promise<TestReportWithRelations[]> {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*, customer:customers(id,name), repair_job:repair_jobs(id,job_number), production_order:production_orders(id,order_number), test_type:test_types(id,name,code)')
    .eq('repair_job_id', repairJobId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTestReportsForProductionOrder(productionOrderId: string): Promise<TestReportWithRelations[]> {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*, customer:customers(id,name), repair_job:repair_jobs(id,job_number), production_order:production_orders(id,order_number), test_type:test_types(id,name,code)')
    .eq('production_order_id', productionOrderId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTestReport(id: string): Promise<TestReportWithRelations> {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*, customer:customers(id,name), repair_job:repair_jobs(id,job_number), production_order:production_orders(id,order_number), test_type:test_types(id,name,code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchTestReportResults(testReportId: string): Promise<TestReportResult[]> {
  const { data, error } = await supabase.from('test_report_results').select('*').eq('test_report_id', testReportId)
  if (error) throw error
  return data
}

export async function fetchTestCertificate(testReportId: string): Promise<TestCertificate | null> {
  const { data, error } = await supabase.from('test_certificates').select('*').eq('test_report_id', testReportId).maybeSingle()
  if (error) throw error
  return data
}

export async function createTestReport(values: TestReportFormValues) {
  const { data: report, error } = await supabase
    .from('test_reports')
    .insert({
      customer_id: values.customer_id,
      repair_job_id: values.repair_job_id || null,
      production_order_id: values.production_order_id || null,
      test_type_id: values.test_type_id,
      tested_at: values.tested_at,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: resultsError } = await supabase.from('test_report_results').insert(
    values.results.map((result) => ({
      test_report_id: report.id,
      parameter_key: result.parameter_key,
      parameter_label: result.parameter_label,
      value: result.value,
      unit: result.unit || null,
      pass_fail: result.pass_fail === 'na' ? null : result.pass_fail === 'pass',
    })),
  )
  if (resultsError) throw resultsError

  return report
}

export async function completeTestReport(id: string) {
  const { error } = await supabase.from('test_reports').update({ status: 'completed' }).eq('id', id)
  if (error) throw error
}

export async function issueCertificate(testReportId: string): Promise<{ storage_path: string; certificate_number: string }> {
  const { data, error } = await supabase.functions.invoke('test-certificate-pdf', { body: { test_report_id: testReportId } })
  if (error) throw error
  return data
}

export async function getCertificateSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('test-certificates').createSignedUrl(storagePath, 60)
  if (error) throw error
  return data.signedUrl
}
