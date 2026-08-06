import type { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

/** Uploads a generated PDF to the private document-shares bucket and returns a
 * time-limited signed URL — the bucket itself stays private (customer financial
 * documents shouldn't be permanently world-readable). */
export async function uploadDocumentPdf(companyId: string, docType: string, docId: string, filename: string, doc: jsPDF): Promise<string> {
  const blob = doc.output('blob')
  const path = `${companyId}/${docType}/${docId}/${filename}`
  const { error: uploadError } = await supabase.storage.from('document-shares').upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (uploadError) throw uploadError

  const { data, error: signError } = await supabase.storage.from('document-shares').createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (signError) throw signError
  return data.signedUrl
}

export function buildWhatsAppShareLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export interface EmailShareParams {
  to: string
  subject: string
  message: string
  doc: jsPDF
  filename: string
}

/** Sends the PDF as an email attachment via the doc-share edge function. Throws with a
 * clear message if no email provider is configured on the project. */
export async function sendDocumentEmail(params: EmailShareParams): Promise<void> {
  const pdfBase64 = params.doc.output('datauristring').split('base64,')[1]
  const { error } = await supabase.functions.invoke('doc-share', {
    body: { to: params.to, subject: params.subject, message: params.message, pdf_base64: pdfBase64, pdf_filename: params.filename },
  })
  if (error) throw error
}
