import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardList, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCancelSiteSurvey, useSiteSurveys } from '@/features/crm/hooks/use-site-surveys'
import { SiteSurveyFormDialog } from '@/features/crm/components/site-survey-form-dialog'
import { CompleteSiteSurveyDialog } from '@/features/crm/components/complete-site-survey-dialog'
import { SITE_SURVEY_STATUS_LABELS, type SiteSurveyWithRelations } from '@/features/crm/types/crm-types'
import { useAuth } from '@/providers/auth-provider'

export function SiteSurveysPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('crm.manage')
  const navigate = useNavigate()

  const { data: surveys, isLoading } = useSiteSurveys()
  const cancelSurvey = useCancelSiteSurvey()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const columns: ColumnDef<SiteSurveyWithRelations>[] = [
    { id: 'survey_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Survey #" />, accessorFn: (row) => row.survey_number },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'scheduled_date', header: 'Scheduled', cell: ({ row }) => (row.original.scheduled_date ? new Date(row.original.scheduled_date).toLocaleDateString() : <span className="text-muted-foreground">—</span>) },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={SITE_SURVEY_STATUS_LABELS[row.original.status as keyof typeof SITE_SURVEY_STATUS_LABELS]} />,
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        canManage &&
        row.original.status === 'scheduled' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setCompletingId(row.original.id)
              }}
            >
              Complete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                cancelSurvey.mutate(row.original.id)
              }}
            >
              Cancel
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Surveys"
        description="Pre-sales site visits to assess a customer's requirement."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Survey
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={surveys ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={canManage ? (row) => navigate(`/crm/opportunities?survey=${row.id}`) : undefined}
        toolbar={() => <Input placeholder="Search surveys..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={ClipboardList} title="No site surveys yet" description="Schedule a visit to assess a customer's requirement." />}
      />

      <SiteSurveyFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {completingId && <CompleteSiteSurveyDialog open={Boolean(completingId)} onOpenChange={(open) => !open && setCompletingId(null)} siteSurveyId={completingId} />}
    </div>
  )
}
