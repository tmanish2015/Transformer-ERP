import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useLicense } from '@/providers/license-provider'

interface RequireModuleProps {
  module: string
  children: ReactNode
}

export function RequireModule({ module, children }: RequireModuleProps) {
  const { hasModule } = useLicense()

  if (!hasModule(module)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
