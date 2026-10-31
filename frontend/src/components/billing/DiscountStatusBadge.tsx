import { BadgeCheck, CalendarClock, CircleOff, Clock3, FileText } from 'lucide-react'
import type { DiscountStatus } from '../../lib/billing-types'

const statusConfig: Record<DiscountStatus, { label: string; tone: string; icon: typeof Clock3 }> = {
  draft: { label: 'Draft', tone: 'bg-slate-100 text-slate-700', icon: FileText },
  scheduled: { label: 'Scheduled', tone: 'bg-blue-50 text-blue-700', icon: CalendarClock },
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700', icon: BadgeCheck },
  expired: { label: 'Expired', tone: 'bg-amber-50 text-amber-800', icon: Clock3 },
  disabled: { label: 'Disabled', tone: 'bg-rose-50 text-rose-700', icon: CircleOff },
}

export function DiscountStatusBadge({ status }: { status: DiscountStatus }) {
  const item = statusConfig[status]; const Icon = item.icon
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}><Icon size={13} />{item.label}</span>
}
