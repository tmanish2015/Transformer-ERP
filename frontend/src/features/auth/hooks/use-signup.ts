import { useMutation } from '@tanstack/react-query'
import { signUpUser } from '@/features/auth/api/auth-api'
import type { SignupFormValues } from '@/features/auth/schemas/auth-schemas'

export function useSignup() {
  return useMutation({
    mutationFn: (values: SignupFormValues) => signUpUser(values.fullName, values.email, values.password),
  })
}
