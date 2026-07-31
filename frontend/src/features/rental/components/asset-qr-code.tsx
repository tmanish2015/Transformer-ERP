import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface AssetQrCodeProps {
  assetCode: string
}

// Generated entirely client-side (no network call) so the asset code never leaves the
// browser — deliberately avoided the common shortcut of hitting a public QR-image API,
// which would send equipment identifiers to a third party for no real benefit.
export function AssetQrCode({ assetCode }: AssetQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(assetCode, { width: 180, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [assetCode])

  if (!dataUrl) return <Skeleton className="size-[180px]" />

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={dataUrl} alt={`QR code for ${assetCode}`} className="rounded-md border border-border" width={180} height={180} />
      <Button variant="outline" size="sm" render={<a href={dataUrl} download={`${assetCode}-qr.png`} />}>
        <Download className="size-4" /> Download
      </Button>
    </div>
  )
}
