import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PackageCheck, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGoodsReceipts } from '@/features/purchases/hooks/use-goods-receipts'
import { ReceiveGoodsDialog } from '@/features/purchases/components/receive-goods-dialog'
import { useAuth } from '@/providers/auth-provider'

interface GoodsReceiptRow {
  id: string
  grn_number: string
  received_date: string
  notes: string | null
  purchase_order: { id: string; po_number: string; supplier: { id: string; name: string } }
  warehouse: { id: string; name: string }
}

export function GoodsReceiptsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('purchases.manage')
  const { data, isLoading } = useGoodsReceipts()
  const [search, setSearch] = useState('')
  const [receiveOpen, setReceiveOpen] = useState(false)

  const columns: ColumnDef<GoodsReceiptRow>[] = [
    { id: 'grn_number', header: ({ column }) => <DataTableColumnHeader column={column} title="GRN Number" />, accessorFn: (row) => row.grn_number },
    { id: 'po_number', header: 'Purchase Order', cell: ({ row }) => row.original.purchase_order.po_number },
    { id: 'supplier', header: 'Supplier', cell: ({ row }) => row.original.purchase_order.supplier.name },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.warehouse.name },
    {
      id: 'received_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received Date" />,
      accessorFn: (row) => row.received_date,
      cell: ({ row }) => new Date(row.original.received_date).toLocaleDateString(),
    },
    { id: 'notes', header: 'Notes', cell: ({ row }) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{row.original.notes ?? '—'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receipt"
        description="Record items received from suppliers against open purchase orders."
        actions={
          canManage && (
            <Button onClick={() => setReceiveOpen(true)}>
              <Plus /> Receive Goods
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={(data as GoodsReceiptRow[]) ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search receipts..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={PackageCheck} title="No goods received yet" description="Receipts will appear here once you receive items against a purchase order." />}
      />

      <ReceiveGoodsDialog open={receiveOpen} onOpenChange={setReceiveOpen} />
    </div>
  )
}
