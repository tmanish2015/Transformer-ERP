import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_TONE, type SemanticTone } from '@/lib/chart-colors'

const TONE_CLASSES: Record<SemanticTone, string> = {
  success: 'bg-chart-success/10 text-chart-success',
  warning: 'bg-chart-warning/10 text-chart-warning',
  critical: 'bg-chart-critical/10 text-chart-critical',
  info: 'bg-chart-info/10 text-chart-info',
  neutral: 'bg-muted text-muted-foreground',
}

interface StatusBadgeProps {
  status: string
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = STATUS_TONE[status]
  return <Badge variant="secondary" className={cn(tone ? TONE_CLASSES[tone] : 'bg-muted text-muted-foreground')}>{label}</Badge>
}
