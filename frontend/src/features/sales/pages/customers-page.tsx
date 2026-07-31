import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
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
import { customerSchema, type CustomerFormInput, type CustomerFormValues } from '@/features/sales/schemas/sales-schemas'
import { useCreateCustomer, useCustomers, useDeleteAllCustomers, useDeleteCustomer, useUpdateCustomer } from '@/features/sales/hooks/use-customers'
import { CUSTOMER_STATUS_LABELS, type Customer, type CustomerStatus } from '@/features/sales/types/sales-types'
import type { ExcelColumn } from '@/lib/excel-io'
import { useAuth } from '@/providers/auth-provider'

const CUSTOMER_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: 'Name', key: 'name' },
  { header: 'Contact Person', key: 'contact_person' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Billing Address', key: 'billing_address' },
  { header: 'Shipping Address', key: 'shipping_address' },
  { header: 'GSTIN', key: 'gstin' },
  { header: 'Credit Limit', key: 'credit_limit' },
  { header: 'Credit Days', key: 'credit_days' },
  { header: 'Status', key: 'status' },
]

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
      contact_person: customer?.contact_person ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      billing_address: customer?.billing_address ?? '',
      shipping_address: customer?.shipping_address ?? '',
      gstin: customer?.gstin ?? '',
      credit_limit: customer?.credit_limit ?? 0,
      credit_days: customer?.credit_days ?? 0,
      status: (customer?.status as CustomerFormValues['status']) ?? 'lead',
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
          <DialogDescription>Manage customer accounts and credit terms.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company / Customer Name</Label>
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
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea id="billing_address" rows={2} {...register('billing_address')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping_address">Shipping Address</Label>
            <Textarea id="shipping_address" rows={2} {...register('shipping_address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
              <Input id="credit_limit" type="number" step="0.01" {...register('credit_limit')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credit_days">Credit Days</Label>
              <Input id="credit_days" type="number" {...register('credit_days')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'lead')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'customer_code', header: ({ column }) => <DataTableColumnHeader column={column} title="Code" /> },
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span> },
    {
      id: 'credit_limit',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Credit Limit" />,
      accessorFn: (row) => row.credit_limit,
      cell: ({ row }) => `₹${row.original.credit_limit.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={CUSTOMER_STATUS_LABELS[row.original.status as keyof typeof CUSTOMER_STATUS_LABELS]} />,
    },
    {
      id: 'is_active',
      header: 'Enabled',
      cell: ({ row }) => <Switch checked={row.original.is_active} disabled={!canManage} onCheckedChange={(checked) => updateCustomer.mutate({ id: row.original.id, values: { is_active: checked } })} />,
    },
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
        ),
    },
  ]

  const handleImportCustomers = async (rows: Record<string, string>[]): Promise<ImportResult> => {
    const errors: ImportResult['errors'] = []
    let successCount = 0
    const validStatuses: CustomerStatus[] = ['lead', 'prospect', 'active', 'inactive', 'churned']

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      try {
        if (!r.name) throw new Error('Name is required')
        const rawStatus = (r.status || 'lead').trim().toLowerCase() as CustomerStatus
        if (r.status && !validStatuses.includes(rawStatus)) throw new Error(`Status "${r.status}" is invalid (expected one of ${validStatuses.join(', ')})`)

        await createCustomer.mutateAsync({
          name: r.name,
          contact_person: r.contact_person || '',
          email: r.email || '',
          phone: r.phone || '',
          billing_address: r.billing_address || '',
          shipping_address: r.shipping_address || '',
          gstin: r.gstin || '',
          credit_limit: Number(r.credit_limit) || 0,
          credit_days: Number(r.credit_days) || 0,
          status: rawStatus,
        })
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
        description="Manage customer accounts and credit terms."
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <ImportExportToolbar
                entityLabel="Customers"
                exportFilename="customers.xlsx"
                exportColumns={CUSTOMER_EXPORT_COLUMNS}
                getExportRows={() =>
                  (data ?? []).map((c) => ({
                    name: c.name,
                    contact_person: c.contact_person ?? '',
                    email: c.email ?? '',
                    phone: c.phone ?? '',
                    billing_address: c.billing_address ?? '',
                    shipping_address: c.shipping_address ?? '',
                    gstin: c.gstin ?? '',
                    credit_limit: c.credit_limit,
                    credit_days: c.credit_days,
                    status: c.status,
                  }))
                }
                importColumns={CUSTOMER_EXPORT_COLUMNS}
                importDescription="Upload an .xlsx file with your customers. Status must be one of: lead, prospect, active, inactive, churned."
                onImport={handleImportCustomers}
                onClearExisting={async () => {
                  const count = data?.length ?? 0
                  await deleteAllCustomers.mutateAsync()
                  return count
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
        data={data ?? []}
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
