import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchAuthProfile, signOutUser } from '@/features/auth/api/auth-api'
import type { AuthProfile } from '@/features/auth/types/auth-types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: AuthProfile | null
  isLoading: boolean
  hasPermission: (permissionKey: string) => boolean
  hasRole: (...roleKeys: string[]) => boolean
  signOut: (options?: { allDevices?: boolean }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsSessionLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsSessionLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const profileQuery = useQuery({
    queryKey: ['auth', 'profile', userId],
    queryFn: () => fetchAuthProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  })

  const profile = profileQuery.data ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading: isSessionLoading || (Boolean(userId) && profileQuery.isLoading),
      hasPermission: (permissionKey) => profile?.permissions.includes(permissionKey) ?? false,
      hasRole: (...roleKeys) => (profile ? roleKeys.includes(profile.role.key) : false),
      signOut: async (options) => {
        await signOutUser(options?.allDevices ? 'global' : 'local')
        queryClient.removeQueries({ queryKey: ['auth', 'profile'] })
      },
    }),
    [session, profile, isSessionLoading, profileQuery.isLoading, userId, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
