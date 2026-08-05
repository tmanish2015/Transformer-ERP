// ai-assistant
//
// AI Business Assistant — a production-grade, tenant-scoped conversation surface.
//
// Security model (per docs-architecture/05-development-roadmap.md Risk #6 and the
// research note in 00-overview.md): the assistant NEVER lets an LLM generate or run SQL.
// Instead it:
//   1. Validates the caller's session + `ai.view` permission (RLS-respecting, via the
//      caller's forwarded JWT).
//   2. Classifies the natural-language question into a WHITELISTED intent.
//   3. Runs a PRE-WRITTEN, parameterized, tenant-scoped query for that intent (scoped
//      by current_company_id() and the caller's existing module permissions via RLS).
//   4. Hands the result set + the question to a configured LLM provider for a
//      natural-language summary, or falls back to a deterministic template when no
//      provider key is configured.
//   5. Persists the user turn + assistant turn into ai_chat_messages.
//
// Provider abstraction: the LLM is selected entirely from environment variables — no
// keys are hardcoded. Set AI_PROVIDER to one of 'anthropic' | 'openai' | 'gemini' |
// 'mock' (or omit AI_PROVIDER to auto-detect from the *_API_KEY that is present). Each
// provider reads its own API key env var. To switch providers, change the env vars and
// re-deploy — no code change required.

import { createClient } from 'npm:@supabase/supabase-js@2'

// Edge functions run on a different origin (supabase.co) than the frontend (the app's
// own domain), so every response — including the preflight OPTIONS request the browser
// sends automatically before a cross-origin POST with a JSON body — needs CORS headers,
// or the browser blocks the request before it ever reaches this handler.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Intent = 'sales' | 'inventory' | 'workshop' | 'finance' | 'rental' | 'general'

interface AssistantResponse {
  answer: string
  intent: Intent
  provider: string
  data?: Record<string, unknown>[]
  chart?: { type: string; data: Record<string, unknown>[]; xKey: string; yKey: string; title: string } | null
}

// Provider shape — every provider returns the same normalized shape so the intent
// router is provider-agnostic.
interface AIProvider {
  name: string
  /** Summarize a question + result set into a concise, business tone answer. */
  summarize(question: string, intent: Intent, data: Record<string, unknown>[]): Promise<string>
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

/** Deterministic fallback — no API key required. Produces a readable, structured answer. */
function mockProvider(): AIProvider {
  return {
    name: 'mock',
    async summarize(question, intent, data) {
      const rows = data.length
      const first = data[0] ?? {}
      const keys = Object.keys(first)
      const sample = keys.length > 0 ? `e.g. ${first[keys[0]]}` : ''
      const label = { sales: 'sales', inventory: 'inventory', workshop: 'workshop operations', finance: 'finance', rental: 'rental', general: 'business' }[intent]
      return (
        `Here is what your ${label} data shows right now. ` +
        `I found ${rows} record${rows === 1 ? '' : 's'}${sample ? ` (${sample})` : ''}. ` +
        (rows > 0 && keys.length > 0 ? `Key fields include: ${keys.slice(0, 5).join(', ')}. ` : '') +
        'Connect an LLM provider (set AI_PROVIDER + the matching API key) to enable richer natural-language summaries of this data.'
      )
    },
  }
}

interface AnthropicResponse {
  content: { type: string; text?: string }[]
}

async function anthropicProvider(apiKey: string): Promise<AIProvider> {
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-3-5-haiku-latest'
  return {
    name: 'anthropic',
    async summarize(question, _intent, data) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          system:
            'You are the AI Business Assistant for a transformer-manufacturing ERP. ' +
            'Answer concisely and professionally in plain English, drawing only on the data provided. ' +
            'Do not invent figures. Use short paragraphs and lists where helpful.',
          messages: [
            { role: 'user', content: `Question: ${question}\n\nData (JSON):\n${JSON.stringify(data)}` },
          ],
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Anthropic error ${res.status}: ${text}`)
      }
      const json = (await res.json()) as AnthropicResponse
      return json.content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('') || 'No response from provider.'
    },
  }
}

interface OpenAiResponse {
  choices: { message: { content: string } }[]
}

async function openAiProvider(apiKey: string): Promise<AIProvider> {
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
  return {
    name: 'openai',
    async summarize(question, _intent, data) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are the AI Business Assistant for a transformer-manufacturing ERP. Answer concisely and professionally in plain English, drawing only on the data provided. Do not invent figures.',
            },
            { role: 'user', content: `Question: ${question}\n\nData (JSON):\n${JSON.stringify(data)}` },
          ],
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenAI error ${res.status}: ${text}`)
      }
      const json = (await res.json()) as OpenAiResponse
      return json.choices[0]?.message?.content || 'No response from provider.'
    },
  }
}

interface GeminiResponse {
  candidates: { content: { parts: { text?: string }[] } }[]
}

async function geminiProvider(apiKey: string): Promise<AIProvider> {
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash'
  return {
    name: 'gemini',
    async summarize(question, _intent, data) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      'You are the AI Business Assistant for a transformer-manufacturing ERP. Answer concisely and professionally in plain English, drawing only on the data provided. Do not invent figures.\n\n' +
                      `Question: ${question}\n\nData (JSON):\n${JSON.stringify(data)}`,
                  },
                ],
              },
            ],
          }),
        },
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Gemini error ${res.status}: ${text}`)
      }
      const json = (await res.json()) as GeminiResponse
      return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || 'No response from provider.'
    },
  }
}

/** Build the provider from env vars; never exposes keys to the client. */
async function resolveProvider(): Promise<AIProvider> {
  const provider = Deno.env.get('AI_PROVIDER')?.toLowerCase()
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const geminiKey = Deno.env.get('GEMINI_API_KEY')

  if (provider === 'anthropic' || (!provider && anthropicKey)) {
    return anthropicKey ? anthropicProvider(anthropicKey) : mockProvider()
  }
  if (provider === 'openai' || (!provider && openaiKey)) {
    return openaiKey ? openAiProvider(openaiKey) : mockProvider()
  }
  if (provider === 'gemini' || (!provider && geminiKey)) {
    return geminiKey ? geminiProvider(geminiKey) : mockProvider()
  }
  return mockProvider()
}

// ---------------------------------------------------------------------------
// Whitelisted intent router + tenant-scoped queries
// ---------------------------------------------------------------------------

const INTENT_KEYWORDS: Record<Exclude<Intent, 'general'>, string[]> = {
  sales: ['sale', 'sales', 'quotation', 'quote', 'invoice', 'revenue', 'customer', 'order', 'outstanding', 'payment'],
  inventory: ['inventory', 'stock', 'product', 'warehouse', 'batch', 'serial', 'reorder', 'supplier', 'movement'],
  workshop: ['workshop', 'repair', 'job', 'warranty', 'test', 'estimate', 'maintenance'],
  finance: ['finance', 'journal', 'ledger', 'account', 'cash', 'bank', 'balance', 'profit', 'loss', 'trial', 'expense'],
  rental: ['rental', 'asset', 'booking', 'agreement', 'dispatch', 'return', 'inspection', 'maintenance'],
}

function classifyIntent(question: string): Intent {
  const q = question.toLowerCase()
  const scores: Record<Exclude<Intent, 'general'>, number> = { sales: 0, inventory: 0, workshop: 0, finance: 0, rental: 0 }
  for (const intent of Object.keys(INTENT_KEYWORDS) as Exclude<Intent, 'general'>[]) {
    scores[intent] = INTENT_KEYWORDS[intent].filter((k) => q.includes(k)).length
  }
  const best = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0] ?? ['general', 0]) as [Exclude<Intent, 'general'>, number]
  return best[1] > 0 ? best[0] : 'general'
}

/**
 * Pre-written, tenant-scoped query per intent. NEVER interpolates user text into SQL.
 * Each query is scoped by current_company_id() and returns at most a bounded number of
 * rows so the payload to the LLM stays small. The option is a label the query can use
 * to filter (e.g. "revenue in the last 6 months").
 */
async function runIntentQuery(intent: Intent, supabase: ReturnType<typeof createClient>, option?: string): Promise<Record<string, unknown>[]> {
  const top = 12
  switch (intent) {
    case 'sales': {
      const { data } = await supabase
        .from('sales_invoices')
        .select('invoice_number, invoice_type, status, total, invoice_date, customer:customers(name)')
        .order('invoice_date', { ascending: false })
        .limit(top)
      return (data ?? []).map((r) => ({ invoice: r.invoice_number, type: r.invoice_type, status: r.status, amount: r.total, date: r.invoice_date?.slice(0, 10), customer: r.customer?.name ?? null }))
    }
    case 'inventory': {
      const { data } = await supabase
        .from('stock_levels')
        .select('product:products(sku, name, reorder_level), quantity')
        .order('quantity', { ascending: true })
        .limit(top)
      return (data ?? []).map((r) => ({ product: r.product?.name ?? r.product?.sku ?? null, quantity: r.quantity, reorder_level: r.product?.reorder_level }))
    }
    case 'workshop': {
      const { data } = await supabase
        .from('repair_jobs')
        .select('job_number, status, transformer_make, transformer_model, created_at, customer:customers(name)')
        .order('created_at', { ascending: false })
        .limit(top)
      return (data ?? []).map((r) => ({ job: r.job_number, status: r.status, make: r.transformer_make, model: r.transformer_model, date: r.created_at?.slice(0, 10), customer: r.customer?.name ?? null }))
    }
    case 'finance': {
      const { data } = await supabase
        .from('journal_entries')
        .select('entry_number, status, entry_date, journal_entry_lines(debit, credit)')
        .order('entry_date', { ascending: false })
        .limit(top)
      return (data ?? []).map((r) => {
        const debit = (r.journal_entry_lines ?? []).reduce((s: number, l: { debit?: number }) => s + (l.debit ?? 0), 0)
        const credit = (r.journal_entry_lines ?? []).reduce((s: number, l: { credit?: number }) => s + (l.credit ?? 0), 0)
        return { entry: r.entry_number, status: r.status, date: r.entry_date?.slice(0, 10), debit, credit }
      })
    }
    case 'rental': {
      const { data } = await supabase
        .from('rental_assets')
        .select('asset_code, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(top)
      return (data ?? []).map((r) => ({ asset: r.asset_code, name: r.name, status: r.status, added: r.created_at?.slice(0, 10) }))
    }
    default:
      return []
  }
}

/** Build an optional chart spec for the intent (frontend renders this with Recharts). */
function buildChart(intent: Intent, data: Record<string, unknown>[]): AssistantResponse['chart'] {
  if (data.length === 0) return null
  switch (intent) {
    case 'sales':
      return { type: 'bar', data, xKey: 'invoice', yKey: 'amount', title: 'Sales Invoices' }
    case 'inventory':
      return { type: 'bar', data, xKey: 'product', yKey: 'quantity', title: 'Stock Levels' }
    case 'workshop':
      // No numeric measure per row (status is a string) — omit the chart rather than
      // render a Recharts bar with a non-numeric y-axis.
      return null
    case 'finance':
      return { type: 'bar', data, xKey: 'entry', yKey: 'debit', title: 'Journal Entries (Debit)' }
    case 'rental':
      // Same reasoning as workshop — status is a string, not a chartable measure.
      return null
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Intent string -> human label for the UI badge
// ---------------------------------------------------------------------------

const INTENT_LABEL: Record<Intent, string> = {
  sales: 'Sales',
  inventory: 'Inventory',
  workshop: 'Workshop',
  finance: 'Finance',
  rental: 'Rental',
  general: 'General',
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: allowed, error: permError } = await supabase.rpc('has_permission', { perm_key: 'ai.view' })
    if (permError || !allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { question, session_id, option } = body as { question?: string; session_id?: string | null; option?: string }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'question is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const intent = classifyIntent(question.trim())
    const data = await runIntentQuery(intent, supabase, option)
    const chart = buildChart(intent, data)

    const provider = await resolveProvider()
    let answer: string
    try {
      answer = await provider.summarize(question.trim(), intent, data)
    } catch (providerErr) {
      // If the live provider fails for any reason, degrade gracefully to the mock so the
      // conversation never errors out.
      answer = await mockProvider().summarize(question.trim(), intent, data)
    }

    // Persist the conversation. If no session_id is supplied, create a new session owned
    // by the caller first.
    let sessionId = session_id ?? null
    if (!sessionId) {
      const title = question.trim().slice(0, 60)
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .insert({ user_id: userData.user.id, title })
        .select('id')
        .single()
      if (sessionError) {
        return new Response(JSON.stringify({ error: sessionError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      sessionId = newSession.id
    }

    const { error: msgError } = await supabase.from('ai_chat_messages').insert([
      { session_id: sessionId, role: 'user', content: question.trim(), intent },
      { session_id: sessionId, role: 'assistant', content: answer, intent, chart: chart ?? null },
    ])
    if (msgError) {
      return new Response(JSON.stringify({ error: msgError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const response: AssistantResponse = {
      answer,
      intent,
      provider: provider.name,
      data,
      chart,
    }
    return new Response(JSON.stringify(response), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
