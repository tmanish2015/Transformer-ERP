import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { driverSchema, type DriverFormValues } from '@/features/logistics/schemas/logistics-schemas'
import { useCreateDriver, useDeleteDriver, useDrivers, useUpdateDriver } from '@/features/logistics/hooks/use-drivers'
import type { Driver } from '@/features/logistics/types/logistics-types'

function DriverFormDialog({ open, onOpenChange, driver }: { open: boolean; onOpenChange: (open: boolean) => void; driver: Driver | null }) {
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const isPending = createDriver.isPending || updateDriver.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    values: { name: driver?.name ?? '', license_no: driver?.license_no ?? '' },
  })

  const onSubmit = (values: DriverFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (driver) {
      updateDriver.mutate({ id: driver.id, values }, { onSuccess })
    } else {
      createDriver.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driver ? 'Edit Driver' : 'New Driver'}</DialogTitle>
          <DialogDescription>Drivers used for pickup and delivery trips.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="license_no">License Number</Label>
            <Input id="license_no" {...register('license_no')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {driver ? 'Save changes' : 'Add driver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DriversPage() {
  const { data, isLoading } = useDrivers()
  const updateDriver = useUpdateDriver()
  const deleteDriver = useDeleteDriver()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null)

  const columns: ColumnDef<Driver>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'license_no', header: 'License No.', cell: ({ row }) => row.original.license_no || <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateDriver.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingDriver(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingDriver(row.original)}>
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
        title="Drivers"
        description="Drivers used for pickup and delivery."
        actions={
          <Button
            onClick={() => {
              setEditingDriver(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Driver
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={UserRound} title="No drivers yet" description="Add a driver to start logging trips." />}
      />

      <DriverFormDialog open={formOpen} onOpenChange={setFormOpen} driver={editingDriver} />

      <DeleteConfirmDialog
        open={Boolean(deletingDriver)}
        onOpenChange={(open) => !open && setDeletingDriver(null)}
        title="Delete driver?"
        description={`This will permanently delete "${deletingDriver?.name}".`}
        isPending={deleteDriver.isPending}
        onConfirm={() => deletingDriver && deleteDriver.mutate(deletingDriver.id, { onSuccess: () => setDeletingDriver(null) })}
      />
    </div>
  )
}
