import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Target } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOpportunities, useUpdateOpportunityStage } from '@/features/crm/hooks/use-opportunities'
import { OpportunityFormDialog } from '@/features/crm/components/opportunity-form-dialog'
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_ORDER, type OpportunityStage, type OpportunityWithRelations } from '@/features/crm/types/crm-types'
import { useAuth } from '@/providers/auth-provider'

export function OpportunitiesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('crm.manage')
  const [searchParams] = useSearchParams()
  const presetSurveyId = searchParams.get('survey') ?? undefined

  const { data: opportunities, isLoading } = useOpportunities()
  const updateStage = useUpdateOpportunityStage()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(Boolean(presetSurveyId))

  const columns: ColumnDef<OpportunityWithRelations>[] = [
    { id: 'opportunity_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Opportunity #" />, accessorFn: (row) => row.opportunity_number },
    { id: 'title', header: 'Title', cell: ({ row }) => row.original.title },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'estimated_value', header: 'Estimated Value', cell: ({ row }) => `₹${row.original.estimated_value.toLocaleString('en-IN')}` },
    {
      id: 'expected_close_date',
      header: 'Expected Close',
      cell: ({ row }) => (row.original.expected_close_date ? new Date(row.original.expected_close_date).toLocaleDateString() : <span className="text-muted-foreground">—</span>),
    },
    {
      id: 'stage',
      header: 'Stage',
      cell: ({ row }) =>
        canManage ? (
          <Select value={row.original.stage} onValueChange={(value) => updateStage.mutate({ id: row.original.id, stage: value as OpportunityStage })}>
            <SelectTrigger className="w-40" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {OPPORTUNITY_STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={row.original.stage} label={OPPORTUNITY_STAGE_LABELS[row.original.stage as OpportunityStage]} />
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Sales pipeline from qualified interest to won or lost."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Opportunity
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={opportunities ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search opportunities..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Target} title="No opportunities yet" description="Open one from a site survey, or start fresh." />}
      />

      <OpportunityFormDialog open={formOpen} onOpenChange={setFormOpen} defaultSiteSurveyId={presetSurveyId} />
    </div>
  )
}
