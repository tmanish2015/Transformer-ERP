import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Award, FileText, FlaskConical, IndianRupee, ListChecks, Loader2, Plus, Send, ShieldCheck, Truck, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepairJob } from '@/features/workshop/hooks/use-repair-jobs'
import { useRepairEstimatesForJob, useSendEstimateToCustomer } from '@/features/workshop/hooks/use-repair-estimates'
import { RepairEstimateFormDialog } from '@/features/workshop/components/repair-estimate-form-dialog'
import { CustomerApprovalDialog } from '@/features/workshop/components/customer-approval-dialog'
import { MarkPickupCompleteDialog } from '@/features/workshop/components/mark-pickup-complete-dialog'
import { AddStageDialog } from '@/features/workshop/components/add-stage-dialog'
import { StageTimeline } from '@/features/workshop/components/stage-timeline'
import { AddWarrantyDialog } from '@/features/workshop/components/add-warranty-dialog'
import { useInvoiceForRepairJob, useCreateRepairInvoice } from '@/features/workshop/hooks/use-repair-invoice'
import { useRepairWarranty } from '@/features/workshop/hooks/use-repair-warranty'
import { DocumentsPanel } from '@/features/documents/components/documents-panel'
import { TestReportFormDialog } from '@/features/testing-lab/components/test-report-form-dialog'
import { useTestReportsForJob } from '@/features/testing-lab/hooks/use-test-reports'
import { TEST_REPORT_STATUS_LABELS } from '@/features/testing-lab/types/testing-lab-types'
import { AssignTechnicianDialog } from '@/features/hr/components/assign-technician-dialog'
import { AssignedTechniciansList } from '@/features/hr/components/assigned-technicians-list'
import { REPAIR_ESTIMATE_STATUS_LABELS, REPAIR_JOB_STATUS_LABELS, REPAIR_STAGE_LABELS, type RepairStage } from '@/features/workshop/types/workshop-types'
import { INVOICE_STATUS_LABELS } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function RepairJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('workshop.manage')

  const { data: job, isLoading } = useRepairJob(id)
  const { data: estimates, isLoading: estimatesLoading } = useRepairEstimatesForJob(id)
  const { data: testReports, isLoading: testReportsLoading } = useTestReportsForJob(id)
  const { data: invoice } = useInvoiceForRepairJob(id)
  const { data: warranty } = useRepairWarranty(id)
  const sendEstimate = useSendEstimateToCustomer()
  const createInvoice = useCreateRepairInvoice(id ?? '')

  const [estimateDialogOpen, setEstimateDialogOpen] = useState(false)
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [testReportDialogOpen, setTestReportDialogOpen] = useState(false)
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false)
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false)
  const [approvalEstimateId, setApprovalEstimateId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!job) {
    return <EmptyState icon={FileText} title="Job card not found" />
  }

  const showPickupAction = job.pickup_required && !job.pickup_completed_date

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workshop/jobs')} className="mb-2">
          <ArrowLeft className="size-4" /> Back to Job Cards
        </Button>
        <PageHeader
          title={job.job_number}
          description={`Received ${new Date(job.created_at).toLocaleDateString()}`}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={job.status} label={REPAIR_JOB_STATUS_LABELS[job.status as keyof typeof REPAIR_JOB_STATUS_LABELS]} />
              {canManage && showPickupAction && (
                <Button variant="outline" size="sm" onClick={() => setPickupDialogOpen(true)}>
                  <Truck className="size-4" /> Mark Pickup Complete
                </Button>
              )}
              {canManage && (
                <Button size="sm" onClick={() => setEstimateDialogOpen(true)}>
                  <Plus className="size-4" /> New Estimate
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium text-foreground">{job.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transformer</span>
              <span className="font-medium text-foreground">{[job.transformer_make, job.transformer_model].filter(Boolean).join(' ') || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial No.</span>
              <span className="font-medium text-foreground">{job.transformer_serial_no ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity (kVA)</span>
              <span className="font-medium text-foreground">{job.transformer_capacity_kva ?? '—'}</span>
            </div>
            {job.current_stage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stage</span>
                <span className="font-medium text-foreground">{REPAIR_STAGE_LABELS[job.current_stage as RepairStage]}</span>
              </div>
            )}
            <div className="pt-2">
              <span className="text-muted-foreground">Complaint</span>
              <p className="mt-1 text-foreground">{job.complaint}</p>
            </div>
            {job.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground">Internal Notes</span>
                <p className="mt-1 text-foreground">{job.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {job.pickup_required ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Date</span>
                  <span className="font-medium text-foreground">{job.pickup_requested_date ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Date</span>
                  <span className="font-medium text-foreground">{job.pickup_completed_date ?? 'Pending'}</span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground">Address</span>
                  <p className="mt-1 text-foreground">{job.pickup_address ?? '—'}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Not required — customer will drop off the transformer.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          {estimatesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !estimates || estimates.length === 0 ? (
            <EmptyState icon={FileText} title="No estimates yet" description="Create an estimate once the transformer has been inspected." />
          ) : (
            <div className="divide-y divide-border">
              {estimates.map((estimate) => (
                <div key={estimate.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{estimate.estimate_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(estimate.estimate_date).toLocaleDateString()} · ₹{estimate.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={estimate.status} label={REPAIR_ESTIMATE_STATUS_LABELS[estimate.status as keyof typeof REPAIR_ESTIMATE_STATUS_LABELS]} />
                    {canManage && estimate.status === 'draft' && (
                      <Button variant="outline" size="sm" disabled={sendEstimate.isPending} onClick={() => sendEstimate.mutate(estimate.id)}>
                        {sendEstimate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        Send to Customer
                      </Button>
                    )}
                    {canManage && estimate.status === 'sent' && (
                      <Button variant="outline" size="sm" onClick={() => setApprovalEstimateId(estimate.id)}>
                        Record Decision
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {['approved', 'in_progress', 'completed'].includes(job.status) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Repair Stages</CardTitle>
            {canManage && job.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={() => setStageDialogOpen(true)}>
                <ListChecks className="size-4" /> Log Stage
              </Button>
            )}
          </CardHeader>
          <CardContent>{id && <StageTimeline repairJobId={id} />}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Test Reports</CardTitle>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setTestReportDialogOpen(true)}>
              <FlaskConical className="size-4" /> New Test Report
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {testReportsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !testReports || testReports.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No test reports yet" />
          ) : (
            <div className="divide-y divide-border">
              {testReports.map((report) => (
                <button
                  key={report.id}
                  className="flex w-full items-center justify-between gap-4 py-2 text-left"
                  onClick={() => navigate(`/testing-lab/reports/${report.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-primary hover:underline">{report.report_number}</p>
                    <p className="text-xs text-muted-foreground">{report.test_type.name}</p>
                  </div>
                  <StatusBadge status={report.status} label={TEST_REPORT_STATUS_LABELS[report.status as keyof typeof TEST_REPORT_STATUS_LABELS]} />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Invoice &amp; Warranty</CardTitle>
            {canManage && job.status === 'completed' && !invoice && (
              <Button variant="outline" size="sm" disabled={createInvoice.isPending} onClick={() => createInvoice.mutate()}>
                {createInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : <IndianRupee className="size-4" />}
                Create Invoice
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {invoice ? (
              <div className="flex items-center justify-between">
                <Link to="/sales/invoices" className="font-medium text-primary hover:underline">
                  {invoice.invoice_number}
                </Link>
                <StatusBadge status={invoice.status} label={INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS]} />
              </div>
            ) : (
              <p className="text-muted-foreground">Not invoiced yet. Available once the job is marked completed.</p>
            )}

            {warranty ? (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="size-4" /> {warranty.warranty_months} months
                </span>
                <span className="text-muted-foreground">Until {new Date(warranty.end_date).toLocaleDateString()}</span>
              </div>
            ) : (
              canManage &&
              invoice && (
                <div className="border-t border-border pt-3">
                  <Button variant="outline" size="sm" onClick={() => setWarrantyDialogOpen(true)}>
                    <Award className="size-4" /> Add Warranty
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Assigned Technicians</CardTitle>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setTechnicianDialogOpen(true)}>
                <UserPlus className="size-4" /> Assign
              </Button>
            )}
          </CardHeader>
          <CardContent>{id && <AssignedTechniciansList referenceType="repair_job" referenceId={id} canManage={canManage} />}</CardContent>
        </Card>
      </div>

      {id && <DocumentsPanel referenceType="repair_job" referenceId={id} canManage={canManage} />}

      {id && <RepairEstimateFormDialog open={estimateDialogOpen} onOpenChange={setEstimateDialogOpen} repairJobId={id} />}
      {id && <MarkPickupCompleteDialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen} repairJobId={id} />}
      {id && <AddStageDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} repairJobId={id} />}
      {id && <TestReportFormDialog open={testReportDialogOpen} onOpenChange={setTestReportDialogOpen} repairJobId={id} />}
      {id && <AddWarrantyDialog open={warrantyDialogOpen} onOpenChange={setWarrantyDialogOpen} repairJobId={id} />}
      {id && <AssignTechnicianDialog open={technicianDialogOpen} onOpenChange={setTechnicianDialogOpen} referenceType="repair_job" referenceId={id} />}
      {approvalEstimateId && <CustomerApprovalDialog open={Boolean(approvalEstimateId)} onOpenChange={() => setApprovalEstimateId(null)} estimateId={approvalEstimateId} />}
    </div>
  )
}
