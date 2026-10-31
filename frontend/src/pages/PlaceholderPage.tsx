import { ArrowUpRight, Plus, Search } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

type PlaceholderPageProps = {
  title: string
  description: string
  actionLabel?: string
}

export function PlaceholderPage({ title, description, actionLabel }: PlaceholderPageProps) {
  return (
    <PageContainer title={title} description={description} actions={actionLabel ? <Button><Plus size={16} />{actionLabel}</Button> : undefined}>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between border-b border-slate-100">
          <div><CardTitle>{title} overview</CardTitle><p className="mt-1.5 text-sm text-slate-500">Your {title.toLowerCase()} will appear here once connected.</p></div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex"><Search size={14} />Search</Button>
        </CardHeader>
        <CardContent className="py-12 sm:py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><ArrowUpRight size={23} strokeWidth={1.8} /></div>
            <h3 className="text-sm font-semibold text-slate-900">A clear view of your {title.toLowerCase()}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">This section is ready for your data and workflows. Add records to start organizing this part of your subscription business.</p>
            {actionLabel ? <Button className="mt-6" variant="secondary" size="sm"><Plus size={15} />{actionLabel}</Button> : null}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
