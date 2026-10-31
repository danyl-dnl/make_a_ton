import { ArrowRight, Blocks, CreditCard, FileText, Layers3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const sections = [
  { title: 'Products', detail: 'Manage your product catalog', href: '/products', icon: Blocks, tint: 'bg-violet-50 text-violet-600' },
  { title: 'Plans', detail: 'Configure pricing and billing', href: '/plans', icon: Layers3, tint: 'bg-blue-50 text-blue-600' },
  { title: 'Customers', detail: 'View and organize customers', href: '/customers', icon: Users, tint: 'bg-emerald-50 text-emerald-600' },
  { title: 'Subscriptions', detail: 'Manage recurring relationships', href: '/subscriptions', icon: CreditCard, tint: 'bg-amber-50 text-amber-600' },
  { title: 'Quotations', detail: 'Prepare customer quotations', href: '/quotations', icon: FileText, tint: 'bg-rose-50 text-rose-600' },
]

export function DashboardPage() {
  return (
    <PageContainer title="Dashboard" description="Welcome to Brightloop. Choose an area to get started.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ title, detail, href, icon: Icon, tint }) => (
          <Link to={href} key={title} className="group">
            <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-md">
              <CardHeader><div className="mb-2 flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-xl ${tint}`}><Icon size={19} /></span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></div><CardTitle>{title}</CardTitle><p className="mt-1 text-sm text-slate-500">{detail}</p></CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Getting started</CardTitle><p className="text-sm text-slate-500">Set up your workspace in a few steps.</p></CardHeader>
        <CardContent><div className="grid gap-3 md:grid-cols-3">{['Add your first product', 'Create a subscription plan', 'Invite your team'].map((step, index) => <div key={step} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">0{index + 1}</span><span className="pt-1 text-sm font-medium text-slate-700">{step}</span></div>)}</div></CardContent>
      </Card>
    </PageContainer>
  )
}
