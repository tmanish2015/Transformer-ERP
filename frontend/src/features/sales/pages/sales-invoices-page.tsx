import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, Loader2, Plus, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DocumentShareDialog } from '@/components/shared/document-share-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalesInvoices } from '@/features/sales/hooks/use-sales-invoices'
import { fetchSalesInvoiceItems } from '@/features/sales/api/sales-api'
import { CreateInvoiceDialog } from '@/features/sales/components/create-invoice-dialog'
import { SalesInvoiceDetailDialog } from '@/features/sales/components/sales-invoice-detail-dialog'
import { INVOICE_STATUS_LABELS, isInvoiceOverdue, type SalesInvoiceWithRelations } from '@/features/sales/types/sales-types'
import { useCompanyProfile } from '@/features/settings/hooks/use-company-profile'
import { generateDocumentPdf, type PdfLineItem } from '@/lib/pdf-generator'
import { useAuth } from '@/providers/auth-provider'

export function SalesInvoicesPage() {
  const { hasPermission, profile } = useAuth()
  const canManage = hasPermission('sales.manage')
  const { data: company } = useCompanyProfile()

  const { data, isLoading } = useSalesInvoices()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<SalesInvoiceWithRelations | null>(null)
  const [shareTarget, setShareTarget] = useState<{ invoice: SalesInvoiceWithRelations; items: PdfLineItem[] } | null>(null)
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null)

  const handleShare = async (invoice: SalesInvoiceWithRelations) => {
    setLoadingShareId(invoice.id)
    try {
      const rawItems = await fetchSalesInvoiceItems(invoice.id)
      const items: PdfLineItem[] = rawItems.map((i) => ({
        description: i.product?.name ?? i.description ?? 'Item',
        hsn_code: i.product?.hsn_code ?? null,
        quantity: i.quantity,
        unit: i.product?.unit?.short_code ?? null,
        unit_price: i.unit_price,
        gst_rate: i.gst_rate,
        line_total: i.line_total,
      }))
      setShareTarget({ invoice, items })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load invoice items')
    } finally {
      setLoadingShareId(null)
    }
  }

  const filtered = useMemo(() => {
    return (data ?? []).filter((invoice) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'overdue') return isInvoiceOverdue(invoice)
      return invoice.status === statusFilter
    })
  }, [data, statusFilter])

  const columns: ColumnDef<SalesInvoiceWithRelations>[] = [
    {
      id: 'invoice_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
      accessorFn: (row) => row.invoice_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelected(row.original)}>
          {row.original.invoice_number}
        </button>
      ),
    },
{ id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'gstin', header: 'GSTIN', cell: ({ row }) => row.original.customer.gstin ?? <span className="text-muted-foreground">—</span> },
    { id: 'so_number', header: 'Sales Order', cell: ({ row }) => row.original.sales_order?.so_number ?? <span className="text-muted-foreground">—</span> },
    {
      id: 'invoice_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice Date" />,
      accessorFn: (row) => row.invoice_date,
      cell: ({ row }) => new Date(row.original.invoice_date).toLocaleDateString(),
    },
    {
      id: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (row) => row.total,
      cell: ({ row }) => `₹${row.original.total.toLocaleString('en-IN')}`,
    },
    { id: 'balance', header: 'Balance Due', cell: ({ row }) => `₹${(row.original.total - row.original.amount_received).toLocaleString('en-IN')}` },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const overdue = isInvoiceOverdue(row.original)
        return <StatusBadge status={overdue ? 'overdue' : row.original.status} label={overdue ? 'Overdue' : INVOICE_STATUS_LABELS[row.original.status as keyof typeof INVOICE_STATUS_LABELS]} />
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={loadingShareId === row.original.id}
          onClick={(e) => {
            e.stopPropagation()
            void handleShare(row.original)
          }}
        >
          {loadingShareId === row.original.id ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Invoice customers from confirmed sales orders and track receivables."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New Invoice
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={FileText} title="No invoices yet" description="Create an invoice from a confirmed sales order." />}
      />

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SalesInvoiceDetailDialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} invoice={selected} />

      {shareTarget && company && profile?.companyId && (
        <DocumentShareDialog
          open={Boolean(shareTarget)}
          onOpenChange={(open) => !open && setShareTarget(null)}
          docLabel={`Invoice ${shareTarget.invoice.invoice_number}`}
          docType="invoice"
          docId={shareTarget.invoice.id}
          companyId={profile.companyId}
          partyName={shareTarget.invoice.customer.name}
          partyEmail={shareTarget.invoice.customer.email}
          partyPhone={shareTarget.invoice.customer.phone}
          buildPdf={() =>
            generateDocumentPdf({
              docTitle: 'Tax Invoice',
              docNumber: shareTarget.invoice.invoice_number,
              docDate: shareTarget.invoice.invoice_date,
              dueOrValidLabel: 'Due Date',
              dueOrValidDate: shareTarget.invoice.due_date,
              company,
              party: {
                name: shareTarget.invoice.customer.name,
                address: shareTarget.invoice.customer.billing_address,
                gstin: shareTarget.invoice.customer.gstin,
                pan_number: shareTarget.invoice.customer.pan_number,
                phone: shareTarget.invoice.customer.phone,
                email: shareTarget.invoice.customer.email,
              },
              partyLabel: 'Bill To',
              items: shareTarget.items,
              subtotal: shareTarget.invoice.subtotal,
              discountTotal: shareTarget.invoice.discount_total,
              taxTotal: shareTarget.invoice.tax_total,
              total: shareTarget.invoice.total,
              notes: shareTarget.invoice.notes,
            })
          }
        />
      )}
    </div>
  )
}
