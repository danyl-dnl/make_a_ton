import { Check, Clock3, Pause, Send, XCircle, Zap, type LucideIcon } from 'lucide-react'
import type { QuotationStatus, SubscriptionStatus } from '../../lib/commerce-types'

type Status = QuotationStatus | SubscriptionStatus
const config: Record<Status, { label: string; classes: string; icon: LucideIcon }> = {
  draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-700', icon: Clock3 },
  sent: { label: 'Sent', classes: 'bg-blue-50 text-blue-700', icon: Send },
  confirmed: { label: 'Confirmed', classes: 'bg-indigo-50 text-indigo-700', icon: Check },
  pending_confirmation: { label: 'Pending confirmation', classes: 'bg-amber-50 text-amber-800', icon: Clock3 },
  active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-700', icon: Zap },
  paused: { label: 'Paused', classes: 'bg-orange-50 text-orange-700', icon: Pause },
  expired: { label: 'Expired', classes: 'bg-slate-100 text-slate-600', icon: Clock3 },
  cancelled: { label: 'Cancelled', classes: 'bg-rose-50 text-rose-700', icon: XCircle },
  closed: { label: 'Closed', classes: 'bg-rose-50 text-rose-700', icon: XCircle },
}

export function StatusBadge({ status }: { status: Status }) {
  const item = config[status]
  const Icon = item.icon
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${item.classes}`}><Icon size={13} strokeWidth={2.2} />{item.label}</span>
}
