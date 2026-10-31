import { BadgeCheck, Clock3, CircleAlert, RotateCcw, type LucideIcon } from 'lucide-react'
import type { InvoicePaymentStatus, PaymentStatus } from '../../lib/finance-types'

const paymentStyles: Record<PaymentStatus, { label: string; tone: string; icon: LucideIcon }> = {
  pending: { label: 'Pending', tone: 'bg-amber-50 text-amber-800', icon: Clock3 },
  completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700', icon: BadgeCheck },
  failed: { label: 'Failed', tone: 'bg-rose-50 text-rose-700', icon: CircleAlert },
  refunded: { label: 'Refunded', tone: 'bg-slate-100 text-slate-600', icon: RotateCcw },
}
const invoiceStyles: Record<InvoicePaymentStatus, { label: string; tone: string; icon: LucideIcon }> = {
  unpaid: { label: 'Unpaid', tone: 'bg-rose-50 text-rose-700', icon: CircleAlert },
  partially_paid: { label: 'Partially paid', tone: 'bg-amber-50 text-amber-800', icon: Clock3 },
  paid: { label: 'Paid in full', tone: 'bg-emerald-50 text-emerald-700', icon: BadgeCheck },
}

function Badge({ label, tone, icon: Icon }: { label: string; tone: string; icon: LucideIcon }) { return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}><Icon size={13} />{label}</span> }
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) { return <Badge {...paymentStyles[status]} /> }
export function InvoicePaymentBadge({ status }: { status: InvoicePaymentStatus }) { return <Badge {...invoiceStyles[status]} /> }
