import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeliveryChallans } from '@/features/sales/hooks/use-delivery-challans'
import { DeliverGoodsDialog } from '@/features/sales/components/deliver-goods-dialog'
import type { DeliveryChallanWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function DeliveryChallansPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')
  const location = useLocation()
  const navigate = useNavigate()

  const { data, isLoading } = useDeliveryChallans()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialSalesOrderId, setInitialSalesOrderId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const soId = (location.state as { salesOrderId?: string } | null)?.salesOrderId
    if (soId) {
      setInitialSalesOrderId(soId)
      setDialogOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: ColumnDef<DeliveryChallanWithRelations>[] = [
    { id: 'dc_number', header: ({ column }) => <DataTableColumnHeader column={column} title="DC Number" />, accessorFn: (row) => row.dc_number },
    { id: 'so_number', header: 'Sales Order', cell: ({ row }) => row.original.sales_order.so_number },
{ id: 'customer', header: 'Customer', cell: ({ row }) => row.original.sales_order.customer.name },
    { id: 'gstin', header: 'GSTIN', cell: ({ row }) => row.original.sales_order.customer.gstin ?? <span className="text-muted-foreground">—</span> },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.warehouse.name },
    {
      id: 'delivery_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Date" />,
      accessorFn: (row) => row.delivery_date,
      cell: ({ row }) => new Date(row.original.delivery_date).toLocaleDateString(),
    },
    { id: 'vehicle_number', header: 'Vehicle', cell: ({ row }) => row.original.vehicle_number || <span className="text-muted-foreground">—</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Challans"
        description="Record partial or full deliveries against confirmed sales orders."
        actions={
          canManage && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus /> New Delivery Challan
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search delivery challans..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Truck} title="No delivery challans yet" description="Create a delivery challan to dispatch goods against a sales order." />}
      />

      <DeliverGoodsDialog open={dialogOpen} onOpenChange={setDialogOpen} initialSalesOrderId={initialSalesOrderId} />
    </div>
  )
}
