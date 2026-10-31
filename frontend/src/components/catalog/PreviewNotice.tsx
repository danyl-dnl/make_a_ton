import { Eye } from 'lucide-react'

export function PreviewNotice() {
  return <div role="note" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"><Eye size={16} className="mt-0.5 shrink-0 text-amber-700" /><p className="text-xs leading-5"><span className="font-semibold">Temporary preview source.</span> Records are held in memory for this session only, start empty, and disappear on reload. Connect the confirmed backend API before relying on this data.</p></div>
}
