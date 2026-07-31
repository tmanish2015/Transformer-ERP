// Enterprise BI color system (Power BI / SAP Fiori / Dynamics-style) for
// dashboard analytics. Semantic colors carry a fixed business meaning and
// must never be reassigned to arbitrary categories; the categorical palette
// is for breakdowns that have no inherent health/status (e.g. "revenue by
// module") and stays clear of green/amber/red so those keep their meaning.

export const SEMANTIC_COLORS = {
  success: '#22C55E', // profit, healthy, completed, growth, active, positive trend
  warning: '#F59E0B', // pending, follow-up required, reorder level, moderate risk
  critical: '#EF4444', // overdue, dead stock, payment overdue, churn risk, high priority
  info: '#3B82F6', // neutral in-progress / informational stage (not good or bad)
  neutral: '#64748B', // inactive, draft, muted
} as const

export type SemanticTone = keyof typeof SEMANTIC_COLORS

// For pure categorical breakdowns (product mix, module mix, region split) with no health
// meaning — a professional blue/teal/indigo family that never collides with the
// red/amber/green semantic tones above.
export const CATEGORICAL_COLORS = [
  '#2563EB', // blue
  '#0EA5E9', // sky
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#64748B', // slate
  '#7C3AED', // violet
] as const

export function categoricalColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]
}

/** Trend arrows / deltas: positive = success, negative = critical, flat = neutral. */
export function trendColor(delta: number): string {
  if (delta > 0) return SEMANTIC_COLORS.success
  if (delta < 0) return SEMANTIC_COLORS.critical
  return SEMANTIC_COLORS.neutral
}

/** Generic 3-band thresholds, e.g. margin %, fill rate %, SLA compliance. */
export function bandColor(value: number, warnBelow: number, criticalBelow: number): string {
  if (value < criticalBelow) return SEMANTIC_COLORS.critical
  if (value < warnBelow) return SEMANTIC_COLORS.warning
  return SEMANTIC_COLORS.success
}

/** Same thresholds, inverted — for metrics where lower is better (e.g. aging days, TAT days). */
export function inverseBandColor(value: number, warnAbove: number, criticalAbove: number): string {
  if (value > criticalAbove) return SEMANTIC_COLORS.critical
  if (value > warnAbove) return SEMANTIC_COLORS.warning
  return SEMANTIC_COLORS.success
}

export function stockStatusColor(status: 'in_stock' | 'low_stock' | 'out_of_stock'): string {
  if (status === 'out_of_stock') return SEMANTIC_COLORS.critical
  if (status === 'low_stock') return SEMANTIC_COLORS.warning
  return SEMANTIC_COLORS.success
}

// Canonical status -> business-meaning tone, shared by StatusBadge and every status
// donut/bar chart so a given workflow status always reads the same color everywhere in
// the app. Statuses that are just a pipeline stage (not a business outcome) map to
// 'info' or 'neutral' rather than green/amber/red.
export const STATUS_TONE: Record<string, SemanticTone> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'critical',
  active: 'success',
  inactive: 'neutral',
  expiring_soon: 'warning',
  expired: 'critical',
  purchase: 'success',
  sale: 'info',
  adjustment: 'warning',
  transfer_in: 'info',
  transfer_out: 'warning',
  return: 'neutral',
  scrap: 'critical',
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sent: 'info',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'critical',
  unpaid: 'warning',
  partially_paid: 'info',
  paid: 'success',
  overdue: 'critical',
  accepted: 'success',
  rejected: 'critical',
  confirmed: 'info',
  partially_delivered: 'warning',
  delivered: 'success',
  invoiced: 'info',
  lead: 'neutral',
  prospect: 'info',
  churned: 'critical',
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
  in_transit: 'info',
  reserved: 'warning',
  dispatched: 'success',
  installed: 'success',
  scrapped: 'critical',
  reported: 'warning',
  written_off: 'critical',
  sold: 'info',
  returned: 'neutral',
  damaged: 'critical',
  posted: 'success',
  pending: 'warning',
  completed: 'success',
  inspection: 'info',
  estimate_pending: 'warning',
  customer_approved: 'success',
  customer_rejected: 'critical',
  planned: 'info',
  winding: 'info',
  assembly: 'info',
  testing: 'info',
  painting: 'info',
  packing: 'info',
  dispatch: 'success',
  available: 'success',
  booked: 'info',
  running: 'success',
  maintenance: 'warning',
  retired: 'neutral',
  quoted: 'info',
  converted: 'success',
  good: 'success',
  fair: 'warning',
  scheduled: 'info',
  skipped: 'neutral',
  new: 'neutral',
  qualified: 'info',
  proposal: 'info',
  negotiation: 'warning',
  won: 'success',
  lost: 'critical',
}

export function statusColor(status: string): string {
  return SEMANTIC_COLORS[STATUS_TONE[status] ?? 'neutral']
}
