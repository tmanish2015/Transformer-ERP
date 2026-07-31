import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { productSchema, type ProductFormInput, type ProductFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useCategories } from '@/features/inventory/hooks/use-categories'
import { useBrands } from '@/features/inventory/hooks/use-brands'
import { useUnits } from '@/features/inventory/hooks/use-units'
import { useCreateProduct, useUpdateProduct } from '@/features/inventory/hooks/use-products'
import type { ProductWithRelations } from '@/features/inventory/types/inventory-types'

const DEFAULT_VALUES: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  category_id: null,
  brand_id: null,
  unit_id: '',
  hsn_code: '',
  gst_rate: 18,
  purchase_price: 0,
  selling_price: 0,
  barcode: '',
  reorder_level: 0,
  reorder_quantity: 0,
  is_batch_tracked: false,
  is_serial_tracked: false,
  is_active: true,
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductWithRelations | null
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: units } = useUnits()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isPending = createProduct.isPending || updateProduct.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              sku: product.sku,
              name: product.name,
              description: product.description ?? '',
              category_id: product.category_id,
              brand_id: product.brand_id,
              unit_id: product.unit_id,
              hsn_code: product.hsn_code ?? '',
              gst_rate: product.gst_rate,
              purchase_price: product.purchase_price,
              selling_price: product.selling_price,
              barcode: product.barcode ?? '',
              reorder_level: product.reorder_level,
              reorder_quantity: product.reorder_quantity,
              is_batch_tracked: product.is_batch_tracked,
              is_serial_tracked: product.is_serial_tracked,
              is_active: product.is_active,
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, product, reset])

  const onSubmit = (values: ProductFormValues) => {
    const onSuccess = () => onOpenChange(false)
    if (product) {
      updateProduct.mutate({ id: product.id, values }, { onSuccess })
    } else {
      createProduct.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'New Product'}</DialogTitle>
          <DialogDescription>{product ? `Editing ${product.sku}` : 'Add a new product to your catalog.'}</DialogDescription>
        </DialogHeader>

        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register('sku')} />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="Scan or enter barcode" {...register('barcode')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories?.map((c) => (
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
              <Label>Brand</Label>
              <Controller
                control={control}
                name="brand_id"
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {brands?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Controller
                control={control}
                name="unit_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.short_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unit_id && <p className="text-xs text-destructive">{errors.unit_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input id="hsn_code" {...register('hsn_code')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gst_rate">GST Rate (%)</Label>
              <Input id="gst_rate" type="number" step="0.01" {...register('gst_rate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchase_price">Purchase Price (₹)</Label>
              <Input id="purchase_price" type="number" step="0.01" {...register('purchase_price')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling_price">Selling Price (₹)</Label>
              <Input id="selling_price" type="number" step="0.01" {...register('selling_price')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input id="reorder_level" type="number" step="0.01" {...register('reorder_level')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
              <Input id="reorder_quantity" type="number" step="0.01" {...register('reorder_quantity')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Batch Tracked</p>
                <p className="text-xs text-muted-foreground">Track by manufacturing batch with expiry.</p>
              </div>
              <Controller control={control} name="is_batch_tracked" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Serial Tracked</p>
                <p className="text-xs text-muted-foreground">Track by individual serial number.</p>
              </div>
              <Controller control={control} name="is_serial_tracked" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Inactive products are hidden from selection lists.</p>
            </div>
            <Controller control={control} name="is_active" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
