import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ListTree, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBoms } from '@/features/manufacturing/hooks/use-boms'
import { BomFormDialog } from '@/features/manufacturing/components/bom-form-dialog'
import { BomDetailSheet } from '@/features/manufacturing/components/bom-detail-sheet'
import type { BomWithRelations } from '@/features/manufacturing/types/manufacturing-types'
import { useAuth } from '@/providers/auth-provider'

export function BomsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manufacturing.manage')

  const { data: boms, isLoading } = useBoms()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBom, setSelectedBom] = useState<BomWithRelations | null>(null)

  const columns: ColumnDef<BomWithRelations>[] = [
    { id: 'product', header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />, cell: ({ row }) => row.original.product.name },
    { id: 'version', header: 'Version', cell: ({ row }) => <Badge variant="outline">v{row.original.version}</Badge> },
    { id: 'name', header: 'Name', cell: ({ row }) => row.original.name || <span className="text-muted-foreground">—</span> },
    {
      id: 'is_active',
      header: 'Active',
      cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No'),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of Materials"
        description="Raw materials required to build each finished product."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New BOM
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={boms ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(row) => setSelectedBom(row)}
        toolbar={() => <Input placeholder="Search BOMs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={ListTree} title="No BOMs yet" description="Build your first bill of materials." />}
      />

      <BomFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <BomDetailSheet open={Boolean(selectedBom)} onOpenChange={(open) => !open && setSelectedBom(null)} bom={selectedBom} />
    </div>
  )
}
