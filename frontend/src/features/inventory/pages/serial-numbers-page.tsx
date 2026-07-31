import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Barcode, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDeleteSerialNumber, useSerialNumbers, useUpdateSerialNumberStatus } from '@/features/inventory/hooks/use-serial-numbers'
import { SerialNumberFormDialog } from '@/features/inventory/components/serial-number-form-dialog'
import { SERIAL_STATUS_LABELS } from '@/features/inventory/types/inventory-types'
import type { SerialNumberRow } from '@/features/inventory/api/serial-numbers-api'
import { useAuth } from '@/providers/auth-provider'

export function SerialNumbersPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')
  const { data, isLoading } = useSerialNumbers()
  const updateStatus = useUpdateSerialNumberStatus()
  const deleteSerialNumber = useDeleteSerialNumber()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deletingSerial, setDeletingSerial] = useState<SerialNumberRow | null>(null)

  const columns: ColumnDef<SerialNumberRow>[] = [
    { accessorKey: 'serial_no', header: ({ column }) => <DataTableColumnHeader column={column} title="Serial Number" /> },
    {
      id: 'product',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      accessorFn: (row) => row.product.name,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.product.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.product.sku}</p>
        </div>
      ),
    },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.current_warehouse?.name ?? <span className="text-muted-foreground">—</span> },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        canManage ? (
          <Select value={row.original.current_status} onValueChange={(status) => updateStatus.mutate({ id: row.original.id, status: status ?? row.original.current_status })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERIAL_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={row.original.current_status} label={SERIAL_STATUS_LABELS[row.original.current_status] ?? row.original.current_status} />
        ),
    },
    {
      id: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
      accessorFn: (row) => row.created_at,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
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
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingSerial(row.original)}>
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
        title="Serial Number Tracker"
        description="Track individually serialized units — e.g. finished transformers awaiting dispatch or installation."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add Serial Number
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
        toolbar={() => <Input placeholder="Search serial numbers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Barcode} title="No serial numbers yet" description="Add a serial number for a serial-tracked product to start monitoring it." />}
      />

      <SerialNumberFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <DeleteConfirmDialog
        open={Boolean(deletingSerial)}
        onOpenChange={(open) => !open && setDeletingSerial(null)}
        title="Delete serial number?"
        description={`This will permanently delete "${deletingSerial?.serial_no}".`}
        isPending={deleteSerialNumber.isPending}
        onConfirm={() => deletingSerial && deleteSerialNumber.mutate(deletingSerial.id, { onSuccess: () => setDeletingSerial(null) })}
      />
    </div>
  )
}
