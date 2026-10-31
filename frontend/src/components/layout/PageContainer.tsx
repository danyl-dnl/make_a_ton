import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type PageContainerProps = {
  title: string
  description: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageContainer({ title, description, actions, children, className }: PageContainerProps) {
  return (
    <section className={cn('mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10', className)}>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
