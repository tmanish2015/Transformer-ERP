import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
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
import { unitSchema, type UnitFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useCreateUnit, useDeleteUnit, useUnits, useUpdateUnit } from '@/features/inventory/hooks/use-units'
import type { Unit } from '@/features/inventory/types/inventory-types'

function UnitFormDialog({ open, onOpenChange, unit }: { open: boolean; onOpenChange: (open: boolean) => void; unit: Unit | null }) {
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const isPending = createUnit.isPending || updateUnit.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    values: { name: unit?.name ?? '', short_code: unit?.short_code ?? '' },
  })

  const onSubmit = (values: UnitFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (unit) {
      updateUnit.mutate({ id: unit.id, values }, { onSuccess })
    } else {
      createUnit.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'New Unit'}</DialogTitle>
          <DialogDescription>Units of measurement used across product master.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Piece" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short_code">Short Code</Label>
            <Input id="short_code" placeholder="e.g. PCS" {...register('short_code')} />
            {errors.short_code && <p className="text-xs text-destructive">{errors.short_code.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {unit ? 'Save changes' : 'Create unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UnitsPage() {
  const { data, isLoading } = useUnits()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  const columns: ColumnDef<Unit>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    {
      accessorKey: 'short_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Short Code" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.short_code}</Badge>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateUnit.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingUnit(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingUnit(row.original)}>
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
        title="Units"
        description="Manage units of measurement for products."
        actions={
          <Button
            onClick={() => {
              setEditingUnit(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Unit
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Ruler} title="No units yet" description="Create your first unit of measurement to get started." />}
      />

      <UnitFormDialog open={formOpen} onOpenChange={setFormOpen} unit={editingUnit} />

      <DeleteConfirmDialog
        open={Boolean(deletingUnit)}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
        title="Delete unit?"
        description={`This will permanently delete "${deletingUnit?.name}". Products using this unit will be affected.`}
        isPending={deleteUnit.isPending}
        onConfirm={() => deletingUnit && deleteUnit.mutate(deletingUnit.id, { onSuccess: () => setDeletingUnit(null) })}
      />
    </div>
  )
}
