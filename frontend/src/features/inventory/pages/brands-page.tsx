import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { BookMarked, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { brandSchema, type BrandFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useBrands, useCreateBrand, useDeleteBrand, useUpdateBrand } from '@/features/inventory/hooks/use-brands'
import type { Brand } from '@/features/inventory/types/inventory-types'

function BrandFormDialog({ open, onOpenChange, brand }: { open: boolean; onOpenChange: (open: boolean) => void; brand: Brand | null }) {
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const isPending = createBrand.isPending || updateBrand.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    values: { name: brand?.name ?? '' },
  })

  const onSubmit = (values: BrandFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (brand) {
      updateBrand.mutate({ id: brand.id, values }, { onSuccess })
    } else {
      createBrand.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'New Brand'}</DialogTitle>
          <DialogDescription>Brands help organize and filter your product catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Kirloskar" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {brand ? 'Save changes' : 'Create brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BrandsPage() {
  const { data, isLoading } = useBrands()
  const updateBrand = useUpdateBrand()
  const deleteBrand = useDeleteBrand()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  const columns: ColumnDef<Brand>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateBrand.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingBrand(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingBrand(row.original)}>
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
        title="Brands"
        description="Manage transformer/equipment brands and manufacturers."
        actions={
          <Button
            onClick={() => {
              setEditingBrand(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Brand
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={BookMarked} title="No brands yet" description="Create your first brand to start organizing products." />}
      />

      <BrandFormDialog open={formOpen} onOpenChange={setFormOpen} brand={editingBrand} />

      <DeleteConfirmDialog
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
        title="Delete brand?"
        description={`This will permanently delete "${deletingBrand?.name}". Products using this brand will be affected.`}
        isPending={deleteBrand.isPending}
        onConfirm={() => deletingBrand && deleteBrand.mutate(deletingBrand.id, { onSuccess: () => setDeletingBrand(null) })}
      />
    </div>
  )
}
