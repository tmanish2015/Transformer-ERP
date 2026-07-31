import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useLicense } from '@/providers/license-provider'

interface RequireFeatureProps {
  feature: string
  children: ReactNode
}

export function RequireFeature({ feature, children }: RequireFeatureProps) {
  const { hasFeature } = useLicense()

  if (!hasFeature(feature)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
