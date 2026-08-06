// doc-share
//
// Emails a document (Quotation, Purchase Order, Sales Invoice, or Customer Ledger PDF)
// generated client-side by frontend/src/lib/pdf-generator.ts. Runs with the CALLING
// USER's JWT — sales.manage or purchases.manage is required, matching who is already
// allowed to create/send these documents in their own module.
//
// Provider abstraction: mirrors ai-assistant/index.ts — the sender is selected entirely
// from environment variables, no keys hardcoded. Set RESEND_API_KEY (and optionally
// RESEND_FROM_EMAIL) to enable real sending. With no provider configured, the function
// returns a clear 501 rather than silently pretending the email was sent.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SharePayload {
  to: string
  subject: string
  message: string
  pdf_base64: string
  pdf_filename: string
}

interface ResendErrorBody {
  message?: string
}

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

    const { data: canSales } = await supabase.rpc('has_permission', { perm_key: 'sales.manage' })
    const { data: canPurchases } = await supabase.rpc('has_permission', { perm_key: 'purchases.manage' })
    if (!canSales && !canPurchases) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = (await req.json()) as Partial<SharePayload>
    const { to, subject, message, pdf_base64, pdf_filename } = body
    if (!to || !subject || !pdf_base64 || !pdf_filename) {
      return new Response(JSON.stringify({ error: 'to, subject, pdf_base64, and pdf_filename are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'No email provider configured. Set the RESEND_API_KEY secret on this project to enable sending.' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html: `<p>${(message ?? '').replace(/\n/g, '<br/>')}</p>`,
        attachments: [{ filename: pdf_filename, content: pdf_base64 }],
      }),
    })

    if (!resendResponse.ok) {
      const errBody = (await resendResponse.json().catch(() => ({}))) as ResendErrorBody
      return new Response(JSON.stringify({ error: errBody.message ?? `Email provider returned ${resendResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
