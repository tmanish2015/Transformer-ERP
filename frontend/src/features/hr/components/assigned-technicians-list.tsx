import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllocationsForReference, useDeleteDailyAllocation } from '@/features/hr/hooks/use-daily-allocations'

interface AssignedTechniciansListProps {
  referenceType: string
  referenceId: string
  canManage: boolean
}

export function AssignedTechniciansList({ referenceType, referenceId, canManage }: AssignedTechniciansListProps) {
  const { data: allocations, isLoading } = useAllocationsForReference(referenceType, referenceId)
  const deleteAllocation = useDeleteDailyAllocation(referenceType, referenceId)

  if (isLoading) return <Skeleton className="h-12 w-full" />

  if (!allocations || allocations.length === 0) {
    return <p className="text-sm text-muted-foreground">No technicians assigned yet.</p>
  }

  return (
    <div className="divide-y divide-border">
      {allocations.map((allocation) => (
        <div key={allocation.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div>
            <span className="font-medium text-foreground">{allocation.employee.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">{new Date(allocation.allocation_date).toLocaleDateString()}</span>
            {allocation.notes && <p className="text-xs text-muted-foreground">{allocation.notes}</p>}
          </div>
          {canManage && (
            <Button variant="ghost" size="icon-sm" disabled={deleteAllocation.isPending} onClick={() => deleteAllocation.mutate(allocation.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
