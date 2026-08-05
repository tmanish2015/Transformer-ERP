// test-certificate-pdf
//
// Renders a test_reports + test_report_results row into a PDF, uploads it to the
// test-certificates bucket, and inserts the test_certificates row — server-side so the
// certificate looks identical regardless of which client/portal requested it.
// Per docs-architecture/09-api-design.md §4.
//
// Runs with the CALLING USER's JWT (forwarded via the Authorization header), not the
// service role — RLS applies exactly as it would for any other client-invoked mutation,
// so current_company_id() resolves correctly and testing-lab.manage is enforced by the
// test_reports/test_certificates/storage policies, not by trusting this function.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

// Edge functions run on a different origin (supabase.co) than the frontend, so every
// response — including the preflight OPTIONS request the browser sends automatically
// before a cross-origin POST with a JSON body — needs CORS headers.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const { test_report_id } = await req.json()
    if (!test_report_id) {
      return new Response(JSON.stringify({ error: 'test_report_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData } = await supabase.auth.getUser()

    const { data: report, error: reportError } = await supabase
      .from('test_reports')
      .select('*, customer:customers(name), repair_job:repair_jobs(job_number, transformer_make, transformer_model, transformer_serial_no), test_type:test_types(name)')
      .eq('id', test_report_id)
      .single()
    if (reportError || !report) {
      return new Response(JSON.stringify({ error: reportError?.message ?? 'Test report not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (report.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Test report must be completed before a certificate can be issued' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: results, error: resultsError } = await supabase
      .from('test_report_results')
      .select('*')
      .eq('test_report_id', test_report_id)
    if (resultsError) {
      return new Response(JSON.stringify({ error: resultsError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 800
    const drawText = (text: string, size: number, bold = false, color = rgb(0.1, 0.1, 0.1)) => {
      page.drawText(text, { x: 50, y, size, font: bold ? boldFont : font, color })
      y -= size + 10
    }

    drawText('Transformer Test Certificate', 18, true)
    drawText(`Report No: ${report.report_number}`, 11)
    drawText(`Test Type: ${report.test_type?.name ?? '-'}`, 11)
    drawText(`Customer: ${report.customer?.name ?? '-'}`, 11)
    if (report.repair_job) {
      drawText(`Repair Job: ${report.repair_job.job_number} — ${[report.repair_job.transformer_make, report.repair_job.transformer_model].filter(Boolean).join(' ')}`, 11)
      if (report.repair_job.transformer_serial_no) drawText(`Transformer Serial No: ${report.repair_job.transformer_serial_no}`, 11)
    }
    drawText(`Tested At: ${new Date(report.tested_at).toLocaleString()}`, 11)
    y -= 10
    drawText('Results', 14, true)

    for (const result of results ?? []) {
      const verdict = result.pass_fail === null ? '' : result.pass_fail ? 'PASS' : 'FAIL'
      const color = result.pass_fail === false ? rgb(0.7, 0.1, 0.1) : rgb(0.1, 0.1, 0.1)
      drawText(`${result.parameter_label}: ${result.value}${result.unit ? ' ' + result.unit : ''} ${verdict}`, 11, false, color)
    }

    y -= 20
    drawText(`Issued: ${new Date().toLocaleString()}`, 9)

    const pdfBytes = await pdfDoc.save()

    const storagePath = `${report.company_id}/${test_report_id}/certificate.pdf`
    const { error: uploadError } = await supabase.storage.from('test-certificates').upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: certificate, error: certError } = await supabase
      .from('test_certificates')
      .insert({ test_report_id, storage_path: storagePath, issued_by: userData.user?.id ?? null })
      .select()
      .single()
    if (certError) {
      return new Response(JSON.stringify({ error: certError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ storage_path: storagePath, certificate_number: certificate.certificate_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
