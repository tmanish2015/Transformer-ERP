import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRentalAsset, useRentalAssetStatusLog } from '@/features/rental/hooks/use-rental-assets'
import { RentalAssetFormDialog } from '@/features/rental/components/rental-asset-form-dialog'
import { AssetQrCode } from '@/features/rental/components/asset-qr-code'
import { RENTAL_ASSET_STATUS_LABELS } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalAssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')

  const { data: asset, isLoading } = useRentalAsset(id)
  const { data: statusLog, isLoading: statusLogLoading } = useRentalAssetStatusLog(id)
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!asset) {
    return <EmptyState icon={FileText} title="Rental asset not found" />
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/rental/assets')} className="mb-2">
          <ArrowLeft className="size-4" /> Back to Assets
        </Button>
        <PageHeader
          title={asset.name}
          description={asset.asset_code}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={asset.status} label={RENTAL_ASSET_STATUS_LABELS[asset.status as keyof typeof RENTAL_ASSET_STATUS_LABELS]} />
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium text-foreground">{asset.category?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number</span>
              <span className="font-medium text-foreground">{asset.serial_number ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Location</span>
              <span className="font-medium text-foreground">{asset.current_location ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Rental Rate</span>
              <span className="font-medium text-foreground">₹{asset.daily_rental_rate.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Cost</span>
              <span className="font-medium text-foreground">{asset.purchase_cost ? `₹${asset.purchase_cost.toLocaleString('en-IN')}` : '—'}</span>
            </div>
            {asset.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1 text-foreground">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQrCode assetCode={asset.asset_code} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLogLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !statusLog || statusLog.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No status changes yet" description="History appears once this asset is booked, dispatched, or returned." />
            ) : (
              <ol className="space-y-3">
                {statusLog.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{RENTAL_ASSET_STATUS_LABELS[entry.status as keyof typeof RENTAL_ASSET_STATUS_LABELS]}</span>
                    <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <RentalAssetFormDialog open={editOpen} onOpenChange={setEditOpen} asset={asset} />
    </div>
  )
}
