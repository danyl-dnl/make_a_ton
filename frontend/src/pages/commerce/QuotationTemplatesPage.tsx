import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageContainer } from '../../components/layout/PageContainer'
import { ApiDependencyNotice } from '../../components/commerce/ApiDependencyNotice'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { commerceApi, commerceApiConfigured } from '../../lib/commerce-api'
import { formatINR } from '../../lib/format'
import type { QuoteLine, QuoteTemplate, QuoteTemplateInput } from '../../lib/commerce-types'

const emptyDraft = (): QuoteTemplateInput => ({ name: '', description: '', validityDays: 30, lines: [] })
const newLine = (): QuoteLine => ({ id: globalThis.crypto?.randomUUID?.() ?? `line-${Date.now()}`, kind: 'product', name: '', quantity: 1, unitPrice: 0, taxRate: 0 })

function validate(draft: QuoteTemplateInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.name.trim().length < 2) errors.name = 'Enter a template name with at least 2 characters.'
  if (!Number.isInteger(draft.validityDays) || draft.validityDays < 1) errors.validity = 'Validity must be a whole number of at least 1 day.'
  if (draft.lines.length === 0) errors.lines = 'Add at least one plan or product line.'
  draft.lines.forEach((line, index) => {
    if (!line.name.trim()) errors[`line-${index}-name`] = 'Enter an item name.'
    if (!Number.isInteger(line.quantity) || line.quantity < 1) errors[`line-${index}-quantity`] = 'Quantity must be a whole number of at least 1.'
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) errors[`line-${index}-price`] = 'Enter a valid non-negative unit price.'
    if (!Number.isFinite(line.taxRate) || line.taxRate < 0) errors[`line-${index}-tax`] = 'Enter a valid non-negative tax rate.'
  })
  return errors
}

export function QuotationTemplatesPage() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<QuoteTemplate | null>(null)
  const [draft, setDraft] = useState<QuoteTemplateInput>(emptyDraft())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<QuoteTemplate | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => { setLoading(true); setError(''); try { setTemplates(await commerceApi.listTemplates()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Templates could not be loaded.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  function create() { setEditing(null); setDraft(emptyDraft()); setErrors({}); setFormError(''); setError(''); setEditorOpen(true) }
  function edit(template: QuoteTemplate) { const { id: _id, updatedAt: _updated, ...input } = template; setEditing(template); setDraft(input); setErrors({}); setFormError(''); setError(''); setEditorOpen(true) }
  function setLine(index: number, changes: Partial<QuoteLine>) { setDraft((current) => ({ ...current, lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...changes } : line) })) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next = validate(draft); setErrors(next); if (Object.keys(next).length) return
    setSaving(true); setFormError(''); setError('')
    try {
      const input = { ...draft, name: draft.name.trim(), description: draft.description.trim(), lines: draft.lines.map((line) => ({ ...line, name: line.name.trim() })) }
      if (editing) { const item = await commerceApi.updateTemplate(editing.id, input); setTemplates((current) => current.map((row) => row.id === item.id ? item : row)) }
      else { const item = await commerceApi.createTemplate(input); setTemplates((current) => [item, ...current]) }
      setEditorOpen(false)
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Template could not be saved.') }
    finally { setSaving(false) }
  }
  async function remove() { if (!deleting) return; setDeleteBusy(true); setError(''); try { await commerceApi.deleteTemplate(deleting.id); setTemplates((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Template could not be deleted.'); setDeleting(null) } finally { setDeleteBusy(false) } }

  const columns: DataTableColumn<QuoteTemplate>[] = [
    { key: 'name', header: 'Template', render: (item) => <div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">{item.description || 'No description'}</p></div> },
    { key: 'validity', header: 'Validity', render: (item) => `${item.validityDays} days` },
    { key: 'lines', header: 'Lines', render: (item) => `${item.lines.length} ${item.lines.length === 1 ? 'line' : 'lines'}` },
    { key: 'amount', header: 'Template total', className: 'font-medium', render: (item) => formatINR.format(item.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 + line.taxRate / 100), 0)) },
    { key: 'actions', header: '', className: 'text-right', render: (item) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${item.name}`} onClick={() => edit(item)}><Pencil size={15} /></Button><Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)}><Trash2 size={15} /></Button></div> },
  ]

  return <PageContainer title="Quotation templates" description="Create reusable quotation layouts with plan and product lines and a default validity period." actions={<><Link to="/quotations" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">View quotations</Link><Button onClick={create}><Plus size={16} />Create template</Button></>}>
    {!commerceApiConfigured ? <ApiDependencyNotice /> : null}
    {error && templates.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Template request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="border-b border-slate-100 p-4 sm:px-5"><h2 className="text-sm font-semibold text-slate-900">Saved templates</h2><p className="mt-1 text-xs text-slate-500">Reusable starting points for customer quotations.</p></div>
      {loading ? <StatePanel kind="loading" title="Loading templates" description="Fetching quotation templates from the backend." /> : error && !templates.length ? <StatePanel kind="error" title="Templates unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={templates} getRowKey={(item) => item.id} emptyTitle="No quotation templates" emptyDescription={commerceApiConfigured ? 'No templates were returned by the backend.' : 'Templates will appear here after the quotation API is configured.'} />}
    </Card>
    <Modal open={editorOpen} onClose={() => { if (!saving) setEditorOpen(false) }} title={editing ? 'Edit quotation template' : 'Create quotation template'} description="Set the default validity period and add plan or product lines." className="sm:max-w-3xl">
      <form onSubmit={save} noValidate className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Template name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} error={errors.name} placeholder="e.g. Annual service proposal" autoFocus /><FormField label="Quotation validity (days)" type="number" min="1" step="1" value={Number.isNaN(draft.validityDays) ? '' : draft.validityDays} onChange={(event) => setDraft((current) => ({ ...current, validityDays: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={errors.validity} /></div>
        <label className="block space-y-1.5"><span className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Internal notes about this template" /></label>
        <section className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Plan and product lines</h3><p className="mt-0.5 text-xs text-slate-500">Enter the item, quantity, unit price, and tax rate for each line.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setDraft((current) => ({ ...current, lines: [...current.lines, newLine()] }))}><FilePlus2 size={14} />Add line</Button></div>
          {draft.lines.length ? <div className="space-y-3">{draft.lines.map((line, index) => <div key={line.id ?? index} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[110px_1fr_85px_130px_105px_36px] sm:items-end"><label className="space-y-1.5"><span className="block text-xs font-medium text-slate-600">Line type</span><select value={line.kind} onChange={(event) => setLine(index, { kind: event.target.value as QuoteLine['kind'] })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"><option value="product">Product</option><option value="plan">Plan</option></select></label><FormField label="Item name" value={line.name} onChange={(event) => setLine(index, { name: event.target.value })} error={errors[`line-${index}-name`]} placeholder="Catalog item" /><FormField label="Quantity" type="number" min="1" step="1" value={Number.isNaN(line.quantity) ? '' : line.quantity} onChange={(event) => setLine(index, { quantity: event.target.value === '' ? Number.NaN : Number(event.target.value) })} error={errors[`line-${index}-quantity`]} /><FormField label="Unit price (INR)" type="number" min="0" step="0.01" value={Number.isNaN(line.unitPrice) ? '' : line.unitPrice} onChange={(event) => setLine(index, { unitPrice: event.target.value === '' ? Number.NaN : Number(event.target.value) })} error={errors[`line-${index}-price`]} /><FormField label="Tax (%)" type="number" min="0" step="0.01" value={Number.isNaN(line.taxRate) ? '' : line.taxRate} onChange={(event) => setLine(index, { taxRate: event.target.value === '' ? Number.NaN : Number(event.target.value) })} error={errors[`line-${index}-tax`]} /><Button type="button" variant="ghost" size="icon" className="size-10 text-rose-600" aria-label={`Remove line ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))}><X size={16} /></Button><p className="text-xs text-slate-500 sm:col-span-6">Line amount with tax: {formatINR.format(line.quantity * line.unitPrice * (1 + line.taxRate / 100))}</p></div>)}</div> : <p className="text-xs text-slate-500">No lines yet.</p>}
          {errors.lines ? <p className="mt-3 text-xs text-rose-600">{errors.lines}</p> : null}
        </section>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save template' : 'Create template'}</Button></div>
        {formError ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{formError}</p> : null}
        {!commerceApiConfigured ? <p className="text-xs text-amber-800">Saving is unavailable until the quotation API is configured. Draft values will not be kept locally.</p> : null}
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => { if (!deleteBusy) setDeleting(null) }} onConfirm={() => void remove()} busy={deleteBusy} title="Delete quotation template?" description={`“${deleting?.name ?? 'This template'}” will be deleted from the backend.`} confirmLabel="Delete template" />
  </PageContainer>
}
