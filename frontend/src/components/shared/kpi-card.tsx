import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: {
    value: string
    direction: 'up' | 'down'
    label?: string
  }
  description?: string
  tone?: 'default' | 'warning' | 'destructive' | 'success'
}

const TONE_STYLES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-chart-warning/10 text-chart-warning',
  destructive: 'bg-chart-critical/10 text-chart-critical',
  success: 'bg-chart-success/10 text-chart-success',
}

export function KpiCard({ label, value, icon: Icon, trend, description, tone = 'default' }: KpiCardProps) {
  const isUp = trend?.direction === 'up'

  return (
    <Card size="sm" className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn('flex size-6 items-center justify-center rounded-lg', TONE_STYLES[tone])}>
          <Icon className="size-3.5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold text-foreground">{value}</div>
        {trend && (
          <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', isUp ? 'text-chart-success' : 'text-chart-critical')}>
            {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {trend.value}
            {trend.label && <span className="font-normal text-muted-foreground">{trend.label}</span>}
          </p>
        )}
        {description && !trend && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
