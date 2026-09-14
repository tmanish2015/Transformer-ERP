import { useState } from 'react'
import { Download, FlaskConical } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer360TestReports } from '@/features/sales/hooks/use-customer-360'
import { TEST_REPORT_STATUS_LABELS } from '@/features/testing-lab/types/testing-lab-types'
import { getCertificateSignedUrl } from '@/features/testing-lab/api/testing-lab-api'

interface TestingTabProps {
  customerId: string
  active: boolean
}

export function TestingTab({ customerId, active }: TestingTabProps) {
  const { data: reports, isLoading } = useCustomer360TestReports(customerId, active)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleViewCertificate(storagePath: string, reportId: string) {
    setDownloadingId(reportId)
    try {
      const url = await getCertificateSignedUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  if ((reports ?? []).length === 0) {
    return <EmptyState icon={FlaskConical} title="No test reports" description="This customer has no test reports on record." />
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3 text-sm font-medium text-foreground">Test Reports</div>
      <div className="divide-y divide-border">
        {(reports ?? []).map((report) => (
          <div key={report.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span className="text-foreground">{report.report_number}</span>
            <span className="text-muted-foreground">{report.test_type?.name ?? 'Not available'}</span>
            <span className="text-muted-foreground">{new Date(report.tested_at).toLocaleDateString('en-IN')}</span>
            <StatusBadge status={report.status} label={TEST_REPORT_STATUS_LABELS[report.status as keyof typeof TEST_REPORT_STATUS_LABELS] ?? report.status} />
            {report.test_certificate ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewCertificate(report.test_certificate!.storage_path, report.id)}
                disabled={downloadingId === report.id}
              >
                <Download className="size-4" /> Certificate
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No certificate issued</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
