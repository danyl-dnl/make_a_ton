import { AlertTriangle } from 'lucide-react'
import { Button } from './button'
import { Modal } from './Modal'

type ConfirmDialogProps = { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; busy?: boolean; destructive?: boolean }

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', busy = false, destructive = true }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={19} /></span><p className="text-sm leading-6 text-slate-600">{description}</p></div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={onConfirm} disabled={busy} className={destructive ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500' : ''}>{busy ? 'Please wait…' : confirmLabel}</Button>
      </div>
    </Modal>
  )
}
