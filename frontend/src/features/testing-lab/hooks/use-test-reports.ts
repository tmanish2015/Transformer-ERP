import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  completeTestReport,
  createTestReport,
  fetchTestReport,
  fetchTestReportResults,
  fetchTestReports,
  fetchTestReportsForJob,
  fetchTestReportsForProductionOrder,
  issueCertificate,
} from '@/features/testing-lab/api/testing-lab-api'
import type { TestReportFormValues } from '@/features/testing-lab/schemas/testing-lab-schemas'

const KEY = 'test-reports'

export function useTestReports() {
  return useQuery({ queryKey: [KEY], queryFn: fetchTestReports })
}

export function useTestReportsForJob(repairJobId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'job', repairJobId],
    queryFn: () => fetchTestReportsForJob(repairJobId!),
    enabled: Boolean(repairJobId),
  })
}

export function useTestReportsForProductionOrder(productionOrderId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'production-order', productionOrderId],
    queryFn: () => fetchTestReportsForProductionOrder(productionOrderId!),
    enabled: Boolean(productionOrderId),
  })
}

export function useTestReport(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchTestReport(id!),
    enabled: Boolean(id),
  })
}

export function useTestReportResults(testReportId: string | undefined) {
  return useQuery({
    queryKey: [KEY, testReportId, 'results'],
    queryFn: () => fetchTestReportResults(testReportId!),
    enabled: Boolean(testReportId),
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [KEY] })
}

export function useCreateTestReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: TestReportFormValues) => createTestReport(values),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Test report created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCompleteTestReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => completeTestReport(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Test report marked completed')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useIssueCertificate(testReportId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => issueCertificate(testReportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-certificate', testReportId] })
      toast.success('Certificate issued')
    },
    onError: (error) => toast.error(error.message),
  })
}
