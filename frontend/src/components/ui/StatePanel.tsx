import { CheckCircle2, CircleAlert, LoaderCircle, PackageOpen, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type StateKind = 'loading' | 'error' | 'success' | 'empty'
const stateConfig: Record<StateKind, { icon: LucideIcon; tone: string; title: string }> = {
  loading: { icon: LoaderCircle, tone: 'bg-blue-50 text-blue-600', title: 'Loading' },
  error: { icon: CircleAlert, tone: 'bg-rose-50 text-rose-600', title: 'Something went wrong' },
  success: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', title: 'Done' },
  empty: { icon: PackageOpen, tone: 'bg-slate-100 text-slate-500', title: 'Nothing here yet' },
}

type StatePanelProps = { kind: StateKind; title?: string; description?: string; action?: ReactNode; className?: string; compact?: boolean }

export function StatePanel({ kind, title, description, action, className, compact = false }: StatePanelProps) {
  const config = stateConfig[kind]
  const Icon = config.icon
  return (
    <div role={kind === 'error' ? 'alert' : kind === 'success' ? 'status' : undefined} aria-live={kind === 'loading' ? 'polite' : undefined} className={cn('flex flex-col items-center text-center', compact ? 'py-7' : 'px-5 py-12 sm:py-16', className)}>
      <span className={cn('mb-4 grid place-items-center rounded-2xl', compact ? 'size-10' : 'size-12', config.tone)}><Icon size={compact ? 18 : 21} className={kind === 'loading' ? 'animate-spin' : ''} /></span>
      <h3 className="text-sm font-semibold text-slate-900">{title ?? config.title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
