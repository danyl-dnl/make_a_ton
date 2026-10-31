import { ExternalLink, ShieldCheck, UserRound } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { StatePanel } from '../components/ui/StatePanel'

const portalAreas = [
  { title: 'Account profile', description: 'Let customers review their account details.', icon: UserRound },
  { title: 'Subscriptions and invoices', description: 'Give customers access to their plans, invoices, and payment history.', icon: ExternalLink },
  { title: 'Account security', description: 'Provide secure sign-in and account access controls.', icon: ShieldCheck },
]

export function CustomerPortalPage() {
  return <PageContainer title="Customer Portal" description="The self-service space for customers to manage their Brightloop account.">
    <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><span className="font-semibold">Portal integration pending.</span> Authentication, customer roles, and portal endpoints are not connected. No customer data or access controls are simulated.</div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <Card><CardHeader><CardTitle>Portal readiness</CardTitle><p className="text-sm text-slate-500">Customer portal services and access settings are not connected yet.</p></CardHeader><CardContent><StatePanel kind="empty" title="Portal setup is unavailable" description="No customer records, sign-in links, or access controls are available in this frontend until the portal API and role model are configured." compact /></CardContent></Card>
      <Card><CardHeader><CardTitle>Portal areas</CardTitle><p className="text-sm text-slate-500">A guide to what customers can manage when the portal is connected.</p></CardHeader><CardContent className="space-y-3">{portalAreas.map(({ title, description, icon: Icon }) => <div key={title} className="flex gap-3 rounded-xl border border-slate-100 p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Icon size={17} /></span><div><h3 className="text-sm font-medium text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>)}</CardContent></Card>
    </div>
  </PageContainer>
}
