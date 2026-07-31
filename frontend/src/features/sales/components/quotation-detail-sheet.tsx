import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShoppingCart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConvertQuotationToSalesOrder, useQuotationItems, useUpdateQuotationStatus } from '@/features/sales/hooks/use-quotations'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { QUOTATION_STATUS_LABELS, type QuotationWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

interface QuotationDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: QuotationWithRelations | null
}

export function QuotationDetailSheet({ open, onOpenChange, quotation }: QuotationDetailSheetProps) {
  const { data: items, isLoading } = useQuotationItems(quotation?.id)
  const { data: warehouses } = useWarehouses()
  const updateStatus = useUpdateQuotationStatus()
  const convertToSO = useConvertQuotationToSalesOrder()
  const { hasPermission, user } = useAuth()
  const canManage = hasPermission('sales.manage')

  const [warehouseId, setWarehouseId] = useState('')

  if (!quotation) return null

  const transition = (status: string) => {
    const extra = status === 'approved' ? { approved_by: user?.id, approved_at: new Date().toISOString() } : undefined
    updateStatus.mutate({ id: quotation.id, status, extra })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{quotation.quotation_number}</DialogTitle>
          <DialogDescription>{quotation.customer.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={quotation.status} label={QUOTATION_STATUS_LABELS[quotation.status as keyof typeof QUOTATION_STATUS_LABELS]} />
            <span className="text-sm text-muted-foreground">Valid until {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '—'}</span>
          </div>

          <Separator />

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
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
                      <TableCell className="text-right">
                        ₹{item.unit_price.toLocaleString('en-IN')}
                        {item.discount_percent > 0 && <span className="ml-1 text-xs text-muted-foreground">(-{item.discount_percent}%)</span>}
                      </TableCell>
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
              <span className="font-medium text-foreground">₹{quotation.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tax: </span>
              <span className="font-medium text-foreground">₹{quotation.tax_total.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-foreground">₹{quotation.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {quotation.notes && <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{quotation.notes}</div>}

          {canManage && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {quotation.status === 'draft' && (
                  <Button size="sm" onClick={() => transition('pending_approval')}>
                    Submit for Approval
                  </Button>
                )}
                {quotation.status === 'pending_approval' && (
                  <Button size="sm" onClick={() => transition('approved')}>
                    Approve
                  </Button>
                )}
                {quotation.status === 'approved' && (
                  <Button size="sm" onClick={() => transition('sent')}>
                    Mark as Sent
                  </Button>
                )}
                {quotation.status === 'sent' && (
                  <>
                    <Button size="sm" onClick={() => transition('accepted')}>
                      Mark Accepted
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => transition('rejected')}>
                      Mark Rejected
                    </Button>
                  </>
                )}
              </div>

              {quotation.status === 'accepted' && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Convert to Sales Order</p>
                  <div className="flex gap-2">
                    <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? '')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!warehouseId || convertToSO.isPending} onClick={() => convertToSO.mutate({ quotationId: quotation.id, warehouseId }, { onSuccess: () => onOpenChange(false) })}>
                      {convertToSO.isPending && <Loader2 className="size-4 animate-spin" />}
                      <ShoppingCart className="size-3.5" /> Convert
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button variant="outline" size="sm" className="w-full" render={<Link to="/sales/orders" />} nativeButton={false}>
            View Sales Orders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
