import type { ReactNode } from 'react'
import { ShieldCheck, Wrench, Gauge } from 'lucide-react'
import { TransformerErpMark } from '@/components/brand/transformer-erp-mark'

const highlights = [
  { icon: Wrench, text: 'Full repair job-card lifecycle, stage by stage' },
  { icon: Gauge, text: 'Rental asset tracking from booking to return' },
  { icon: ShieldCheck, text: 'Role-based access built for multi-branch teams' },
]

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 size-[28rem] rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white text-primary">
            <TransformerErpMark className="size-5" />
          </div>
          <span className="text-lg font-semibold text-primary-foreground">Transformer AI ERP</span>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="max-w-md text-3xl font-semibold text-balance text-primary-foreground">
            The operating system for transformer repair, rental &amp; manufacturing companies
          </h2>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="size-4" />
                </div>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Transformer AI ERP. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TransformerErpMark className="size-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">Transformer AI ERP</span>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
