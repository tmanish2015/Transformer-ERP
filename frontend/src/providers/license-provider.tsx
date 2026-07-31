import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMyEntitlements } from '@/features/licensing/api/licensing-api'
import type { Entitlements } from '@/features/licensing/types/licensing-types'
import { useAuth } from '@/providers/auth-provider'

interface LicenseContextValue {
  entitlements: Entitlements | null
  isLoading: boolean
  hasModule: (code: string) => boolean
  hasFeature: (code: string) => boolean
  hasAddon: (code: string) => boolean
}

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined)

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id

  const entitlementsQuery = useQuery({
    queryKey: ['licensing', 'entitlements'],
    queryFn: fetchMyEntitlements,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  })

  const entitlements = entitlementsQuery.data ?? null

  const value = useMemo<LicenseContextValue>(
    () => ({
      entitlements,
      isLoading: Boolean(userId) && entitlementsQuery.isLoading,
      hasModule: (code) => entitlements?.valid === true && (entitlements.modules?.includes(code) ?? false),
      hasFeature: (code) => entitlements?.valid === true && (entitlements.features?.includes(code) ?? false),
      hasAddon: (code) => entitlements?.valid === true && (entitlements.addons?.includes(code) ?? false),
    }),
    [entitlements, entitlementsQuery.isLoading, userId],
  )

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
}

export function useLicense() {
  const context = useContext(LicenseContext)
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider')
  }
  return context
}
