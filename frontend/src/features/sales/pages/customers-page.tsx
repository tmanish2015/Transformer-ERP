import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Loader2, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
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
import { ImportExportToolbar, type ImportResult } from '@/components/shared/import-export-toolbar'
import { CUSTOMER_TYPES, customerSchema, type CustomerFormInput, type CustomerFormValues } from '@/features/sales/schemas/sales-schemas'
import { useCreateCustomer, useCustomers, useDeleteAllCustomers, useDeleteCustomer, useUpdateCustomer } from '@/features/sales/hooks/use-customers'
import type { Customer } from '@/features/sales/types/sales-types'
import type { ExcelColumn } from '@/lib/excel-io'
import { useAuth } from '@/providers/auth-provider'

const CUSTOMER_TYPE_LABELS: Record<(typeof CUSTOMER_TYPES)[number], string> = {
  individual: 'Individual',
  business: 'Business',
  government: 'Government',
  psu: 'PSU / Semi-Government',
}

const CUSTOMER_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: 'Customer Code', key: 'customer_code' },
  { header: 'Customer', key: 'name' },
  { header: 'Customer Type', key: 'customer_type' },
  { header: 'GSTIN', key: 'gstin', aliases: ['GSTIN No', 'GSTIN Number', 'GST Number', 'GST No', 'GST No.', 'GSTIN No.'] },
  { header: 'Contact Person', key: 'contact_person' },
  { header: 'Mobile', key: 'phone' },
  { header: 'Billing Address', key: 'billing_address' },
  { header: 'State', key: 'state' },
  { header: 'PIN Code', key: 'pincode' },
]

// Customer Code is auto-generated on create, so the import template omits it.
const CUSTOMER_IMPORT_COLUMNS: ExcelColumn[] = CUSTOMER_EXPORT_COLUMNS.filter((c) => c.key !== 'customer_code')

function CustomerFormDialog({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (open: boolean) => void; customer: Customer | null }) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const isPending = createCustomer.isPending || updateCustomer.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInput, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    values: {
      name: customer?.name ?? '',
      customer_type: (customer?.customer_type as CustomerFormValues['customer_type']) ?? 'business',
      gstin: customer?.gstin ?? '',
      contact_person: customer?.contact_person ?? '',
      phone: customer?.phone ?? '',
      billing_address: customer?.billing_address ?? '',
      state: customer?.state ?? '',
      pincode: customer?.pincode ?? '',
      logo_url: customer?.logo_url ?? '',
    },
  })

  const onSubmit = (values: CustomerFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (customer) {
      updateCustomer.mutate({ id: customer.id, values }, { onSuccess })
    } else {
      createCustomer.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          <DialogDescription>Manage customer master records.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {customer && (
            <div className="space-y-1.5">
              <Label>Customer Code</Label>
              <Input value={customer.customer_code} disabled readOnly />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Customer</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Customer Type</Label>
              <Controller
                control={control}
                name="customer_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'business')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {CUSTOMER_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customer_type && <p className="text-xs text-destructive">{errors.customer_type.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" placeholder="22ABCDE1234F1Z5" {...register('gstin')} />
            {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" {...register('contact_person')} />
              {errors.contact_person && <p className="text-xs text-destructive">{errors.contact_person.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea id="billing_address" rows={2} {...register('billing_address')} />
            {errors.billing_address && <p className="text-xs text-destructive">{errors.billing_address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="Maharashtra" {...register('state')} />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">PIN Code</Label>
              <Input id="pincode" {...register('pincode')} />
              {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" placeholder="https://.../logo.png" {...register('logo_url')} />
            {errors.logo_url && <p className="text-xs text-destructive">{errors.logo_url.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {customer ? 'Save changes' : 'Create customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CustomersPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')

  const { data, isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const deleteAllCustomers = useDeleteAllCustomers()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  // Active customers always float to the top, ahead of inactive -- a stable
  // sort so everything else (the existing order from the query) is untouched
  // within each group. Driven by is_active so toggling a row re-sorts it
  // immediately on the next render.
  const sortedData = useMemo(
    () => [...(data ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active)),
    [data],
  )

const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'customer_code', header: 'Customer Code' },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.logo_url ? (
            <img src={row.original.logo_url} alt="" className="size-6 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span>{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: 'customer_type', header: 'Customer Type', cell: ({ row }) => CUSTOMER_TYPE_LABELS[row.original.customer_type as keyof typeof CUSTOMER_TYPE_LABELS] ?? row.original.customer_type },
    { accessorKey: 'gstin', header: 'GSTIN', cell: ({ row }) => row.original.gstin || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'contact_person', header: 'Contact Person', cell: ({ row }) => row.original.contact_person || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'phone', header: 'Mobile', cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'billing_address', header: 'Billing Address', cell: ({ row }) => row.original.billing_address || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'state', header: 'State', cell: ({ row }) => row.original.state || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'pincode', header: 'PIN Code', cell: ({ row }) => row.original.pincode || <span className="text-muted-foreground">—</span> },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (row.original.is_active ? <StatusBadge status="active" label="Active" /> : <StatusBadge status="inactive" label="Inactive" />),
    },
    {
      id: 'is_active',
      header: 'Enabled',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          disabled={!canManage}
          onCheckedChange={(checked) => updateCustomer.mutate({ id: row.original.id, values: { is_active: checked } })}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" onClick={() => navigate(`/sales/customers/${row.original.id}/360`)}>
            <Eye className="size-4" /> 360°
          </Button>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingCustomer(row.original)
                    setFormOpen(true)
                  }}
                >
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeletingCustomer(row.original)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ]

  const handleImportCustomers = async (rows: Record<string, string>[]): Promise<ImportResult> => {
    const errors: ImportResult['errors'] = []
    let successCount = 0

    // Match by exact (trimmed, case-insensitive) name against already-loaded
    // customers, so re-uploading the same file updates rows already imported
    // (e.g. to backfill GSTIN once it's parsed correctly) instead of creating
    // duplicates.
    const existingByName = new Map((data ?? []).map((c) => [c.name.trim().toLowerCase(), c]))

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      try {
        if (!r.name) throw new Error('Customer is required')
        const rawType = (r.customer_type || 'business').trim().toLowerCase() as CustomerFormValues['customer_type']
        if (r.customer_type && !CUSTOMER_TYPES.includes(rawType)) throw new Error(`Customer Type "${r.customer_type}" is invalid (expected one of ${CUSTOMER_TYPES.join(', ')})`)

        const payload = {
          name: r.name,
          customer_type: rawType,
          gstin: r.gstin,
          contact_person: r.contact_person,
          phone: r.phone,
          billing_address: r.billing_address,
          state: r.state,
          pincode: r.pincode,
        }
        const existing = existingByName.get(r.name.trim().toLowerCase())
        if (existing) {
          await updateCustomer.mutateAsync({ id: existing.id, values: payload })
        } else {
          await createCustomer.mutateAsync(payload)
        }
        successCount++
      } catch (err) {
        errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Failed to import row' })
      }
    }

    return { successCount, errors }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage the customer master."
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <ImportExportToolbar
                entityLabel="Customers"
                exportFilename="customers.xlsx"
                exportColumns={CUSTOMER_EXPORT_COLUMNS}
                getExportRows={() =>
                  (data ?? []).map((c) => ({
                    customer_code: c.customer_code,
                    name: c.name,
                    customer_type: c.customer_type,
                    gstin: c.gstin ?? '',
                    contact_person: c.contact_person ?? '',
                    phone: c.phone ?? '',
                    billing_address: c.billing_address ?? '',
                    state: c.state ?? '',
                    pincode: c.pincode ?? '',
                  }))
                }
                importColumns={CUSTOMER_IMPORT_COLUMNS}
                importDescription="Upload an .xlsx file with your customers. Customer Type must be one of: individual, business, government, psu."
                onImport={handleImportCustomers}
                onClearExisting={async () => {
                  const { deleted, blocked } = await deleteAllCustomers.mutateAsync()
                  if (blocked > 0) {
                    throw new Error(
                      `Customers could not be completely deleted because some are linked to existing transactions. ${deleted} deleted, ${blocked} blocked.`,
                    )
                  }
                  return deleted
                }}
              />
              <Button
                onClick={() => {
                  setEditingCustomer(null)
                  setFormOpen(true)
                }}
              >
                <Plus /> Add Customer
              </Button>
            </div>
          )
        }
      />

      <DataTable
        columns={columns}
        data={sortedData}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Users} title="No customers yet" description="Add your first customer to start creating quotations and sales orders." />}
      />

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editingCustomer} />

      <DeleteConfirmDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="Delete customer?"
        description={`This will permanently delete "${deletingCustomer?.name}".`}
        isPending={deleteCustomer.isPending}
        onConfirm={() => deletingCustomer && deleteCustomer.mutate(deletingCustomer.id, { onSuccess: () => setDeletingCustomer(null) })}
      />
    </div>
  )
}
