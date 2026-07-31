import { Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleBadge } from '@/features/auth/components/role-badge'
import { useAssignableRoles, useTeamMembers } from '@/features/auth/hooks/use-team-members'
import { useUpdateUserRole } from '@/features/auth/hooks/use-update-user-role'
import { useAuth } from '@/providers/auth-provider'

function getInitials(name: string | null) {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function TeamMembersPage() {
  const { user, hasPermission } = useAuth()
  const teamMembers = useTeamMembers()
  const assignableRoles = useAssignableRoles()
  const updateUserRole = useUpdateUserRole()
  const canManageRoles = hasPermission('users.manage_roles')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Team Members</h2>
        <p className="text-sm text-muted-foreground">View your team and manage role-based access.</p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}

            {teamMembers.data?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{getInitials(member.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {member.fullName || 'Unnamed user'}
                      {member.id === user?.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canManageRoles ? (
                    <Select
                      value={member.role.id}
                      onValueChange={(roleId) => updateUserRole.mutate({ userId: member.id, roleId: roleId as string })}
                    >
                      <SelectTrigger className="ml-auto w-[180px]">
                        <SelectValue>
                          {(roleId: string) => assignableRoles.data?.find((role) => role.id === roleId)?.name ?? 'Select role'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.data?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex justify-end">
                      <RoleBadge roleKey={member.role.key} roleName={member.role.name} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
