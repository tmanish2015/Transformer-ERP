import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Award, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTestReport, useTestReportResults, useCompleteTestReport, useIssueCertificate } from '@/features/testing-lab/hooks/use-test-reports'
import { useTestCertificate } from '@/features/testing-lab/hooks/use-test-certificate'
import { getCertificateSignedUrl } from '@/features/testing-lab/api/testing-lab-api'
import { TEST_REPORT_STATUS_LABELS } from '@/features/testing-lab/types/testing-lab-types'
import { useAuth } from '@/providers/auth-provider'

export function TestReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('testing-lab.manage')

  const { data: report, isLoading } = useTestReport(id)
  const { data: results, isLoading: resultsLoading } = useTestReportResults(id)
  const { data: certificate } = useTestCertificate(id)
  const completeReport = useCompleteTestReport()
  const issueCertificate = useIssueCertificate(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!report) {
    return <EmptyState icon={FileText} title="Test report not found" />
  }

  const handleDownloadCertificate = async () => {
    if (!certificate) return
    const url = await getCertificateSignedUrl(certificate.storage_path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/testing-lab/reports')} className="mb-2">
          <ArrowLeft className="size-4" /> Back to Test Reports
        </Button>
        <PageHeader
          title={report.report_number}
          description={`${report.test_type.name} · ${new Date(report.tested_at).toLocaleDateString()}`}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={report.status} label={TEST_REPORT_STATUS_LABELS[report.status as keyof typeof TEST_REPORT_STATUS_LABELS]} />
              {canManage && report.status === 'draft' && (
                <Button variant="outline" size="sm" disabled={completeReport.isPending} onClick={() => completeReport.mutate(report.id)}>
                  {completeReport.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Mark Completed
                </Button>
              )}
              {canManage && report.status === 'completed' && !certificate && (
                <Button size="sm" disabled={issueCertificate.isPending} onClick={() => issueCertificate.mutate()}>
                  {issueCertificate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
                  Issue Certificate
                </Button>
              )}
              {certificate && (
                <Button variant="outline" size="sm" onClick={handleDownloadCertificate}>
                  <Award className="size-4" /> Download Certificate
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-foreground">{report.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Repair Job</span>
            <span className="font-medium text-foreground">{report.repair_job?.job_number ?? 'Walk-in (no repair job)'}</span>
          </div>
          {report.notes && (
            <div className="pt-2">
              <span className="text-muted-foreground">Notes</span>
              <p className="mt-1 text-foreground">{report.notes}</p>
            </div>
          )}
          {certificate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certificate No.</span>
              <span className="font-medium text-foreground">{certificate.certificate_number}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !results || results.length === 0 ? (
            <EmptyState icon={FileText} title="No results recorded" />
          ) : (
            <div className="divide-y divide-border">
              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-foreground">{result.parameter_label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {result.value}
                      {result.unit ? ` ${result.unit}` : ''}
                    </span>
                    {result.pass_fail !== null && (
                      <span className={result.pass_fail ? 'text-chart-success' : 'text-chart-critical'}>{result.pass_fail ? 'PASS' : 'FAIL'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
