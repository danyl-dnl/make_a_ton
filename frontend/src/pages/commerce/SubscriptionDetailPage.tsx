import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, CircleHelp, Clock3, Play, RefreshCw, ShieldCheck, Pause, XCircle } from 'lucide-react'
import { ApiDependencyNotice } from '../../components/commerce/ApiDependencyNotice'
import { LineItemsTable } from '../../components/commerce/LineItemsTable'
import { StatusBadge } from '../../components/commerce/StatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { StatePanel } from '../../components/ui/StatePanel'
import { commerceApi, commerceApiConfigured } from '../../lib/commerce-api'
import { formatINR } from '../../lib/format'
import type { LifecycleAction, Subscription, SubscriptionStatus } from '../../lib/commerce-types'

const actions: { id: LifecycleAction; label: string; icon: typeof Check; allowed: (status: SubscriptionStatus) => boolean; variant?: 'primary' | 'outline' }[] = [
  { id: 'confirm', label: 'Confirm', icon: Check, allowed: (status) => status === 'pending_confirmation', variant: 'outline' },
  { id: 'activate', label: 'Activate', icon: Play, allowed: (status) => status === 'confirmed' },
  { id: 'pause', label: 'Pause', icon: Pause, allowed: (status) => status === 'active', variant: 'outline' },
  { id: 'resume', label: 'Resume', icon: Play, allowed: (status) => status === 'paused' },
  { id: 'renew', label: 'Renew', icon: RefreshCw, allowed: (status) => status === 'active' || status === 'expired', variant: 'outline' },
  { id: 'close', label: 'Close', icon: XCircle, allowed: (status) => status !== 'closed', variant: 'outline' },
]

export function SubscriptionDetailPage() {
  const { subscriptionId = '' } = useParams()
  const [item, setItem] = useState<Subscription | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [actionBusy, setActionBusy] = useState<LifecycleAction | null>(null); const [confirmClose, setConfirmClose] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItem(await commerceApi.getSubscription(subscriptionId)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Subscription could not be loaded.') } finally { setLoading(false) } }, [subscriptionId])
  useEffect(() => { void load() }, [load])

  async function performAction(action: LifecycleAction) {
    if (!item || !commerceApiConfigured || !actions.find((option) => option.id === action)?.allowed(item.status)) return
    setActionBusy(action); setError('')
    try {
      await commerceApi.lifecycle(item.id, action)
      if (action === 'close') setConfirmClose(false)
      // The authoritative state always comes from a fresh backend read after the action.
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Could not ${action} this subscription.`); if (action === 'close') setConfirmClose(false) }
    finally { setActionBusy(null) }
  }

  return <PageContainer title={item ? item.number : 'Subscription details'} description="Review subscription terms and follow its status through each lifecycle stage." actions={<Link to="/subscriptions" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} />All subscriptions</Link>}>
    {!commerceApiConfigured ? <ApiDependencyNotice /> : null}
    {loading ? <Card><StatePanel kind="loading" title="Loading subscription" description="Fetching subscription details from the backend." /></Card> : error && !item ? <Card><StatePanel kind="error" title="Subscription details unavailable" description={error} action={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></Card> : item ? <div className="space-y-5">
      {error ? <div className="rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Subscription action failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Refresh status</Button>} /></div> : null}
      <Card><CardHeader className="flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subscription number</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{item.number}</h2></div><StatusBadge status={item.status} /></div><div className="flex flex-wrap gap-2">{actions.map(({ id, label, icon: Icon, allowed, variant }) => <Button key={id} variant={variant ?? 'primary'} size="sm" disabled={!commerceApiConfigured || actionBusy !== null || !allowed(item.status)} onClick={() => id === 'close' ? setConfirmClose(true) : void performAction(id)}>{actionBusy === id ? <Clock3 size={14} className="animate-pulse" /> : <Icon size={14} />}{actionBusy === id ? `${label}…` : label}</Button>)}</div></CardHeader><div className="border-t border-slate-100 px-5 py-3 sm:px-6"><p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><CircleHelp size={15} className="mt-0.5 shrink-0" />Lifecycle: Pending confirmation → Confirmed → Active ↔ Paused. Renew is available for active or expired subscriptions. Closing ends the subscription. Each action is verified by the backend and the status is reloaded from the server.</p>{!commerceApiConfigured ? <p className="mt-2 text-xs font-medium text-amber-800">Actions are disabled until the subscription API contract and server are configured.</p> : null}</div></Card>
      <div className="grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Subscription details</CardTitle></CardHeader><div className="grid gap-x-6 gap-y-5 px-5 pb-6 sm:grid-cols-2 sm:px-6"><Info label="Customer" value={item.customerName} /><Info label="Customer email" value={item.customerEmail || '—'} /><Info label="Plan" value={item.planName} /><Info label="Payment terms" value={item.paymentTerms || 'Not specified'} /><Info label="Start date" value={formatDate(item.startDate)} icon={<CalendarDays size={16} />} /><Info label="Expiry date" value={formatDate(item.expiryDate)} icon={<CalendarDays size={16} />} /></div></Card><Card><CardHeader><CardTitle>Current status</CardTitle></CardHeader><div className="px-5 pb-6 sm:px-6"><StatusBadge status={item.status} /><p className="mt-3 text-sm leading-6 text-slate-500">{statusDescription[item.status]}</p><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><ShieldCheck size={15} className="text-slate-400" />Status is controlled by the subscription service.</div></div></Card></div>
      <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><CardTitle>Products and plans</CardTitle><p className="text-sm text-slate-500">Quantities, unit prices, taxes, and line amounts.</p></CardHeader><div className="p-0"><LineItemsTable lines={item.lines} /></div><div className="mx-5 mb-5 flex justify-end border-t border-slate-100 pt-4 sm:mx-6"><div className="text-right"><p className="text-xs text-slate-500">Subscription amount</p><p className="mt-1 text-xl font-semibold text-slate-950">{formatINR.format(item.amount)}</p></div></div></Card>
    </div> : null}
    <ConfirmDialog open={confirmClose} onClose={() => { if (!actionBusy) setConfirmClose(false) }} onConfirm={() => void performAction('close')} busy={actionBusy === 'close'} title="Close subscription?" description={`Close subscription “${item?.number ?? ''}”? The backend will perform this action and determine the final status.`} confirmLabel="Close subscription" />
  </PageContainer>
}

const statusDescription: Record<SubscriptionStatus, string> = {
  pending_confirmation: 'Waiting for confirmation before activation can proceed.',
  confirmed: 'Confirmed and ready to be activated.',
  active: 'Currently running under its configured billing terms.',
  paused: 'Temporarily paused. Resume when service should continue.',
  expired: 'The current term has expired. Renew through the subscription service to continue.',
  closed: 'This subscription has been closed and is no longer active.',
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) { return <div className="flex gap-2.5">{icon ? <span className="mt-0.5 text-slate-400">{icon}</span> : null}<div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div></div> }
function formatDate(value: string) { if (!value) return '—'; const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) }
