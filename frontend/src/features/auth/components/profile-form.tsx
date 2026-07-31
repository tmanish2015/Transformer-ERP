import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileSchema, type ProfileFormValues } from '@/features/auth/schemas/auth-schemas'
import { useUpdateProfile } from '@/features/auth/hooks/use-update-profile'
import { useAuth } from '@/providers/auth-provider'

export function ProfileForm() {
  const { profile, user } = useAuth()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({ fullName: profile.fullName ?? '', phone: profile.phone ?? '' })
    }
  }, [profile, reset])

  return (
    <form onSubmit={handleSubmit((values) => updateProfile.mutate(values))} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={user?.email ?? ''} disabled />
        <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          placeholder="Your full name"
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" {...register('phone')} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateProfile.isPending || !isDirty}>
          {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
        {updateProfile.isSuccess && !isDirty && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
