import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2, Zap } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTransformers, useDeleteTransformer } from '@/features/transformer/hooks/use-transformers'
import { TransformerFormDialog } from '@/features/transformer/components/transformer-form-dialog'
import { TRANSFORMER_STATUS_LABELS, type TransformerWithCustomer } from '@/features/transformer/types/transformer-types'
import { useAuth } from '@/providers/auth-provider'

export default function TransformerPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')

  const { data, isLoading } = useTransformers()
  const deleteTransformer = useDeleteTransformer()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTransformer, setEditingTransformer] = useState<TransformerWithCustomer | null>(null)
  const [deletingTransformer, setDeletingTransformer] = useState<TransformerWithCustomer | null>(null)

  const columns: ColumnDef<TransformerWithCustomer>[] = [
    { accessorKey: 'registration_no', header: 'Registration No.' },
    { header: 'Customer Name', cell: ({ row }) => row.original.customer?.name ?? <span className="text-muted-foreground">—</span> },
    { accessorKey: 'make', header: 'Make', cell: ({ row }) => row.original.make || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'model', header: 'Model', cell: ({ row }) => row.original.model || <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'capacity_kva',
      header: 'Capacity (kVA)',
      cell: ({ row }) => (row.original.capacity_kva != null ? `${row.original.capacity_kva} kVA` : <span className="text-muted-foreground">—</span>),
    },
    {
      accessorKey: 'current_status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.current_status}
          label={TRANSFORMER_STATUS_LABELS[row.original.current_status as keyof typeof TRANSFORMER_STATUS_LABELS] ?? row.original.current_status}
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingTransformer(row.original)
                  setFormOpen(true)
                }}
              >
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingTransformer(row.original)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transformer Master"
        description="Manage customer transformers and their technical specifications."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditingTransformer(null)
                setFormOpen(true)
              }}
            >
              <Plus /> Add Transformer
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search transformers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Zap} title="No transformers found" description="Add your first transformer to start tracking customer assets." />}
      />

      <TransformerFormDialog open={formOpen} onOpenChange={setFormOpen} transformer={editingTransformer} />

      <DeleteConfirmDialog
        open={Boolean(deletingTransformer)}
        onOpenChange={(open) => !open && setDeletingTransformer(null)}
        title="Delete transformer?"
        description={`This will permanently delete "${deletingTransformer?.registration_no}".`}
        isPending={deleteTransformer.isPending}
        onConfirm={() => deletingTransformer && deleteTransformer.mutate(deletingTransformer.id, { onSuccess: () => setDeletingTransformer(null) })}
      />
    </div>
  )
}
