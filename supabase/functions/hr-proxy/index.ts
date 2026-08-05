// hr-proxy
//
// The only thing in Transformer that's allowed to hold the hr-payroll-service API key
// (HR_SERVICE_API_KEY, a Supabase function secret — never shipped to the browser).
// Validates the caller's session + Transformer's own hr.view/hr.manage permissions
// using Transformer's own DB (RLS-respecting, via the caller's forwarded JWT), then
// forwards the request to the external service. See
// C:\Projects\hr-payroll-service\README.md ("Recommended integration shape") for why
// this indirection exists — it lets a fully separate, ERP-agnostic HR service trust
// "a request with a valid key," while Transformer's own roles/permissions stay in
// charge of who's allowed to call it.

import { createClient } from 'npm:@supabase/supabase-js@2'

const HR_SERVICE_URL = Deno.env.get('HR_SERVICE_URL')!
const HR_SERVICE_API_KEY = Deno.env.get('HR_SERVICE_API_KEY')!

// Edge functions run on a different origin (supabase.co) than the frontend, so every
// response — including the preflight OPTIONS request the browser sends automatically
// before a cross-origin request with custom headers/JSON body — needs CORS headers.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function requiredPermission(method: string): 'hr.view' | 'hr.manage' {
  return method === 'GET' ? 'hr.view' : 'hr.manage'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const permission = requiredPermission(req.method)
  const { data: allowed, error: permError } = await supabase.rpc('has_permission', { perm_key: permission })
  if (permError || !allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const url = new URL(req.url)
  const marker = '/hr-proxy'
  const markerIndex = url.pathname.indexOf(marker)
  const forwardPath = markerIndex >= 0 ? url.pathname.slice(markerIndex + marker.length) : url.pathname

  const upstreamResponse = await fetch(`${HR_SERVICE_URL}${forwardPath}${url.search}`, {
    method: req.method,
    headers: { 'Content-Type': 'application/json', 'x-api-key': HR_SERVICE_API_KEY },
    body: ['GET', 'HEAD', 'DELETE'].includes(req.method) ? undefined : await req.text(),
  })

  const body = await upstreamResponse.text()
  return new Response(body, { status: upstreamResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
