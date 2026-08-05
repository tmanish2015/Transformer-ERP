import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { AiChatMessage, AiChatSession, AssistantResponse } from '@/features/ai/types/ai-types'
import { askAssistant, deleteSession, fetchChatSessions, fetchSessionMessages } from '@/features/ai/api/ai-api'

export interface UseAiChatReturn {
  sessions: AiChatSession[]
  loadingSessions: boolean
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
  messages: AiChatMessage[]
  loadingMessages: boolean
  sending: boolean
  refreshSessions: () => Promise<void>
  openSession: (sessionId: string) => Promise<void>
  newSession: () => void
  removeSession: (sessionId: string) => Promise<void>
  sendMessage: (question: string) => Promise<void>
}

export function useAiChat(): UseAiChatReturn {
  const [sessions, setSessions] = useState<AiChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const data = await fetchChatSessions()
      setSessions(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load AI assistant sessions')
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const openSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setLoadingMessages(true)
    try {
      const data = await fetchSessionMessages(sessionId)
      setMessages(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const newSession = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
  }, [])

  const removeSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        if (activeSessionId === sessionId) {
          setActiveSessionId(null)
          setMessages([])
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete session')
      }
    },
    [activeSessionId],
  )

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed || sending) return

      setSending(true)
      // Optimistically append the user message.
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          session_id: activeSessionId ?? '',
          role: 'user',
          content: trimmed,
          intent: null,
          chart: null,
          created_at: new Date().toISOString(),
        },
      ])

      try {
        const res: AssistantResponse = await askAssistant(trimmed, activeSessionId)
        setMessages((prev) => [
          ...prev,
          {
            id: `assist-${Date.now()}`,
            session_id: activeSessionId ?? '',
            role: 'assistant',
            content: res.answer,
            intent: res.intent,
            chart: res.chart ?? null,
            created_at: new Date().toISOString(),
          },
        ])
        if (!activeSessionId) {
          await refreshSessions()
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to get an answer from the assistant')
      } finally {
        setSending(false)
      }
    },
    [activeSessionId, sending, refreshSessions],
  )

  return {
    sessions,
    loadingSessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    loadingMessages,
    sending,
    refreshSessions,
    openSession,
    newSession,
    removeSession,
    sendMessage,
  }
}
