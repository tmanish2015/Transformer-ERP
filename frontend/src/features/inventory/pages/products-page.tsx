import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { useCategories } from '@/features/inventory/hooks/use-categories'
import { useBrands } from '@/features/inventory/hooks/use-brands'
import { useDeleteProduct, useProducts } from '@/features/inventory/hooks/use-products'
import { ProductFormDialog } from '@/features/inventory/components/product-form-dialog'
import { getStockStatus, type ProductWithRelations } from '@/features/inventory/types/inventory-types'
import { useAuth } from '@/providers/auth-provider'

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export function ProductsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')

  const { data: products, isLoading } = useProducts()
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const deleteProduct = useDeleteProduct()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductWithRelations | null>(null)

  const filteredProducts = useMemo(() => {
    return (products ?? []).filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false
      if (brandFilter !== 'all' && p.brand_id !== brandFilter) return false
      if (stockFilter !== 'all' && getStockStatus(p.total_stock, p.reorder_level) !== stockFilter) return false
      return true
    })
  }, [products, categoryFilter, brandFilter, stockFilter])

  const columns: ColumnDef<ProductWithRelations>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'brand',
      header: 'Brand',
      cell: ({ row }) => row.original.brand?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'stock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      accessorFn: (row) => row.total_stock,
      cell: ({ row }) => {
        const status = getStockStatus(row.original.total_stock, row.original.reorder_level)
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {row.original.total_stock} {row.original.unit.short_code}
            </span>
            <StatusBadge status={status} label={STATUS_LABELS[status]} />
          </div>
        )
      },
    },
    {
      accessorKey: 'selling_price',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Selling Price" />,
      cell: ({ row }) => `₹${row.original.selling_price.toLocaleString('en-IN')}`,
    },
    { accessorKey: 'gst_rate', header: 'GST', cell: ({ row }) => `${row.original.gst_rate}%` },
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
                  setEditingProduct(row.original)
                  setFormOpen(true)
                }}
              >
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingProduct(row.original)}>
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
        title="Product Master"
        description="Manage your full product catalog, pricing, and tax details."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditingProduct(null)
                setFormOpen(true)
              }}
            >
              <Plus /> Add Product
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={(value) => setBrandFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={Package} title="No products found" description="Try adjusting your filters, or add your first product to the catalog." />}
      />

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />

      <DeleteConfirmDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Delete product?"
        description={`This will permanently delete "${deletingProduct?.name}" and all its stock movement history.`}
        isPending={deleteProduct.isPending}
        onConfirm={() => deletingProduct && deleteProduct.mutate(deletingProduct.id, { onSuccess: () => setDeletingProduct(null) })}
      />
    </div>
  )
}
