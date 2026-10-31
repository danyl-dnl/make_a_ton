import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import { BillingApiNotice } from '../../components/billing/BillingApiNotice'
import { DiscountStatusBadge } from '../../components/billing/DiscountStatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { billingApi, billingApiConfigured } from '../../lib/billing-api'
import type { Discount, DiscountInput, DiscountTarget, DiscountType } from '../../lib/billing-types'
import { formatINR } from '../../lib/format'

const blankDiscount = (): DiscountInput => ({ name: '', code: '', description: '', type: 'percentage', value: 0, minimumPurchase: null, minimumQuantity: null, startsAt: null, endsAt: null, usageLimit: null, applicableTo: [], currency: 'INR' })

function validate(input: DiscountInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.name.trim().length < 2) errors.name = 'Enter a discount name with at least 2 characters.'
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(input.code.trim())) errors.code = 'Use 3–32 letters, numbers, dashes, or underscores.'
  if (!Number.isFinite(input.value) || input.value <= 0 || (input.type === 'percentage' && input.value > 100)) errors.value = input.type === 'percentage' ? 'Enter a percentage greater than 0 and no more than 100.' : 'Enter a fixed discount greater than 0.'
  if (input.minimumPurchase !== null && (!Number.isFinite(input.minimumPurchase) || input.minimumPurchase < 0)) errors.minimumPurchase = 'Enter a valid, non-negative minimum purchase.'
  if (input.minimumQuantity !== null && (!Number.isInteger(input.minimumQuantity) || input.minimumQuantity < 1)) errors.minimumQuantity = 'Enter a whole quantity of at least 1.'
  if (input.usageLimit !== null && (!Number.isInteger(input.usageLimit) || input.usageLimit < 1)) errors.usageLimit = 'Usage limit must be a whole number of at least 1.'
  if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) errors.endsAt = 'End date must be on or after the start date.'
  return errors
}

export function DiscountsPage() {
  const [items, setItems] = useState<Discount[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false); const [editing, setEditing] = useState<Discount | null>(null); const [draft, setDraft] = useState<DiscountInput>(blankDiscount()); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); const [formError, setFormError] = useState(''); const [saving, setSaving] = useState(false)
  const [targets, setTargets] = useState<DiscountTarget[]>([]); const [targetsLoading, setTargetsLoading] = useState(false); const [targetsError, setTargetsError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await billingApi.listDiscounts()) } catch (cause) { setItems([]); setError(cause instanceof Error ? cause.message : 'Discounts could not be loaded.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.code} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query])

  async function openCreate() { setEditing(null); setDraft(blankDiscount()); setFieldErrors({}); setFormError(''); setError(''); setSuccess(''); setTargetsError(''); setTargets([]); setEditorOpen(true); await loadTargets() }
  async function openEdit(item: Discount) { const { id: _id, usageCount: _usageCount, status: _status, ...input } = item; setEditing(item); setDraft(input); setFieldErrors({}); setFormError(''); setError(''); setSuccess(''); setTargetsError(''); setTargets([]); setEditorOpen(true); await loadTargets() }
  async function loadTargets() { if (!billingApiConfigured) return; setTargetsLoading(true); try { setTargets(await billingApi.listDiscountTargets()) } catch (cause) { setTargetsError(cause instanceof Error ? cause.message : 'Applicable products and subscriptions could not be loaded.') } finally { setTargetsLoading(false) } }
  function toggleTarget(target: DiscountTarget) { setDraft((current) => { const found = current.applicableTo.some((item) => item.id === target.id && item.type === target.type); return { ...current, applicableTo: found ? current.applicableTo.filter((item) => !(item.id === target.id && item.type === target.type)) : [...current.applicableTo, target] } }) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const errors = validate(draft); setFieldErrors(errors); if (Object.keys(errors).length) return
    setSaving(true); setFormError(''); setSuccess('')
    try {
      const input = { ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase(), description: draft.description.trim() }
      if (editing) { const updated = await billingApi.updateDiscount(editing.id, input); setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); setSuccess('Discount changes saved to the backend.') }
      else { const created = await billingApi.createDiscount(input); setItems((current) => [created, ...current]); setSuccess('Discount created in the backend.') }
      setEditorOpen(false)
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Discount could not be saved.') }
    finally { setSaving(false) }
  }

  const columns: DataTableColumn<Discount>[] = [
    { key: 'discount', header: 'Discount', sortValue: (item) => item.name, render: (item) => <div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{item.code}</p></div> },
    { key: 'value', header: 'Value', sortValue: (item) => item.value, render: (item) => <span className="font-medium text-slate-800">{item.type === 'percentage' ? `${item.value}%` : formatINR.format(item.value)}</span> },
    { key: 'scope', header: 'Applies to', render: (item) => item.applicableTo.length ? <div className="flex max-w-xs flex-wrap gap-1">{item.applicableTo.slice(0, 3).map((target) => <span key={`${target.type}-${target.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{target.name}</span>)}{item.applicableTo.length > 3 ? <span className="text-xs text-slate-500">+{item.applicableTo.length - 3} more</span> : null}</div> : <span className="text-xs text-slate-500">All eligible items</span> },
    { key: 'validity', header: 'Validity', render: (item) => <span className="text-xs text-slate-600">{formatDate(item.startsAt)} – {formatDate(item.endsAt)}</span> },
    { key: 'usage', header: 'Usage', render: (item) => <span className="tabular-nums text-slate-700">{item.usageCount}{item.usageLimit === null ? ' used · no limit' : ` / ${item.usageLimit}`}</span> },
    { key: 'status', header: 'Status', render: (item) => <DiscountStatusBadge status={item.status} /> },
    { key: 'edit', header: '', className: 'text-right', render: (item) => <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${item.name}`} onClick={() => void openEdit(item)}><Pencil size={15} /></Button> },
  ]

  return <PageContainer title="Discounts" description="Configure discount rules, eligibility, validity, and current usage." actions={<Button onClick={() => void openCreate()}><Plus size={16} />Create discount</Button>}>
    {!billingApiConfigured ? <BillingApiNotice /> : null}
    {success ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-white"><StatePanel kind="success" title="Discount saved" description={success} compact /></div> : null}
    {error && items.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Discount request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-slate-900">Discount rules</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading…' : `${filtered.length} records`}</p></div><label className="relative"><span className="sr-only">Search discounts</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or code..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" /></label></div>
      {loading ? <StatePanel kind="loading" title="Loading discounts" description="Fetching discount rules from the backend." /> : error && !items.length ? <StatePanel kind="error" title="Discounts unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query ? 'No matching discounts' : 'No discounts yet'} emptyDescription={billingApiConfigured ? 'No discounts were returned by the backend.' : 'Discount records will appear after the discount API is configured.'} />}
    </Card>
    <Modal open={editorOpen} onClose={() => { if (!saving) setEditorOpen(false) }} title={editing ? 'Edit discount' : 'Create discount'} description="Set the offer value, eligibility requirements, and usage window." className="sm:max-w-2xl">
      <form onSubmit={save} noValidate className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Discount name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} error={fieldErrors.name} placeholder="e.g. New customer offer" autoFocus /><FormField label="Discount code" value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} error={fieldErrors.code} placeholder="WELCOME10" /></div>
        <label className="block space-y-1.5"><span className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Describe the offer" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="block text-sm font-medium text-slate-700">Discount type</span><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as DiscountType }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="fixed">Fixed amount (INR)</option><option value="percentage">Percentage</option></select></label><FormField label={draft.type === 'fixed' ? 'Discount amount (INR)' : 'Discount percentage (%)'} type="number" min="0" step="0.01" max={draft.type === 'percentage' ? 100 : undefined} value={Number.isNaN(draft.value) ? '' : draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.value} /></div>
        <section><h3 className="mb-3 text-sm font-semibold text-slate-800">Eligibility requirements</h3><div className="grid gap-4 sm:grid-cols-2"><FormField label="Minimum purchase (INR)" type="number" min="0" step="0.01" value={draft.minimumPurchase ?? ''} onChange={(event) => setDraft((current) => ({ ...current, minimumPurchase: event.target.value === '' ? null : Number(event.target.value) }))} error={fieldErrors.minimumPurchase} placeholder="No minimum" /><FormField label="Minimum quantity" type="number" min="1" step="1" value={draft.minimumQuantity ?? ''} onChange={(event) => setDraft((current) => ({ ...current, minimumQuantity: event.target.value === '' ? null : Number(event.target.value) }))} error={fieldErrors.minimumQuantity} placeholder="No minimum" /></div></section>
        <section><h3 className="mb-3 text-sm font-semibold text-slate-800">Validity and usage</h3><div className="grid gap-4 sm:grid-cols-2"><FormField label="Starts on" type="date" value={draft.startsAt ?? ''} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value || null }))} /><FormField label="Ends on" type="date" value={draft.endsAt ?? ''} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value || null }))} error={fieldErrors.endsAt} /><FormField label="Usage limit" type="number" min="1" step="1" value={draft.usageLimit ?? ''} onChange={(event) => setDraft((current) => ({ ...current, usageLimit: event.target.value === '' ? null : Number(event.target.value) }))} error={fieldErrors.usageLimit} placeholder="Unlimited" /></div>{editing ? <p className="mt-2 text-xs text-slate-500">Current usage: <span className="font-semibold text-slate-700">{editing.usageCount}</span> redemption{editing.usageCount === 1 ? '' : 's'} (reported by the backend).</p> : null}</section>
        <section><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Applicable products or subscriptions</h3><p className="mt-0.5 text-xs text-slate-500">Choose specific eligible records. Leave unselected for all eligible items.</p></div></div>
          {targetsLoading ? <StatePanel kind="loading" compact title="Loading eligible items" description="Fetching products and subscriptions." /> : targetsError ? <StatePanel kind="error" compact title="Eligible items unavailable" description={targetsError} action={<Button type="button" variant="outline" size="sm" onClick={() => void loadTargets()}>Retry</Button>} /> : targets.length ? <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">{targets.map((target) => <label key={`${target.type}-${target.id}`} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50"><input type="checkbox" checked={draft.applicableTo.some((selected) => selected.id === target.id && selected.type === target.type)} onChange={() => toggleTarget(target)} className="size-4 accent-blue-600" /><span className="min-w-0 flex-1 truncate text-sm text-slate-700">{target.name}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{target.type}</span></label>)}</div> : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{billingApiConfigured ? 'No eligible products or subscriptions were returned.' : 'Connect the backend to load eligible products and subscriptions.'}</p>}
        </section>
        {formError ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{formError}</p> : null}
        {!billingApiConfigured ? <p className="text-xs text-amber-800">Saving is unavailable until the discount API is configured. No draft is saved locally.</p> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create discount'}</Button></div>
      </form>
    </Modal>
  </PageContainer>
}

function formatDate(value: string | null) { if (!value) return 'No date limit'; const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) }
