import { Link } from 'react-router-dom'
import { Loader2, Truck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCancelSalesOrder, useSalesOrderItems } from '@/features/sales/hooks/use-sales-orders'
import { SO_STATUS_LABELS, type SalesOrderWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

interface SalesOrderDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesOrder: SalesOrderWithRelations | null
}

export function SalesOrderDetailSheet({ open, onOpenChange, salesOrder }: SalesOrderDetailSheetProps) {
  const { data: items, isLoading } = useSalesOrderItems(salesOrder?.id)
  const cancelSO = useCancelSalesOrder()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')

  if (!salesOrder) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{salesOrder.so_number}</DialogTitle>
          <DialogDescription>{salesOrder.customer.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={salesOrder.status} label={SO_STATUS_LABELS[salesOrder.status as keyof typeof SO_STATUS_LABELS]} />
            <span className="text-sm text-muted-foreground">{salesOrder.warehouse.name}</span>
          </div>

          <Separator />

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : (
                  items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.product.hsn_code ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.product.unit.short_code}
                      </TableCell>
                      <TableCell className="text-right">{item.delivered_quantity}</TableCell>
                      <TableCell className="text-right font-medium">₹{(item.line_total ?? 0).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Subtotal: </span>
              <span className="font-medium text-foreground">₹{salesOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tax: </span>
              <span className="font-medium text-foreground">₹{salesOrder.tax_total.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-foreground">₹{salesOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {salesOrder.notes && <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{salesOrder.notes}</div>}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {['confirmed', 'partially_delivered'].includes(salesOrder.status) && (
              <Button size="sm" variant="outline" render={<Link to="/sales/delivery-challans" />} nativeButton={false}>
                <Truck className="size-3.5" /> Create Delivery Challan
              </Button>
            )}
            {canManage && !['delivered', 'invoiced', 'cancelled'].includes(salesOrder.status) && (
              <Button size="sm" variant="destructive" disabled={cancelSO.isPending} onClick={() => cancelSO.mutate(salesOrder.id, { onSuccess: () => onOpenChange(false) })}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
