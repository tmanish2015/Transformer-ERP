import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ClipboardCheck, FileText, IndianRupee, Loader2, Plus, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRentalAgreement } from '@/features/rental/hooks/use-rental-agreements'
import { useRentalDispatchForAgreement } from '@/features/rental/hooks/use-rental-dispatch'
import { useRentalReturnForAgreement } from '@/features/rental/hooks/use-rental-returns'
import { useRentalInspectionForReturn } from '@/features/rental/hooks/use-rental-inspections'
import { useDamageAssessmentsForInspection } from '@/features/rental/hooks/use-rental-damage-assessments'
import { useCreateRentalInvoice, useInvoiceForRentalAgreement } from '@/features/rental/hooks/use-rental-invoice'
import { useTrip } from '@/features/logistics/hooks/use-trips'
import { RentalDispatchDialog } from '@/features/rental/components/rental-dispatch-dialog'
import { RentalReturnDialog } from '@/features/rental/components/rental-return-dialog'
import { RentalInspectionDialog } from '@/features/rental/components/rental-inspection-dialog'
import { RentalDamageAssessmentDialog } from '@/features/rental/components/rental-damage-assessment-dialog'
import { RENTAL_AGREEMENT_STATUS_LABELS, RENTAL_ASSET_STATUS_LABELS, RENTAL_CONDITION_RATING_LABELS } from '@/features/rental/types/rental-types'
import { INVOICE_STATUS_LABELS } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalAgreementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')

  const { data: agreement, isLoading } = useRentalAgreement(id)
  const { data: dispatch, isLoading: dispatchLoading } = useRentalDispatchForAgreement(id)
  const { data: trip } = useTrip(dispatch?.trip_id ?? undefined)
  const { data: rentalReturn, isLoading: returnLoading } = useRentalReturnForAgreement(id)
  const { data: inspection, isLoading: inspectionLoading } = useRentalInspectionForReturn(rentalReturn?.id)
  const { data: damageItems } = useDamageAssessmentsForInspection(inspection?.condition_rating === 'damaged' ? inspection.id : undefined)
  const { data: invoice } = useInvoiceForRentalAgreement(id)
  const createInvoice = useCreateRentalInvoice(id ?? '')
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false)
  const [damageDialogOpen, setDamageDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!agreement) {
    return <EmptyState icon={FileText} title="Rental agreement not found" />
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/rental/agreements')} className="mb-2">
          <ArrowLeft className="size-4" /> Back to Agreements
        </Button>
        <PageHeader
          title={agreement.agreement_number}
          description={`${agreement.rental_asset.asset_code} — ${agreement.rental_asset.name}`}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge
                status={agreement.rental_asset.status}
                label={RENTAL_ASSET_STATUS_LABELS[agreement.rental_asset.status as keyof typeof RENTAL_ASSET_STATUS_LABELS]}
              />
              {canManage && !dispatchLoading && !dispatch && agreement.rental_asset.status === 'booked' && (
                <Button size="sm" onClick={() => setDispatchDialogOpen(true)}>
                  <Truck className="size-4" /> Dispatch
                </Button>
              )}
              {canManage && !returnLoading && !rentalReturn && agreement.rental_asset.status === 'running' && (
                <Button size="sm" onClick={() => setReturnDialogOpen(true)}>
                  <Truck className="size-4" /> Mark Returned
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agreement Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium text-foreground">{agreement.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium text-foreground">
                {new Date(agreement.start_date).toLocaleDateString()} – {new Date(agreement.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-medium text-foreground">₹{agreement.security_deposit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Late Return Charge / Day</span>
              <span className="font-medium text-foreground">₹{agreement.late_return_charge_rate.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operator Provided</span>
              <span className="font-medium text-foreground">{agreement.operator_provided ? `Yes — ₹${agreement.operator_charge_rate.toLocaleString('en-IN')}/day` : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Charge / Day</span>
              <span className="font-medium text-foreground">₹{agreement.fuel_charge_rate.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agreement Status</span>
              <StatusBadge status={agreement.status} label={RENTAL_AGREEMENT_STATUS_LABELS[agreement.status as keyof typeof RENTAL_AGREEMENT_STATUS_LABELS]} />
            </div>
            {agreement.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1 text-foreground">{agreement.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispatch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dispatchLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : !dispatch ? (
              <p className="text-muted-foreground">Not dispatched yet.</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispatched At</span>
                  <span className="font-medium text-foreground">{new Date(dispatch.dispatched_at).toLocaleString()}</span>
                </div>
                {trip && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-medium text-foreground">{trip.vehicle?.registration_no ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver</span>
                      <span className="font-medium text-foreground">{trip.driver?.name ?? '—'}</span>
                    </div>
                  </>
                )}
                {dispatch.dispatch_condition_notes && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">Condition Notes</span>
                    <p className="mt-1 text-foreground">{dispatch.dispatch_condition_notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Return &amp; Inspection</CardTitle>
          {canManage && rentalReturn && !inspectionLoading && !inspection && (
            <Button size="sm" onClick={() => setInspectionDialogOpen(true)}>
              <ClipboardCheck className="size-4" /> Inspect
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {returnLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !rentalReturn ? (
            <p className="text-muted-foreground">Not returned yet.</p>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Returned At</span>
                <span className="font-medium text-foreground">{new Date(rentalReturn.returned_at).toLocaleString()}</span>
              </div>
              {rentalReturn.is_late && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Late By</span>
                  <span className="font-medium text-chart-critical">{rentalReturn.late_days} day(s)</span>
                </div>
              )}
              {rentalReturn.return_condition_notes && (
                <div>
                  <span className="text-muted-foreground">Pickup Condition Notes</span>
                  <p className="mt-1 text-foreground">{rentalReturn.return_condition_notes}</p>
                </div>
              )}

              {inspectionLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : inspection ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Condition</span>
                    <StatusBadge status={inspection.condition_rating} label={RENTAL_CONDITION_RATING_LABELS[inspection.condition_rating as keyof typeof RENTAL_CONDITION_RATING_LABELS]} />
                  </div>
                  {inspection.notes && <p className="text-foreground">{inspection.notes}</p>}

                  {inspection.condition_rating === 'damaged' && (
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <AlertTriangle className="size-4 text-chart-critical" /> Damage Items
                        </p>
                        {canManage && (
                          <Button variant="outline" size="sm" onClick={() => setDamageDialogOpen(true)}>
                            <Plus className="size-3.5" /> Add Item
                          </Button>
                        )}
                      </div>
                      {!damageItems || damageItems.length === 0 ? (
                        <p className="text-muted-foreground">No damage items logged yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {damageItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2">
                              <div>
                                <p className="text-foreground">{item.description}</p>
                                <p className="text-xs text-muted-foreground">{item.charged_to_customer ? 'Charged to customer' : 'Not charged to customer'}</p>
                              </div>
                              <span className="font-medium text-foreground">₹{item.estimated_repair_cost.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Not inspected yet.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Invoice</CardTitle>
          {canManage && agreement.status === 'completed' && !invoice && (
            <Button size="sm" disabled={createInvoice.isPending} onClick={() => createInvoice.mutate(agreement)}>
              {createInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : <IndianRupee className="size-4" />}
              Create Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-sm">
          {invoice ? (
            <div className="flex items-center justify-between">
              <Link to="/sales/invoices" className="font-medium text-primary hover:underline">
                {invoice.invoice_number}
              </Link>
              <StatusBadge status={invoice.status} label={INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS]} />
            </div>
          ) : (
            <p className="text-muted-foreground">Not invoiced yet. Available once the asset has been returned.</p>
          )}
        </CardContent>
      </Card>

      {id && <RentalDispatchDialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen} agreementId={id} />}
      {id && <RentalReturnDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen} agreementId={id} />}
      {rentalReturn && <RentalInspectionDialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen} returnId={rentalReturn.id} />}
      {inspection && <RentalDamageAssessmentDialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen} inspectionId={inspection.id} />}
    </div>
  )
}
