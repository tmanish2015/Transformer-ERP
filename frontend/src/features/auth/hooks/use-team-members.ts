import { useQuery } from '@tanstack/react-query'
import { fetchAssignableRoles, fetchTeamMembers } from '@/features/auth/api/auth-api'

export function useTeamMembers() {
  return useQuery({
    queryKey: ['auth', 'team-members'],
    queryFn: fetchTeamMembers,
  })
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: fetchAssignableRoles,
    staleTime: 5 * 60 * 1000,
  })
}
