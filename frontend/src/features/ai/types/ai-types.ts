export type AiIntent = 'sales' | 'inventory' | 'workshop' | 'finance' | 'rental' | 'general'

export const AI_INTENT_LABELS: Record<AiIntent, string> = {
  sales: 'Sales',
  inventory: 'Inventory',
  workshop: 'Workshop',
  finance: 'Finance',
  rental: 'Rental',
  general: 'General',
}

export type AiChartType = 'bar'

export interface AiChart {
  type: AiChartType
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  title: string
}

export interface AssistantResponse {
  answer: string
  intent: AiIntent
  provider: string
  data?: Record<string, unknown>[]
  chart?: AiChart | null
}

export interface AiChatSession {
  id: string
  company_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface AiChatMessage {
  id: string
  session_id: string
  role: string
  content: string
  intent: AiIntent | null
  chart: AiChart | null
  created_at: string
}
