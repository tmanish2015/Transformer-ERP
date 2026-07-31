import { Badge } from '@/components/ui/badge'

const ROLE_STYLES: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  admin: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  workshop_manager: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rental_coordinator: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  lab_engineer: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  technician: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  accountant: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  viewer: 'bg-muted text-muted-foreground',
  // New self-registered accounts with no role yet — amber to draw an admin's eye on the Team page.
  unassigned: 'bg-chart-warning/10 text-chart-warning',
}

export function RoleBadge({ roleKey, roleName }: { roleKey: string; roleName: string }) {
  return (
    <Badge variant="secondary" className={ROLE_STYLES[roleKey] ?? ROLE_STYLES.viewer}>
      {roleName}
    </Badge>
  )
}
