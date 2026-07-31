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
import { supplierSchema, type SupplierFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useCreateSupplier, useDeleteSupplier, useSuppliers, useUpdateSupplier } from '@/features/inventory/hooks/use-suppliers'
import type { Supplier } from '@/features/inventory/types/inventory-types'

function SupplierFormDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (open: boolean) => void; supplier: Supplier | null }) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const isPending = createSupplier.isPending || updateSupplier.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    values: {
      name: supplier?.name ?? '',
      contact_person: supplier?.contact_person ?? '',
      email: supplier?.email ?? '',
      phone: supplier?.phone ?? '',
      gstin: supplier?.gstin ?? '',
      address: supplier?.address ?? '',
    },
  })

  const onSubmit = (values: SupplierFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (supplier) {
      updateSupplier.mutate({ id: supplier.id, values }, { onSuccess })
    } else {
      createSupplier.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
          <DialogDescription>Manage vendors you purchase raw materials and spares from.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" {...register('contact_person')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" {...register('gstin')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {supplier ? 'Save changes' : 'Create supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SuppliersPage() {
  const { data, isLoading } = useSuppliers()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Company" /> },
    { accessorKey: 'contact_person', header: 'Contact', cell: ({ row }) => row.original.contact_person || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email || <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateSupplier.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingSupplier(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingSupplier(row.original)}>
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
        title="Suppliers"
        description="Manage vendors and supplier relationships."
        actions={
          <Button
            onClick={() => {
              setEditingSupplier(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Supplier
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier to map them to products." />}
      />

      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editingSupplier} />

      <DeleteConfirmDialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        title="Delete supplier?"
        description={`This will permanently delete "${deletingSupplier?.name}".`}
        isPending={deleteSupplier.isPending}
        onConfirm={() => deletingSupplier && deleteSupplier.mutate(deletingSupplier.id, { onSuccess: () => setDeletingSupplier(null) })}
      />
    </div>
  )
}
