import { useMemo, useState } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DocumentShareDialog } from '@/components/shared/document-share-dialog'
import { useCustomers } from '@/features/sales/hooks/use-customers'
import { useCustomerLedger } from '@/features/sales/hooks/use-customer-ledger'
import { useCompanyProfile } from '@/features/settings/hooks/use-company-profile'
import { generateLedgerPdf, type LedgerRow } from '@/lib/pdf-generator'
import { useAuth } from '@/providers/auth-provider'

export function CustomerLedgerPage() {
  const { profile } = useAuth()
  const { data: company } = useCompanyProfile()
  const { data: customers } = useCustomers()
  const [customerId, setCustomerId] = useState<string>('')
  const { data: ledgerData, isLoading } = useCustomerLedger(customerId || undefined)
  const [shareOpen, setShareOpen] = useState(false)

  const customer = customers?.find((c) => c.id === customerId)

  const rows: LedgerRow[] = useMemo(() => {
    if (!ledgerData) return []
    const invoiceNumberById = new Map(ledgerData.invoices.map((i) => [i.id, i.invoice_number]))
    const entries = [
      ...ledgerData.invoices.map((i) => ({ date: i.invoice_date, particulars: 'Invoice raised', reference: i.invoice_number, debit: i.total, credit: 0 })),
      ...ledgerData.payments.map((p) => ({
        date: p.payment_date,
        particulars: 'Payment received',
        reference: invoiceNumberById.get(p.sales_invoice_id) ?? '',
        debit: 0,
        credit: p.amount,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let balance = 0
    return entries.map((e) => {
      balance += e.debit - e.credit
      return { ...e, balance }
    })
  }, [ledgerData])

  const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0

  const buildPdf = () => {
    if (!company || !customer) throw new Error('Missing company or customer data')
    return generateLedgerPdf({
      company,
      party: { name: customer.name, address: customer.billing_address, gstin: customer.gstin, pan_number: customer.pan_number, phone: customer.phone, email: customer.email },
      partyLabel: 'Customer',
      openingBalance: 0,
      rows,
      closingBalance,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Ledger"
        description="Statement of account: invoices raised and payments received per customer."
        actions={
          customerId &&
          rows.length > 0 && (
            <Button onClick={() => setShareOpen(true)}>
              <Share2 /> Share
            </Button>
          )
        }
      />

      <div className="max-w-xs">
        <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!customerId ? (
        <EmptyState icon={Share2} title="Select a customer" description="Choose a customer above to view their statement of account." />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Share2} title="No transactions yet" description="This customer has no invoices or payments recorded." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.particulars}</TableCell>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell className="text-right">{row.debit ? `₹${row.debit.toLocaleString('en-IN')}` : '—'}</TableCell>
                  <TableCell className="text-right">{row.credit ? `₹${row.credit.toLocaleString('en-IN')}` : '—'}</TableCell>
                  <TableCell className="text-right font-medium">₹{row.balance.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-semibold">
                  Closing Balance
                </TableCell>
                <TableCell className="text-right font-semibold">₹{closingBalance.toLocaleString('en-IN')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {shareOpen && company && customer && profile?.companyId && (
        <DocumentShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          docLabel={`Statement of Account - ${customer.name}`}
          docType="ledger"
          docId={customer.id}
          companyId={profile.companyId}
          partyName={customer.name}
          partyEmail={customer.email}
          partyPhone={customer.phone}
          buildPdf={() => {
            try {
              return buildPdf()
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to build PDF')
              throw error
            }
          }}
        />
      )}
    </div>
  )
}
