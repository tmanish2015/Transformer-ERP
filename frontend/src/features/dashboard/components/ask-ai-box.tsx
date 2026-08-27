import { useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { askAssistant } from '@/features/ai/api/ai-api'

const SUGGESTED_QUESTIONS = [
  'How much profit did we make this month?',
  'Which repair jobs are losing money?',
  'Who owes us the most money?',
  'Which jobs are delayed?',
  'What were our biggest expenses this month?',
  'Which customers generated the most revenue?',
  'How is machine rental performing?',
  'Which machines are under-utilised?',
  'What needs my attention today?',
]

/** Embeds the same whitelisted-intent AI Assistant edge function used by the full AI
 * Assistant page -- no second AI engine, just a lighter single-question entry point. */
export function AskAiBox() {
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)

  const ask = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || asking) return
    setAsking(true)
    setAnswer(null)
    try {
      const res = await askAssistant(trimmed)
      setAnswer(res.answer)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reach the AI assistant')
    } finally {
      setAsking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> Ask TransformerFlow AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void ask(question)
          }}
        >
          <Input placeholder="Ask about revenue, jobs, receivables, rentals..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          <Button type="submit" disabled={asking || !question.trim()}>
            {asking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>

        {answer && <div className="rounded-lg bg-muted p-3 text-sm text-foreground whitespace-pre-line">{answer}</div>}

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setQuestion(q)
                void ask(q)
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
