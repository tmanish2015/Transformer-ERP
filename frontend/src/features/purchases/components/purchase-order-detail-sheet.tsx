import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePurchaseOrderItems, useUpdatePurchaseOrderStatus } from '@/features/purchases/hooks/use-purchase-orders'
import { PO_STATUS_LABELS, type PurchaseOrderWithRelations } from '@/features/purchases/types/purchase-types'
import { useAuth } from '@/providers/auth-provider'

interface PurchaseOrderDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrderWithRelations | null
}

export function PurchaseOrderDetailSheet({ open, onOpenChange, purchaseOrder }: PurchaseOrderDetailSheetProps) {
  const { data: items, isLoading } = usePurchaseOrderItems(purchaseOrder?.id)
  const updateStatus = useUpdatePurchaseOrderStatus()
  const { hasPermission, user } = useAuth()
  const canManage = hasPermission('purchases.manage')

  if (!purchaseOrder) return null

  const transition = (status: string) => {
    const extra = status === 'approved' ? { approved_by: user?.id, approved_at: new Date().toISOString() } : undefined
    updateStatus.mutate({ id: purchaseOrder.id, status, extra })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{purchaseOrder.po_number}</DialogTitle>
          <DialogDescription>{purchaseOrder.supplier.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={purchaseOrder.status} label={PO_STATUS_LABELS[purchaseOrder.status as keyof typeof PO_STATUS_LABELS]} />
            <span className="text-sm text-muted-foreground">{new Date(purchaseOrder.order_date).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Deliver To</p>
              <p className="font-medium text-foreground">{purchaseOrder.warehouse.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expected Date</p>
              <p className="font-medium text-foreground">{purchaseOrder.expected_date ? new Date(purchaseOrder.expected_date).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
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
                      <TableCell className="text-right">{item.received_quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unit_price.toLocaleString('en-IN')}</TableCell>
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
              <span className="font-medium text-foreground">₹{purchaseOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tax: </span>
              <span className="font-medium text-foreground">₹{purchaseOrder.tax_total.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-foreground">₹{purchaseOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {purchaseOrder.notes && <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{purchaseOrder.notes}</div>}

          {canManage && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {purchaseOrder.status === 'draft' && (
                  <Button size="sm" onClick={() => transition('pending_approval')}>
                    Submit for Approval
                  </Button>
                )}
                {purchaseOrder.status === 'pending_approval' && (
                  <Button size="sm" onClick={() => transition('approved')}>
                    Approve
                  </Button>
                )}
                {purchaseOrder.status === 'approved' && (
                  <Button size="sm" onClick={() => transition('sent')}>
                    Mark as Sent
                  </Button>
                )}
                {!['received', 'cancelled'].includes(purchaseOrder.status) && (
                  <Button size="sm" variant="destructive" onClick={() => transition('cancelled')}>
                    Cancel Order
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
