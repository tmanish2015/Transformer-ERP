import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransFabMark } from '@/components/brand/transfab-mark'
import { companyOnboardingSchema, industryTypes, type CompanyOnboardingFormValues } from '@/features/settings/schemas/company-schemas'
import { useCreateCompany } from '@/features/settings/hooks/use-create-company'

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createCompany = useCreateCompany()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyOnboardingFormValues>({
    resolver: zodResolver(companyOnboardingSchema),
    defaultValues: { companyName: '', industryType: undefined },
  })

  const onSubmit = async (values: CompanyOnboardingFormValues) => {
    await createCompany.mutateAsync(values)
    // Wait for the refetch (not just the cache invalidation) so RequireCompany sees the
    // new company_id before we navigate — otherwise it bounces straight back here.
    await queryClient.refetchQueries({ queryKey: ['auth', 'profile'], type: 'active' })
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TransFabMark className="size-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">TransFab AI ERP</span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-foreground">Set up your company</h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your business — this creates your workspace and starts a 14-day trial.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {createCompany.isError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>
                {createCompany.error instanceof Error ? createCompany.error.message : 'Something went wrong. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              placeholder="Acme Transformers Pvt. Ltd."
              aria-invalid={Boolean(errors.companyName)}
              {...register('companyName')}
            />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="industryType">Industry type</Label>
            <Controller
              control={control}
              name="industryType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="industryType" className="w-full" aria-invalid={Boolean(errors.industryType)}>
                    <SelectValue placeholder="Select your industry" />
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
            {errors.industryType && <p className="text-xs text-destructive">{errors.industryType.message}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={createCompany.isPending}>
            {createCompany.isPending && <Loader2 className="size-4 animate-spin" />}
            Create workspace
          </Button>
        </form>
      </div>
    </div>
  )
}
