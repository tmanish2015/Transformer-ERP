import { jsPDF } from 'jspdf'
import type { Tables } from '@/types/database.types'

type Company = Tables<'companies'>

export interface PdfParty {
  name: string
  address?: string | null
  gstin?: string | null
  pan_number?: string | null
  phone?: string | null
  email?: string | null
}

export interface PdfLineItem {
  description: string
  hsn_code?: string | null
  quantity: number
  unit?: string | null
  unit_price: number
  gst_rate: number
  line_total: number
}

export interface DocumentPdfOptions {
  docTitle: string
  docNumber: string
  docDate: string
  dueOrValidLabel?: string
  dueOrValidDate?: string | null
  company: Company
  party: PdfParty
  partyLabel: string
  items: PdfLineItem[]
  subtotal: number
  discountTotal?: number
  taxTotal: number
  total: number
  notes?: string | null
}

const PAGE_WIDTH = 210
const MARGIN = 15
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function drawCompanyHeader(doc: jsPDF, company: Company, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(company.name, MARGIN, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (company.company_address) {
    const lines = doc.splitTextToSize(company.company_address, CONTENT_WIDTH * 0.6)
    doc.text(lines, MARGIN, y)
    y += lines.length * 4
  }
  const contactBits = [company.company_phone, company.company_email, company.website].filter(Boolean)
  if (contactBits.length > 0) {
    doc.text(contactBits.join(' | '), MARGIN, y)
    y += 4
  }
  const taxBits = [company.gstin ? `GSTIN: ${company.gstin}` : null, company.pan_number ? `PAN: ${company.pan_number}` : null].filter(Boolean)
  if (taxBits.length > 0) {
    doc.text(taxBits.join('  |  ') as string, MARGIN, y)
    y += 4
  }

  y += 3
  doc.setDrawColor(200)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  return y + 8
}

function drawPartyAndDocInfo(doc: jsPDF, opts: DocumentPdfOptions, y: number): number {
  const leftX = MARGIN
  const rightX = PAGE_WIDTH - MARGIN - 70
  const startY = y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(opts.partyLabel, leftX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(opts.party.name, leftX, y)
  y += 4.5
  if (opts.party.address) {
    const lines = doc.splitTextToSize(opts.party.address, 90)
    doc.text(lines, leftX, y)
    y += lines.length * 4.5
  }
  if (opts.party.gstin) {
    doc.text(`GSTIN: ${opts.party.gstin}`, leftX, y)
    y += 4.5
  }
  if (opts.party.pan_number) {
    doc.text(`PAN: ${opts.party.pan_number}`, leftX, y)
    y += 4.5
  }
  const partyContact = [opts.party.phone, opts.party.email].filter(Boolean).join('  |  ')
  if (partyContact) {
    doc.text(partyContact, leftX, y)
    y += 4.5
  }

  let ry = startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(opts.docTitle, rightX, ry, { align: 'left' })
  ry += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`No: ${opts.docNumber}`, rightX, ry)
  ry += 4.5
  doc.text(`Date: ${new Date(opts.docDate).toLocaleDateString('en-IN')}`, rightX, ry)
  ry += 4.5
  if (opts.dueOrValidLabel && opts.dueOrValidDate) {
    doc.text(`${opts.dueOrValidLabel}: ${new Date(opts.dueOrValidDate).toLocaleDateString('en-IN')}`, rightX, ry)
    ry += 4.5
  }

  return Math.max(y, ry) + 6
}

function drawItemsTable(doc: jsPDF, items: PdfLineItem[], y: number): number {
  const cols = [
    { label: '#', x: MARGIN, width: 8, align: 'left' as const },
    { label: 'Description', x: MARGIN + 8, width: 62, align: 'left' as const },
    { label: 'HSN', x: MARGIN + 70, width: 16, align: 'left' as const },
    { label: 'Qty', x: MARGIN + 86, width: 16, align: 'right' as const },
    { label: 'Rate', x: MARGIN + 104, width: 22, align: 'right' as const },
    { label: 'GST%', x: MARGIN + 128, width: 14, align: 'right' as const },
    { label: 'Amount', x: PAGE_WIDTH - MARGIN, width: 30, align: 'right' as const },
  ]

  doc.setFillColor(240, 240, 240)
  doc.rect(MARGIN, y - 4.5, CONTENT_WIDTH, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  cols.forEach((c) => doc.text(c.label, c.x, y, { align: c.align }))
  y += 6

  doc.setFont('helvetica', 'normal')
  items.forEach((item, i) => {
    if (y > 270) {
      doc.addPage()
      y = MARGIN + 5
    }
    doc.text(String(i + 1), cols[0].x, y, { align: cols[0].align })
    const descLines = doc.splitTextToSize(item.description, cols[1].width)
    doc.text(descLines, cols[1].x, y, { align: cols[1].align })
    doc.text(item.hsn_code ?? '-', cols[2].x, y, { align: cols[2].align })
    doc.text(`${item.quantity}${item.unit ? ' ' + item.unit : ''}`, cols[3].x, y, { align: cols[3].align })
    doc.text(item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cols[4].x, y, { align: cols[4].align })
    doc.text(`${item.gst_rate}%`, cols[5].x, y, { align: cols[5].align })
    doc.text(item.line_total.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cols[6].x, y, { align: cols[6].align })
    y += Math.max(descLines.length * 4, 6)
  })

  doc.setDrawColor(220)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  return y + 6
}

function drawTotals(doc: jsPDF, opts: DocumentPdfOptions, y: number): number {
  const labelX = PAGE_WIDTH - MARGIN - 55
  const valueX = PAGE_WIDTH - MARGIN
  doc.setFontSize(9)

  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(label, labelX, y)
    doc.text(value, valueX, y, { align: 'right' })
    y += 5
  }

  row('Subtotal', formatCurrency(opts.subtotal))
  if (opts.discountTotal) row('Discount', `- ${formatCurrency(opts.discountTotal)}`)
  row('GST', formatCurrency(opts.taxTotal))
  doc.setDrawColor(180)
  doc.line(labelX, y, valueX, y)
  y += 5
  row('Total', formatCurrency(opts.total), true)

  return y + 6
}

function drawFooter(doc: jsPDF, company: Company, y: number, notes?: string | null): void {
  if (company.bank_name || company.account_number) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Bank Details', MARGIN, y)
    y += 4.5
    doc.setFont('helvetica', 'normal')
    if (company.bank_name) {
      doc.text(`Bank: ${company.bank_name}${company.branch_name ? ' - ' + company.branch_name : ''}`, MARGIN, y)
      y += 4.5
    }
    if (company.account_number) {
      doc.text(`A/C No: ${company.account_number}${company.ifsc_code ? '   IFSC: ' + company.ifsc_code : ''}`, MARGIN, y)
      y += 4.5
    }
    y += 3
  }

  if (notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', MARGIN, y)
    y += 4.5
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(notes, CONTENT_WIDTH)
    doc.text(lines, MARGIN, y)
    y += lines.length * 4.5 + 3
  }

  if (company.terms_conditions) {
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions', MARGIN, y)
    y += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(company.terms_conditions, CONTENT_WIDTH)
    doc.text(lines, MARGIN, y)
    y += lines.length * 4 + 6
    doc.setFontSize(9)
  }

  if (company.authorized_signatory) {
    y = Math.max(y, 270)
    doc.setFont('helvetica', 'normal')
    doc.text('For ' + company.name, PAGE_WIDTH - MARGIN, y, { align: 'right' })
    y += 12
    doc.text(company.authorized_signatory, PAGE_WIDTH - MARGIN, y, { align: 'right' })
    doc.setFontSize(7.5)
    doc.text('Authorized Signatory', PAGE_WIDTH - MARGIN, y + 4, { align: 'right' })
  }
}

/** Generic builder shared by Quotation, Purchase Order, and Tax Invoice — a header +
 * party block + line-item table + totals + bank/terms/signature footer. */
export function generateDocumentPdf(opts: DocumentPdfOptions): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN + 5
  y = drawCompanyHeader(doc, opts.company, y)
  y = drawPartyAndDocInfo(doc, opts, y)
  y = drawItemsTable(doc, opts.items, y)
  y = drawTotals(doc, opts, y)
  drawFooter(doc, opts.company, y, opts.notes)
  return doc
}

export interface LedgerRow {
  date: string
  particulars: string
  reference: string
  debit: number
  credit: number
  balance: number
}

export interface LedgerPdfOptions {
  company: Company
  party: PdfParty
  partyLabel: string
  openingBalance: number
  rows: LedgerRow[]
  closingBalance: number
  fromDate?: string
  toDate?: string
}

/** Statement-of-account style PDF: opening balance, running transactions, closing balance. */
export function generateLedgerPdf(opts: LedgerPdfOptions): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN + 5
  y = drawCompanyHeader(doc, opts.company, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Statement of Account', MARGIN, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(opts.partyLabel + ': ' + opts.party.name, MARGIN, y)
  y += 4.5
  if (opts.fromDate && opts.toDate) {
    doc.text(`Period: ${new Date(opts.fromDate).toLocaleDateString('en-IN')} - ${new Date(opts.toDate).toLocaleDateString('en-IN')}`, MARGIN, y)
    y += 4.5
  }
  y += 4

  const cols = [
    { label: 'Date', x: MARGIN, align: 'left' as const },
    { label: 'Particulars', x: MARGIN + 25, align: 'left' as const },
    { label: 'Reference', x: MARGIN + 90, align: 'left' as const },
    { label: 'Debit', x: MARGIN + 130, align: 'right' as const },
    { label: 'Credit', x: MARGIN + 155, align: 'right' as const },
    { label: 'Balance', x: PAGE_WIDTH - MARGIN, align: 'right' as const },
  ]

  doc.setFillColor(240, 240, 240)
  doc.rect(MARGIN, y - 4.5, CONTENT_WIDTH, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  cols.forEach((c) => doc.text(c.label, c.x, y, { align: c.align }))
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text('Opening Balance', cols[1].x, y)
  doc.text(formatCurrency(opts.openingBalance), cols[5].x, y, { align: 'right' })
  y += 5.5

  opts.rows.forEach((row) => {
    if (y > 270) {
      doc.addPage()
      y = MARGIN + 5
    }
    doc.text(new Date(row.date).toLocaleDateString('en-IN'), cols[0].x, y)
    doc.text(row.particulars, cols[1].x, y)
    doc.text(row.reference, cols[2].x, y)
    doc.text(row.debit ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-', cols[3].x, y, { align: 'right' })
    doc.text(row.credit ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-', cols[4].x, y, { align: 'right' })
    doc.text(row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cols[5].x, y, { align: 'right' })
    y += 5.5
  })

  doc.setDrawColor(180)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 5.5
  doc.setFont('helvetica', 'bold')
  doc.text('Closing Balance', cols[1].x, y)
  doc.text(formatCurrency(opts.closingBalance), cols[5].x, y, { align: 'right' })
  y += 10

  drawFooter(doc, opts.company, y, null)
  return doc
}
