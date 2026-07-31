import { supabase } from '@/lib/supabase'
import type { AuthProfile, TeamMember } from '@/features/auth/types/auth-types'

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpUser(fullName: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  // `data.session` is only present when email confirmation is disabled on this Supabase
  // project — the caller uses this to decide between "you're in" and "check your email".
  return data
}

export async function signOutUser(scope: 'local' | 'global' = 'local') {
  const { error } = await supabase.auth.signOut({ scope })
  if (error) throw error
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (reauthError) throw new Error('Current password is incorrect')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function fetchAuthProfile(userId: string): Promise<AuthProfile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, avatar_url, phone, status, role_id, roles(id, key, name, description)')
    .eq('id', userId)
    .single()
  if (error) throw error

  const { data: rolePerms, error: permError } = await supabase
    .from('role_permissions')
    .select('permissions(key)')
    .eq('role_id', profile.role_id)
  if (permError) throw permError

  return {
    id: profile.id,
    companyId: profile.company_id,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
    status: profile.status,
    role: profile.roles,
    permissions: rolePerms.map((rp) => rp.permissions!.key),
  }
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; phone?: string | null; avatar_url?: string | null },
) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, status, role_id, roles(id, key, name)')
    .order('full_name')
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    status: row.status,
    role: row.roles,
  }))
}

export async function fetchAssignableRoles() {
  const { data, error } = await supabase.from('roles').select('id, key, name').order('name')
  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, roleId: string) {
  const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId)
  if (error) throw error
}
