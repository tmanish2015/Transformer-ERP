import { supabase } from '@/lib/supabase'
import type { AiChatMessage, AiChatSession, AssistantResponse } from '@/features/ai/types/ai-types'

/** List the current user's chat sessions, most recently active first. */
export async function fetchChatSessions(): Promise<AiChatSession[]> {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

/** Load the full transcript for one session. */
export async function fetchSessionMessages(sessionId: string): Promise<AiChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  // The DB stores `intent` as text (`string | null`), while the app type narrows it to
  // the `AiIntent` union. Cast at the data-access boundary since the edge function only
  // ever writes one of the whitelisted intent strings.
  return data as AiChatMessage[]
}

/** Rename a session (title used for the sidebar). */
export async function renameSession(sessionId: string, title: string): Promise<void> {
  const { error } = await supabase.from('ai_chat_sessions').update({ title }).eq('id', sessionId)
  if (error) throw error
}

/** Delete a session and its messages (cascade). */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('ai_chat_sessions').delete().eq('id', sessionId)
  if (error) throw error
}

/**
 * Send a question to the ai-assistant edge function. The edge function classifies the
 * intent, runs a tenant-scoped pre-written query, summarizes with the configured LLM
 * provider (or falls back to a deterministic template), and persists the transcript.
 *
 * `sessionId` is optional — when omitted the function creates a new session.
 */
export async function askAssistant(question: string, sessionId?: string | null): Promise<AssistantResponse> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: { question, session_id: sessionId ?? null },
  })
  if (error) throw error
  return data as AssistantResponse
}
