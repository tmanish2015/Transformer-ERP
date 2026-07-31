import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FlaskConical, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTestReports } from '@/features/testing-lab/hooks/use-test-reports'
import { TestReportFormDialog } from '@/features/testing-lab/components/test-report-form-dialog'
import { TEST_REPORT_STATUS_LABELS, type TestReportWithRelations } from '@/features/testing-lab/types/testing-lab-types'
import { useAuth } from '@/providers/auth-provider'

export function TestReportsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('testing-lab.manage')
  const navigate = useNavigate()

  const { data: reports, isLoading } = useTestReports()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const columns: ColumnDef<TestReportWithRelations>[] = [
    {
      id: 'report_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Report #" />,
      accessorFn: (row) => row.report_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/testing-lab/reports/${row.original.id}`)}>
          {row.original.report_number}
        </button>
      ),
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'test_type', header: 'Test Type', cell: ({ row }) => row.original.test_type.name },
    { id: 'repair_job', header: 'Repair Job', cell: ({ row }) => row.original.repair_job?.job_number ?? <span className="text-muted-foreground">Walk-in</span> },
    {
      id: 'tested_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tested At" />,
      accessorFn: (row) => row.tested_at,
      cell: ({ row }) => new Date(row.original.tested_at).toLocaleDateString(),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={TEST_REPORT_STATUS_LABELS[row.original.status as keyof typeof TEST_REPORT_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Reports"
        description="Issue test certificates for repair jobs or walk-in lab customers."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Test Report
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={reports ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(row) => navigate(`/testing-lab/reports/${row.id}`)}
        toolbar={() => <Input placeholder="Search test reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={FlaskConical} title="No test reports yet" description="Create a test report for a repair job or a walk-in lab customer." />}
      />

      <TestReportFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
