import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useLicense } from '@/providers/license-provider'

interface RequireAddonProps {
  addon: string
  children: ReactNode
}

export function RequireAddon({ addon, children }: RequireAddonProps) {
  const { hasAddon } = useLicense()

  if (!hasAddon(addon)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
