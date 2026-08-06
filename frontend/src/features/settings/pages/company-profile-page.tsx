import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { companyOnboardingSchema, industryTypes, type CompanyOnboardingFormValues } from '@/features/settings/schemas/company-schemas'
import { companySettingsSchema, type CompanySettingsFormValues } from '@/features/settings/schemas/company-schemas'
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/settings/hooks/use-company-profile'
import { useAuth } from '@/providers/auth-provider'

export function CompanyProfilePage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('settings.manage')
  const { data: company, isLoading } = useCompanyProfile()
  const updateCompany = useUpdateCompanyProfile()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyOnboardingFormValues>({
    resolver: zodResolver(companyOnboardingSchema),
    values: {
      companyName: company?.name ?? '',
      industryType: company?.industry_type ?? '',
    },
  })

  const onSubmit = (values: CompanyOnboardingFormValues) => {
    updateCompany.mutate({ name: values.companyName, industry_type: values.industryType })
  }

  const {
    register: registerDocs,
    handleSubmit: handleSubmitDocs,
    formState: { errors: docErrors },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    values: {
      name: company?.name ?? '',
      company_email: company?.company_email ?? '',
      company_phone: company?.company_phone ?? '',
      website: company?.website ?? '',
      logo_url: company?.logo_url ?? '',
      company_address: company?.company_address ?? '',
      gstin: company?.gstin ?? '',
      pan_number: company?.pan_number ?? '',
      bank_name: company?.bank_name ?? '',
      account_number: company?.account_number ?? '',
      ifsc_code: company?.ifsc_code ?? '',
      branch_name: company?.branch_name ?? '',
      authorized_signatory: company?.authorized_signatory ?? '',
      terms_conditions: company?.terms_conditions ?? '',
    },
  })

  const onSubmitDocs = (values: CompanySettingsFormValues) => {
    updateCompany.mutate({
      company_email: values.company_email || null,
      company_phone: values.company_phone || null,
      website: values.website || null,
      logo_url: values.logo_url || null,
      company_address: values.company_address || null,
      gstin: values.gstin || null,
      pan_number: values.pan_number || null,
      bank_name: values.bank_name || null,
      account_number: values.account_number || null,
      ifsc_code: values.ifsc_code || null,
      branch_name: values.branch_name || null,
      authorized_signatory: values.authorized_signatory || null,
      terms_conditions: values.terms_conditions || null,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Company Settings" description="This information appears across every module in your workspace." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Profile</CardTitle>
          <CardDescription>
            Company name and industry type. {company && <Badge variant="outline" className="ml-1 capitalize">{company.status}</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <fieldset disabled={!canManage} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" {...register('companyName')} />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="industryType">Industry Type</Label>
                  <Controller
                    control={control}
                    name="industryType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="industryType" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {industryTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </fieldset>

              {canManage && (
                <Button type="submit" disabled={updateCompany.isPending}>
                  {updateCompany.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save Company Profile
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Details</CardTitle>
          <CardDescription>GST, bank, and signatory details printed on shared invoices, purchase orders, quotations, and ledgers.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmitDocs(onSubmitDocs)} className="space-y-5">
              <fieldset disabled={!canManage} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company_email">Company Email</Label>
                    <Input id="company_email" type="email" {...registerDocs('company_email')} />
                    {docErrors.company_email && <p className="text-xs text-destructive">{docErrors.company_email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company_phone">Company Phone</Label>
                    <Input id="company_phone" {...registerDocs('company_phone')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://" {...registerDocs('website')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input id="logo_url" placeholder="https://.../logo.png" {...registerDocs('logo_url')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea id="company_address" rows={2} {...registerDocs('company_address')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input id="gstin" placeholder="22ABCDE1234F1Z5" {...registerDocs('gstin')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input id="pan_number" placeholder="ABCDE1234F" {...registerDocs('pan_number')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input id="bank_name" {...registerDocs('bank_name')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="branch_name">Branch Name</Label>
                    <Input id="branch_name" {...registerDocs('branch_name')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input id="account_number" {...registerDocs('account_number')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                    <Input id="ifsc_code" {...registerDocs('ifsc_code')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="authorized_signatory">Authorized Signatory</Label>
                  <Input id="authorized_signatory" {...registerDocs('authorized_signatory')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="terms_conditions">Terms &amp; Conditions</Label>
                  <Textarea id="terms_conditions" rows={3} placeholder="Printed at the bottom of every shared document" {...registerDocs('terms_conditions')} />
                </div>
              </fieldset>

              {canManage && (
                <Button type="submit" disabled={updateCompany.isPending}>
                  {updateCompany.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save Document Details
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
