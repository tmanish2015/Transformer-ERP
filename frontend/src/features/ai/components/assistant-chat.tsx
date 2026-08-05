import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { AssistantMessage } from '@/features/ai/components/assistant-message'
import type { UseAiChatReturn } from '@/features/ai/hooks/use-ai-chat'

const QUICK_PROMPTS = [
  'Show me recent sales invoices',
  'Which products are low on stock?',
  'What is the status of repair jobs?',
  'Show me recent journal entries',
  'List the rental assets',
]

export function AssistantChat({ chat }: { chat: UseAiChatReturn }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat.messages, chat.sending])

  const submit = () => {
    const q = input.trim()
    if (!q || chat.sending) return
    setInput('')
    void chat.sendMessage(q)
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
{chat.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <EmptyState
              icon={Sparkles}
              title="Ask your business anything"
              description="Ask about sales, inventory, workshop jobs, finance, or rentals. The assistant answers from your live, tenant-scoped data."
            />
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((p) => (
                <Button key={p} variant="outline" size="sm" onClick={() => void chat.sendMessage(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          chat.messages.map((m) => <AssistantMessage key={m.id} message={m} />)
        )}
        {chat.sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit()
            }}
            placeholder="Ask about your business data…"
            disabled={chat.sending}
          />
          <Button onClick={submit} disabled={chat.sending || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
