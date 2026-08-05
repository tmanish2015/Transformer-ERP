import { Bot, User } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { AI_INTENT_LABELS, type AiChatMessage } from '@/features/ai/types/ai-types'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

function AssistantChart({ chart }: { chart: NonNullable<AiChatMessage['chart']> }) {
  const config: Record<string, { label: string; color: string }> = {
    [chart.yKey]: { label: chart.title, color: '#3b82f6' },
  }
  return (
    <div className="mt-3 rounded-lg border bg-muted/30 p-3">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{chart.title}</p>
      <ChartContainer config={config} className="h-52 w-full">
        <BarChart data={chart.data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={chart.xKey} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey={chart.yKey} fill="var(--color-sales)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export function AssistantMessage({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          isUser ? 'order-2 bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('flex max-w-[78%] flex-col gap-1.5', isUser ? 'order-1 items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
            isUser ? 'bg-primary text-primary-foreground' : 'border bg-card text-card-foreground',
          )}
        >
          {message.content}
        </div>
        {!isUser && message.chart && <AssistantChart chart={message.chart} />}
        {!isUser && message.intent && (
          <Badge variant="secondary" className="text-[10px]">
            {AI_INTENT_LABELS[message.intent] ?? message.intent}
          </Badge>
        )}
      </div>
    </div>
  )
}
