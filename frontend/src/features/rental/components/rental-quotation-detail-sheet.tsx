import { Fragment, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRentalQuotationItems, useSendRentalQuotation } from '@/features/rental/hooks/use-rental-quotations'
import { RentalBookingFormDialog } from '@/features/rental/components/rental-booking-form-dialog'
import { RENTAL_QUOTATION_STATUS_LABELS, type RentalQuotationWithRelations } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

interface RentalQuotationDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: RentalQuotationWithRelations | null
}

export function RentalQuotationDetailSheet({ open, onOpenChange, quotation }: RentalQuotationDetailSheetProps) {
  const { data: items, isLoading } = useRentalQuotationItems(quotation?.id)
  const sendQuotation = useSendRentalQuotation()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')

  const [bookingItem, setBookingItem] = useState<{ assetId: string; label: string } | null>(null)

  if (!quotation) return null

  const canBook = ['draft', 'sent'].includes(quotation.status)

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{quotation.quotation_number}</DialogTitle>
          <DialogDescription>{quotation.customer.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={quotation.status} label={RENTAL_QUOTATION_STATUS_LABELS[quotation.status as keyof typeof RENTAL_QUOTATION_STATUS_LABELS]} />
            <span className="text-sm text-muted-foreground">Valid until {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '—'}</span>
          </div>

          <Separator />

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {canManage && canBook && <TableHead className="w-24" />}
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
                        <p className="font-medium text-foreground">{item.rental_asset.name}</p>
                        <p className="text-xs text-muted-foreground">{item.rental_asset.asset_code}</p>
                      </TableCell>
                      <TableCell className="text-right">{item.rental_days}</TableCell>
                      <TableCell className="text-right">₹{item.daily_rate.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-medium">₹{(item.line_total ?? 0).toLocaleString('en-IN')}</TableCell>
                      {canManage && canBook && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBookingItem({ assetId: item.rental_asset_id, label: `${item.rental_asset.asset_code} — ${item.rental_asset.name}` })}
                          >
                            Book
                          </Button>
                        </TableCell>
                      )}
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

          {canManage && quotation.status === 'draft' && (
            <>
              <Separator />
              <Button size="sm" disabled={sendQuotation.isPending} onClick={() => sendQuotation.mutate(quotation.id)}>
                {sendQuotation.isPending && <Loader2 className="size-4 animate-spin" />}
                Mark as Sent
              </Button>
            </>
          )}
        </div>
      </DialogContent>
      </Dialog>

      {bookingItem && (
        <RentalBookingFormDialog
          open={Boolean(bookingItem)}
          onOpenChange={(o) => !o && setBookingItem(null)}
          presetCustomerId={quotation.customer_id}
          presetAssetId={bookingItem.assetId}
          presetAssetLabel={bookingItem.label}
          rentalQuotationId={quotation.id}
        />
      )}
    </Fragment>
  )
}
