import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, Warehouse as WarehouseIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { warehouseSchema, type WarehouseFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useCreateWarehouse, useDeleteWarehouse, useUpdateWarehouse, useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import type { Warehouse } from '@/features/inventory/types/inventory-types'

function WarehouseFormDialog({ open, onOpenChange, warehouse }: { open: boolean; onOpenChange: (open: boolean) => void; warehouse: Warehouse | null }) {
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const isPending = createWarehouse.isPending || updateWarehouse.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    values: {
      name: warehouse?.name ?? '',
      code: warehouse?.code ?? '',
      address: warehouse?.address ?? '',
      city: warehouse?.city ?? '',
      state: warehouse?.state ?? '',
    },
  })

  const onSubmit = (values: WarehouseFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (warehouse) {
      updateWarehouse.mutate({ id: warehouse.id, values }, { onSuccess })
    } else {
      createWarehouse.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
          <DialogDescription>Manage storage locations for your inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Main Workshop Store" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="e.g. WH-JPR-01" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {warehouse ? 'Save changes' : 'Create warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WarehousesPage() {
  const { data, isLoading } = useWarehouses()
  const updateWarehouse = useUpdateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null)

  const columns: ColumnDef<Warehouse>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <Badge variant="outline">{row.original.code}</Badge> },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => <span className="text-muted-foreground">{[row.original.city, row.original.state].filter(Boolean).join(', ') || '—'}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateWarehouse.mutate({ id: row.original.id, values: { is_active: checked } })} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingWarehouse(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingWarehouse(row.original)}>
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
        title="Warehouses"
        description="Manage your storage locations."
        actions={
          <Button
            onClick={() => {
              setEditingWarehouse(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Warehouse
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search warehouses..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={WarehouseIcon} title="No warehouses yet" description="Add your first warehouse to start tracking stock locations." />}
      />

      <WarehouseFormDialog open={formOpen} onOpenChange={setFormOpen} warehouse={editingWarehouse} />

      <DeleteConfirmDialog
        open={Boolean(deletingWarehouse)}
        onOpenChange={(open) => !open && setDeletingWarehouse(null)}
        title="Delete warehouse?"
        description={`This will permanently delete "${deletingWarehouse?.name}" and its stock records.`}
        isPending={deleteWarehouse.isPending}
        onConfirm={() => deletingWarehouse && deleteWarehouse.mutate(deletingWarehouse.id, { onSuccess: () => setDeletingWarehouse(null) })}
      />
    </div>
  )
}
