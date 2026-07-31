import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, FlaskConical, ListChecks } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProductionOrder, useRawMaterialRequirements } from '@/features/manufacturing/hooks/use-production-orders'
import { AddProductionStageDialog } from '@/features/manufacturing/components/add-production-stage-dialog'
import { ProductionStageTimeline } from '@/features/manufacturing/components/production-stage-timeline'
import { PRODUCTION_ORDER_STATUS_LABELS } from '@/features/manufacturing/types/manufacturing-types'
import { TestReportFormDialog } from '@/features/testing-lab/components/test-report-form-dialog'
import { useTestReportsForProductionOrder } from '@/features/testing-lab/hooks/use-test-reports'
import { TEST_REPORT_STATUS_LABELS } from '@/features/testing-lab/types/testing-lab-types'
import { useAuth } from '@/providers/auth-provider'

export function ProductionOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manufacturing.manage')

  const { data: order, isLoading } = useProductionOrder(id)
  const { data: requirements, isLoading: requirementsLoading } = useRawMaterialRequirements(id)
  const { data: testReports, isLoading: testReportsLoading } = useTestReportsForProductionOrder(id)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [testReportDialogOpen, setTestReportDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!order) {
    return <EmptyState icon={FileText} title="Production order not found" />
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/manufacturing/orders')} className="mb-2">
          <ArrowLeft className="size-4" /> Back to Orders
        </Button>
        <PageHeader
          title={order.order_number}
          description={`${order.product.name} × ${order.quantity}`}
          actions={<StatusBadge status={order.status} label={PRODUCTION_ORDER_STATUS_LABELS[order.status as keyof typeof PRODUCTION_ORDER_STATUS_LABELS]} />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium text-foreground">{order.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BOM Version</span>
              <span className="font-medium text-foreground">v{order.bom.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium text-foreground">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse</span>
              <span className="font-medium text-foreground">{order.warehouse.name}</span>
            </div>
            {order.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1 text-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw Material Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            {requirementsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !requirements || requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requirements computed.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{req.raw_material_product.name}</p>
                        <p className="text-xs text-muted-foreground">{req.raw_material_product.sku}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.required_qty} {req.unit.short_code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Production Stages</CardTitle>
          {canManage && order.status !== 'completed' && order.status !== 'cancelled' && (
            <Button variant="outline" size="sm" onClick={() => setStageDialogOpen(true)}>
              <ListChecks className="size-4" /> Log Stage
            </Button>
          )}
        </CardHeader>
        <CardContent>{id && <ProductionStageTimeline orderId={id} />}</CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Factory Acceptance Test Reports</CardTitle>
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

      {id && <AddProductionStageDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} orderId={id} />}
      {id && <TestReportFormDialog open={testReportDialogOpen} onOpenChange={setTestReportDialogOpen} productionOrderId={id} />}
    </div>
  )
}
