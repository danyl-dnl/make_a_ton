import { BadgeCheck, Ban, Clock3, CircleAlert, FileClock, FileText } from 'lucide-react'
import type { InvoiceStatus } from '../../lib/billing-types'

const styles: Record<InvoiceStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700', icon: FileText },
  issued: { label: 'Issued', className: 'bg-blue-50 text-blue-700', icon: FileClock },
  partially_paid: { label: 'Partially paid', className: 'bg-amber-50 text-amber-800', icon: CircleAlert },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700', icon: BadgeCheck },
  overdue: { label: 'Overdue', className: 'bg-rose-50 text-rose-700', icon: CircleAlert },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600', icon: Ban },
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const value = styles[status]; const Icon = value.icon
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${value.className}`}><Icon size={13} />{value.label}</span>
}
