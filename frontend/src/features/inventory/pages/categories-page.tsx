import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { categorySchema, type CategoryFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/inventory/hooks/use-categories'
import type { Category } from '@/features/inventory/types/inventory-types'

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  categories: Category[]
}) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      parent_id: category?.parent_id ?? null,
    },
  })

  const onSubmit = (values: CategoryFormValues) => {
    const payload = { ...values, parent_id: values.parent_id || null }
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (category) {
      updateCategory.mutate({ id: category.id, values: payload }, { onSuccess })
    } else {
      createCategory.mutate(payload, { onSuccess })
    }
  }

  const parentOptions = categories.filter((c) => c.id !== category?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>Organize products into categories and subcategories.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Distribution Transformers" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Parent Category</Label>
            <Controller
              control={control}
              name="parent_id"
              render={({ field }) => (
                <Select value={field.value ?? 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None (top-level category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level category)</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
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

export function CategoriesPage() {
  const { data, isLoading } = useCategories()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const categoryMap = new Map((data ?? []).map((c) => [c.id, c.name]))

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    {
      accessorKey: 'parent_id',
      header: 'Parent',
      cell: ({ row }) => (row.original.parent_id ? categoryMap.get(row.original.parent_id) : <span className="text-muted-foreground">—</span>),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{row.original.description || '—'}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
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
        title="Categories"
        description="Organize your catalog with categories and subcategories."
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
        emptyState={<EmptyState icon={Tags} title="No categories yet" description="Create your first category to organize products." />}
      />

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} categories={data ?? []} />

      <DeleteConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete category?"
        description={`This will permanently delete "${deletingCategory?.name}". Products in this category will be uncategorized.`}
        isPending={deleteCategory.isPending}
        onConfirm={() => deletingCategory && deleteCategory.mutate(deletingCategory.id, { onSuccess: () => setDeletingCategory(null) })}
      />
    </div>
  )
}
