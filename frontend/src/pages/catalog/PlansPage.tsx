import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer } from '../../components/layout/PageContainer'
import { PreviewNotice } from '../../components/catalog/PreviewNotice'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { catalogService } from '../../lib/catalog-service'
import { formatINR } from '../../lib/format'
import type { BillingInterval, Plan, PlanInput } from '../../lib/catalog-types'

const blankPlan = (): PlanInput => ({ name: '', description: '', price: 0, interval: 'monthly', minimumQuantity: 1, availableFrom: '', availableUntil: '', autoClose: false, autoCloseAfterDays: null, allowPause: true, allowEarlyClose: true, renewAutomatically: true })
const intervalLabels: Record<BillingInterval, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

function validate(input: PlanInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.name.trim().length < 2) errors.name = 'Enter a plan name with at least 2 characters.'
  if (!Number.isFinite(input.price) || input.price < 0) errors.price = 'Enter a valid, non-negative price.'
  if (!Number.isInteger(input.minimumQuantity) || input.minimumQuantity < 1) errors.minimumQuantity = 'Minimum quantity must be a whole number of at least 1.'
  if (input.availableFrom && input.availableUntil && input.availableUntil < input.availableFrom) errors.availableUntil = 'End date must be on or after the start date.'
  if (input.autoClose && (!Number.isInteger(input.autoCloseAfterDays) || (input.autoCloseAfterDays ?? 0) < 1)) errors.autoCloseAfterDays = 'Enter a whole number of at least 1 day.'
  return errors
}

function ToggleField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-3.5"><span><span className="block text-sm font-medium text-slate-800">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-blue-600" /></label>
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [query, setQuery] = useState('')
  const [intervalFilter, setIntervalFilter] = useState<'all' | BillingInterval>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [draft, setDraft] = useState<PlanInput>(blankPlan())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Plan | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setPageError('')
    try { const result = await catalogService.listPlans(); setPlans(result.items) }
    catch (error) { setPlans([]); setPageError(error instanceof Error ? error.message : 'Plans could not be loaded. Please try again.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => plans.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()) && (intervalFilter === 'all' || item.interval === intervalFilter)), [plans, query, intervalFilter])
  function openCreate() { setEditing(null); setDraft(blankPlan()); setFieldErrors({}); setEditorOpen(true) }
  function openEdit(plan: Plan) { const { id: _id, createdAt: _createdAt, ...input } = plan; setEditing(plan); setDraft(input); setFieldErrors({}); setEditorOpen(true) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const errors = validate(draft); setFieldErrors(errors); if (Object.keys(errors).length) return
    setSaving(true); setPageError('')
    try {
      const input = { ...draft, name: draft.name.trim(), description: draft.description.trim(), autoCloseAfterDays: draft.autoClose ? draft.autoCloseAfterDays : null }
      if (editing) { const updated = await catalogService.updatePlan(editing.id, input); setPlans((current) => current.map((item) => item.id === updated.id ? updated : item)) }
      else { const created = await catalogService.createPlan(input); setPlans((current) => [created, ...current]) }
      setEditorOpen(false)
    } catch (error) { setPageError(error instanceof Error ? error.message : 'Plan could not be saved. Please try again.') }
    finally { setSaving(false) }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true); setPageError('')
    try { await catalogService.deletePlan(deleting.id); setPlans((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null) }
    catch (error) { setPageError(error instanceof Error ? error.message : 'Plan could not be deleted. Please try again.') }
    finally { setDeleteBusy(false) }
  }

  const columns: DataTableColumn<Plan>[] = [
    { key: 'name', header: 'Plan', sortValue: (item) => item.name, render: (item) => <div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{item.description || 'No description'}</p></div> },
    { key: 'price', header: 'Price', sortValue: (item) => item.price, render: (item) => <span className="font-semibold text-slate-800">{formatINR.format(item.price)}<span className="ml-1 font-normal text-slate-500">/ {intervalLabels[item.interval].toLowerCase()}</span></span> },
    { key: 'minimum', header: 'Minimum qty.', sortValue: (item) => item.minimumQuantity, render: (item) => item.minimumQuantity },
    { key: 'availability', header: 'Availability', render: (item) => <span className="text-xs text-slate-600">{item.availableFrom || item.availableUntil ? `${item.availableFrom || 'Any date'} – ${item.availableUntil || 'No end'}` : 'Always available'}</span> },
    { key: 'renewal', header: 'Renewal', render: (item) => <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.renewAutomatically ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.renewAutomatically ? 'Auto-renew' : 'Manual'}</span> },
    { key: 'actions', header: '', headerClassName: 'w-24', className: 'text-right', render: (item) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}><Pencil size={15} /></Button><Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)}><Trash2 size={15} /></Button></div> },
  ]

  return <PageContainer title="Plans" description="Configure billing schedules, availability, and subscription rules." actions={<Button onClick={openCreate}><Plus size={16} />Create plan</Button>}>
    {catalogService.source === 'preview' ? <PreviewNotice /> : null}
    {pageError ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Plan action failed" description={pageError} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry loading</Button>} /></div> : null}
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><h2 className="text-sm font-semibold text-slate-900">Subscription plans</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading plans…' : `${filtered.length} ${filtered.length === 1 ? 'plan' : 'plans'}`}</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search plans</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52" /></label><select aria-label="Filter plans by billing interval" value={intervalFilter} onChange={(event) => setIntervalFilter(event.target.value as 'all' | BillingInterval)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="all">All intervals</option>{Object.entries(intervalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {loading ? <StatePanel kind="loading" title="Loading plans" description="Fetching subscription plans." /> : pageError && plans.length === 0 ? <StatePanel kind="error" title="Plans unavailable" description={pageError} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query || intervalFilter !== 'all' ? 'No matching plans' : 'No plans yet'} emptyDescription={query || intervalFilter !== 'all' ? 'Try changing your search or filter.' : catalogService.source === 'preview' ? 'Create a plan to preview billing configuration. Preview records are temporary and not saved to the backend.' : 'Create a plan to make it available in the catalog.'} />}
    </Card>

    <Modal open={editorOpen} onClose={() => { if (!saving) setEditorOpen(false) }} title={editing ? 'Edit plan' : 'Create plan'} description="Set the billing schedule, availability window, and subscription behavior." className="sm:max-w-2xl">
      <form onSubmit={save} noValidate className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Plan name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} error={fieldErrors.name} placeholder="e.g. Growth monthly" autoFocus /><FormField label="Price (INR)" type="number" min="0" step="0.01" value={Number.isNaN(draft.price) ? '' : draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.price} placeholder="0.00" />
          <label className="space-y-1.5"><span className="block text-sm font-medium text-slate-700">Billing interval</span><select value={draft.interval} onChange={(event) => setDraft((current) => ({ ...current, interval: event.target.value as BillingInterval }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{Object.entries(intervalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <FormField label="Minimum quantity" type="number" min="1" step="1" value={Number.isNaN(draft.minimumQuantity) ? '' : draft.minimumQuantity} onChange={(event) => setDraft((current) => ({ ...current, minimumQuantity: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.minimumQuantity} />
        </div>
        <label className="block space-y-1.5"><span className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Describe what this plan includes..." className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
        <section><h3 className="mb-3 text-sm font-semibold text-slate-800">Availability</h3><div className="grid gap-4 sm:grid-cols-2"><FormField label="Available from" type="date" value={draft.availableFrom} onChange={(event) => setDraft((current) => ({ ...current, availableFrom: event.target.value }))} /><FormField label="Available until" type="date" value={draft.availableUntil} onChange={(event) => setDraft((current) => ({ ...current, availableUntil: event.target.value }))} error={fieldErrors.availableUntil} /></div><p className="mt-1.5 text-xs text-slate-500">Leave dates blank if the plan has no availability window.</p></section>
        <section><h3 className="mb-3 text-sm font-semibold text-slate-800">Subscription behavior</h3><div className="space-y-2.5">
          <div className="rounded-xl border border-slate-200 p-3.5"><ToggleField label="Auto-close" description="Automatically close the subscription after a configured number of days." checked={draft.autoClose} onChange={(value) => setDraft((current) => ({ ...current, autoClose: value }))} />{draft.autoClose ? <div className="mt-3 max-w-xs"><FormField label="Close after (days)" type="number" min="1" step="1" value={draft.autoCloseAfterDays ?? ''} onChange={(event) => setDraft((current) => ({ ...current, autoCloseAfterDays: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.autoCloseAfterDays} /></div> : null}</div>
          <ToggleField label="Allow pause" description="Let customers pause an active subscription." checked={draft.allowPause} onChange={(value) => setDraft((current) => ({ ...current, allowPause: value }))} />
          <ToggleField label="Allow early close" description="Let customers end their subscription before the current period finishes." checked={draft.allowEarlyClose} onChange={(value) => setDraft((current) => ({ ...current, allowEarlyClose: value }))} />
          <ToggleField label="Automatic renewal" description="Renew the subscription at the end of each billing interval." checked={draft.renewAutomatically} onChange={(value) => setDraft((current) => ({ ...current, renewAutomatically: value }))} />
        </div></section>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => { if (!deleteBusy) setDeleting(null) }} onConfirm={() => void confirmDelete()} busy={deleteBusy} title="Delete plan?" description={`“${deleting?.name ?? 'This plan'}” will be removed from the catalog. Existing subscriptions may be affected.`} confirmLabel="Delete plan" />
  </PageContainer>
}
