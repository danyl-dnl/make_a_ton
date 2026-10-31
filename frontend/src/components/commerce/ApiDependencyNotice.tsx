import { CircleAlert } from 'lucide-react'

export function ApiDependencyNotice() {
  return <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"><CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-700" /><p className="text-xs leading-5"><span className="font-semibold">Backend integration pending.</span> These screens use provisional routes because the repository has no quotation/subscription API contract. No sample business records or local status changes are used. Confirm the API with Person A before enabling actions.</p></div>
}
