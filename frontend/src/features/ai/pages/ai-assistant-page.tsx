import { useEffect } from 'react'
import { Loader2, MessageSquarePlus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AssistantChat } from '@/features/ai/components/assistant-chat'
import { useAiChat } from '@/features/ai/hooks/use-ai-chat'

export function AiAssistantPage() {
  const chat = useAiChat()

  useEffect(() => {
    void chat.refreshSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="AI Business Assistant"
        description="Ask questions about your live, tenant-scoped business data and get instant answers."
      />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Session sidebar */}
        <Card className="hidden min-h-0 flex-col lg:flex">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-medium">Conversations</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={chat.newSession}
              title="New conversation"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-1 p-2">
              {chat.loadingSessions && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!chat.loadingSessions && chat.sessions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
              )}
              {chat.sessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                    chat.activeSessionId === s.id && 'bg-muted',
                  )}
                >
                  <button
                    className="min-w-0 flex-1 truncate text-left"
                    onClick={() => void chat.openSession(s.id)}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                  <button
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={() => void chat.removeSession(s.id)}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat panel */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <AssistantChat chat={chat} />
        </Card>
      </div>
    </div>
  )
}
