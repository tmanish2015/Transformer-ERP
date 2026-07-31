import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, Truck } from 'lucide-react'
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
import { vehicleSchema, type VehicleFormValues } from '@/features/logistics/schemas/logistics-schemas'
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from '@/features/logistics/hooks/use-vehicles'
import type { Vehicle } from '@/features/logistics/types/logistics-types'

function VehicleFormDialog({ open, onOpenChange, vehicle }: { open: boolean; onOpenChange: (open: boolean) => void; vehicle: Vehicle | null }) {
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const isPending = createVehicle.isPending || updateVehicle.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    values: { registration_no: vehicle?.registration_no ?? '', type: vehicle?.type ?? '' },
  })

  const onSubmit = (values: VehicleFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (vehicle) {
      updateVehicle.mutate({ id: vehicle.id, values }, { onSuccess })
    } else {
      createVehicle.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'New Vehicle'}</DialogTitle>
          <DialogDescription>Vehicles used for pickup and delivery trips.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="registration_no">Registration Number</Label>
            <Input id="registration_no" {...register('registration_no')} />
            {errors.registration_no && <p className="text-xs text-destructive">{errors.registration_no.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Input id="type" placeholder="e.g. Flatbed Truck" {...register('type')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {vehicle ? 'Save changes' : 'Add vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function VehiclesPage() {
  const { data, isLoading } = useVehicles()
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)

  const columns: ColumnDef<Vehicle>[] = [
    { accessorKey: 'registration_no', header: ({ column }) => <DataTableColumnHeader column={column} title="Registration No." /> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => row.original.type || <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateVehicle.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingVehicle(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingVehicle(row.original)}>
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
        title="Vehicles"
        description="Vehicles used for pickup and delivery."
        actions={
          <Button
            onClick={() => {
              setEditingVehicle(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Vehicle
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Truck} title="No vehicles yet" description="Add a vehicle to start logging trips." />}
      />

      <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} vehicle={editingVehicle} />

      <DeleteConfirmDialog
        open={Boolean(deletingVehicle)}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
        title="Delete vehicle?"
        description={`This will permanently delete "${deletingVehicle?.registration_no}".`}
        isPending={deleteVehicle.isPending}
        onConfirm={() => deletingVehicle && deleteVehicle.mutate(deletingVehicle.id, { onSuccess: () => setDeletingVehicle(null) })}
      />
    </div>
  )
}
