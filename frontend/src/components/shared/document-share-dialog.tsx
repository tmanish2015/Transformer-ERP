import { useState } from 'react'
import type { jsPDF } from 'jspdf'
import { Loader2, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buildWhatsAppShareLink, sendDocumentEmail, uploadDocumentPdf } from '@/lib/share-api'
import { useCompanyProfile } from '@/features/settings/hooks/use-company-profile'

interface DocumentShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docLabel: string
  docType: string
  docId: string
  companyId: string
  partyName: string
  partyEmail: string | null
  partyPhone: string | null
  buildPdf: () => jsPDF
}

export function DocumentShareDialog({ open, onOpenChange, docLabel, docType, docId, companyId, partyName, partyEmail, partyPhone, buildPdf }: DocumentShareDialogProps) {
  const { data: company } = useCompanyProfile()
  const companyName = company?.name ?? 'us'

  const [emailTo, setEmailTo] = useState(partyEmail ?? '')
  const [emailSubject, setEmailSubject] = useState(`${docLabel} from ${companyName}`)
  const [emailMessage, setEmailMessage] = useState(`Dear ${partyName},\n\nPlease find attached your ${docLabel}.\n\nRegards,\n${companyName}`)
  const [sendingEmail, setSendingEmail] = useState(false)

  const [whatsappPhone, setWhatsappPhone] = useState(partyPhone ?? '')
  const [whatsappMessage, setWhatsappMessage] = useState(`Hi ${partyName}, please find your ${docLabel} from ${companyName}.`)
  const [preparingWhatsapp, setPreparingWhatsapp] = useState(false)

  const filename = `${docLabel.replace(/\s+/g, '_')}.pdf`

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Enter a recipient email')
      return
    }
    setSendingEmail(true)
    try {
      const doc = buildPdf()
      await sendDocumentEmail({ to: emailTo, subject: emailSubject, message: emailMessage, doc, filename })
      toast.success('Email sent')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleShareWhatsapp = async () => {
    if (!whatsappPhone) {
      toast.error('Enter a phone number')
      return
    }
    setPreparingWhatsapp(true)
    try {
      const doc = buildPdf()
      const signedUrl = await uploadDocumentPdf(companyId, docType, docId, filename, doc)
      const fullMessage = `${whatsappMessage}\n\n${signedUrl}`
      window.open(buildWhatsAppShareLink(whatsappPhone, fullMessage), '_blank')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to prepare WhatsApp share')
    } finally {
      setPreparingWhatsapp(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {docLabel}</DialogTitle>
          <DialogDescription>Send this document by email or WhatsApp.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">
              <Mail className="size-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageCircle className="size-4" /> WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="share-email-to">To</Label>
              <Input id="share-email-to" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="customer@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-email-subject">Subject</Label>
              <Input id="share-email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-email-message">Message</Label>
              <Textarea id="share-email-message" rows={4} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
            </div>
            <Button onClick={() => void handleSendEmail()} disabled={sendingEmail} className="w-full">
              {sendingEmail && <Loader2 className="size-4 animate-spin" />}
              Send Email
            </Button>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="share-whatsapp-phone">Phone Number</Label>
              <Input id="share-whatsapp-phone" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-whatsapp-message">Message</Label>
              <Textarea id="share-whatsapp-message" rows={3} value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Uploads the PDF and opens WhatsApp with a link to it pre-filled in your message.</p>
            <Button onClick={() => void handleShareWhatsapp()} disabled={preparingWhatsapp} className="w-full">
              {preparingWhatsapp && <Loader2 className="size-4 animate-spin" />}
              Open WhatsApp
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
