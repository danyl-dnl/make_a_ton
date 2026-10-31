import { CircleAlert } from 'lucide-react'

export function BillingApiNotice() {
  return <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"><CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-700" /><p className="text-xs leading-5"><span className="font-semibold">Billing backend integration pending.</span> These screens use provisional billing and finance routes because no API contract is available. Amounts and records are never fabricated. Confirm the endpoints with Person A before enabling actions.</p></div>
}
