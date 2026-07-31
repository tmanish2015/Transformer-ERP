import { useQuery } from '@tanstack/react-query'
import { fetchTestCertificate } from '@/features/testing-lab/api/testing-lab-api'

export function useTestCertificate(testReportId: string | undefined) {
  return useQuery({
    queryKey: ['test-certificate', testReportId],
    queryFn: () => fetchTestCertificate(testReportId!),
    enabled: Boolean(testReportId),
  })
}
