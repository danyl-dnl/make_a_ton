import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-slate-200/75', className)} />
}

export function MetricSkeleton() {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="size-9 rounded-xl" /></div><Skeleton className="mt-6 h-8 w-36" /><Skeleton className="mt-3 h-3 w-24" /></div>
}
