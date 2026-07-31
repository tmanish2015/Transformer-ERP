import { useMutation } from '@tanstack/react-query'
import { setRememberMePreference } from '@/lib/supabase'
import { signInWithPassword } from '@/features/auth/api/auth-api'
import type { LoginFormValues } from '@/features/auth/schemas/auth-schemas'

export function useLogin() {
  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      setRememberMePreference(values.rememberMe)
      return signInWithPassword(values.email, values.password)
    },
  })
}
