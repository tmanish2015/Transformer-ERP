import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Boxes, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { rentalAssetCategorySchema, type RentalAssetCategoryFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalAssetCategory, useDeleteRentalAssetCategory, useRentalAssetCategories, useUpdateRentalAssetCategory } from '@/features/rental/hooks/use-rental-asset-categories'
import type { RentalAssetCategory } from '@/features/rental/types/rental-types'

function CategoryFormDialog({ open, onOpenChange, category }: { open: boolean; onOpenChange: (open: boolean) => void; category: RentalAssetCategory | null }) {
  const createCategory = useCreateRentalAssetCategory()
  const updateCategory = useUpdateRentalAssetCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalAssetCategoryFormValues>({
    resolver: zodResolver(rentalAssetCategorySchema),
    values: { name: category?.name ?? '', description: category?.description ?? '' },
  })

  const onSubmit = (values: RentalAssetCategoryFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (category) {
      updateCategory.mutate({ id: category.id, values }, { onSuccess })
    } else {
      createCategory.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>Group rental assets — e.g. Excavators, Generators, Cranes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {category ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RentalAssetCategoriesPage() {
  const { data, isLoading } = useRentalAssetCategories()
  const updateCategory = useUpdateRentalAssetCategory()
  const deleteCategory = useDeleteRentalAssetCategory()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RentalAssetCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<RentalAssetCategory | null>(null)

  const columns: ColumnDef<RentalAssetCategory>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description || <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateCategory.mutate({ id: row.original.id, values: { is_active: checked } })} />,
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
                setEditingCategory(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingCategory(row.original)}>
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
        title="Asset Categories"
        description="Group rental assets for quoting and reporting."
        actions={
          <Button
            onClick={() => {
              setEditingCategory(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Boxes} title="No categories yet" description="Add your first rental asset category." />}
      />

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <DeleteConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete category?"
        description={`This will permanently delete "${deletingCategory?.name}".`}
        isPending={deleteCategory.isPending}
        onConfirm={() => deletingCategory && deleteCategory.mutate(deletingCategory.id, { onSuccess: () => setDeletingCategory(null) })}
      />
    </div>
  )
}
