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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { companyOnboardingSchema, industryTypes, type CompanyOnboardingFormValues } from '@/features/settings/schemas/company-schemas'
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
    </div>
  )
}
