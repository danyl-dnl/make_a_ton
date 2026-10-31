import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
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
import type { Product, ProductInput, ProductType, ProductVariant } from '../../lib/catalog-types'

const blankProduct = (): ProductInput => ({ name: '', type: 'service', salesPrice: 0, costPrice: 0, notes: '', variants: [] })
const typeLabels: Record<ProductType, string> = { service: 'Service', physical: 'Physical', digital: 'Digital' }

function productErrors(input: ProductInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.name.trim().length < 2) errors.name = 'Enter a product name with at least 2 characters.'
  if (!Number.isFinite(input.salesPrice) || input.salesPrice < 0) errors.salesPrice = 'Enter a valid, non-negative sales price.'
  if (!Number.isFinite(input.costPrice) || input.costPrice < 0) errors.costPrice = 'Enter a valid, non-negative cost price.'
  input.variants.forEach((variant) => {
    if (!variant.name.trim()) errors[`variant-${variant.id}-name`] = 'Enter a variant name.'
    if (!Number.isFinite(variant.additionalPrice) || variant.additionalPrice < 0) errors[`variant-${variant.id}-price`] = 'Enter a valid, non-negative additional price.'
  })
  return errors
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState<ProductInput>(blankProduct())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setPageError('')
    try { const result = await catalogService.listProducts(); setProducts(result.items) }
    catch (error) { setProducts([]); setPageError(error instanceof Error ? error.message : 'Products could not be loaded. Please try again.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => products.filter((item) => {
    const matchesQuery = `${item.name} ${item.notes} ${item.variants.map((variant) => `${variant.name} ${variant.sku}`).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (typeFilter === 'all' || item.type === typeFilter)
  }), [products, query, typeFilter])

  function openCreate() { setEditing(null); setDraft(blankProduct()); setFieldErrors({}); setEditorOpen(true) }
  function openEdit(product: Product) { const { id: _id, createdAt: _createdAt, ...input } = product; setEditing(product); setDraft(input); setFieldErrors({}); setEditorOpen(true) }
  function addVariant() { setDraft((current) => ({ ...current, variants: [...current.variants, { id: globalThis.crypto?.randomUUID?.() ?? `variant-${Date.now()}`, name: '', sku: '', additionalPrice: 0 }] })) }
  function updateVariant(id: string, changes: Partial<ProductVariant>) { setDraft((current) => ({ ...current, variants: current.variants.map((variant) => variant.id === id ? { ...variant, ...changes } : variant) })) }
  function removeVariant(id: string) { setDraft((current) => ({ ...current, variants: current.variants.filter((variant) => variant.id !== id) })) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const errors = productErrors(draft); setFieldErrors(errors); if (Object.keys(errors).length) return
    setSaving(true); setPageError('')
    try {
      if (editing) { const updated = await catalogService.updateProduct(editing.id, { ...draft, name: draft.name.trim() }); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)) }
      else { const created = await catalogService.createProduct({ ...draft, name: draft.name.trim() }); setProducts((current) => [created, ...current]) }
      setEditorOpen(false)
    } catch (error) { setPageError(error instanceof Error ? error.message : 'Product could not be saved. Please try again.') }
    finally { setSaving(false) }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true); setPageError('')
    try { await catalogService.deleteProduct(deleting.id); setProducts((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null) }
    catch (error) { setPageError(error instanceof Error ? error.message : 'Product could not be deleted. Please try again.') }
    finally { setDeleteBusy(false) }
  }

  const columns: DataTableColumn<Product>[] = [
    { key: 'name', header: 'Product', sortValue: (item) => item.name, render: (item) => <div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">{item.variants.length} {item.variants.length === 1 ? 'variant' : 'variants'}</p></div> },
    { key: 'type', header: 'Type', sortValue: (item) => typeLabels[item.type], render: (item) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{typeLabels[item.type]}</span> },
    { key: 'sales', header: 'Sales price', sortValue: (item) => item.salesPrice, render: (item) => <span className="font-medium text-slate-800">{formatINR.format(item.salesPrice)}</span> },
    { key: 'cost', header: 'Cost price', sortValue: (item) => item.costPrice, render: (item) => <span className="text-slate-600">{formatINR.format(item.costPrice)}</span> },
    { key: 'variants', header: 'Variant additions', render: (item) => item.variants.length ? <span className="text-xs text-slate-600">{item.variants.map((variant) => `${variant.name} +${formatINR.format(variant.additionalPrice)}`).join(' · ')}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: 'actions', header: '', headerClassName: 'w-24', className: 'text-right', render: (item) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}><Pencil size={15} /></Button><Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)}><Trash2 size={15} /></Button></div> },
  ]

  return <PageContainer title="Products" description="Manage your product catalog, pricing, and variants." actions={<Button onClick={openCreate}><Plus size={16} />Add product</Button>}>
    {catalogService.source === 'preview' ? <PreviewNotice /> : null}
    {pageError ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Product action failed" description={pageError} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry loading</Button>} /></div> : null}
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><h2 className="text-sm font-semibold text-slate-900">Product catalog</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading products…' : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`}</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative"><span className="sr-only">Search products</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52" /></label>
          <select aria-label="Filter products by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | ProductType)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="all">All types</option><option value="service">Service</option><option value="physical">Physical</option><option value="digital">Digital</option></select>
        </div>
      </div>
      {loading ? <StatePanel kind="loading" title="Loading products" description="Fetching product records." /> : pageError && products.length === 0 ? <StatePanel kind="error" title="Products unavailable" description={pageError} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query || typeFilter !== 'all' ? 'No matching products' : 'No products yet'} emptyDescription={query || typeFilter !== 'all' ? 'Try changing your search or filter.' : catalogService.source === 'preview' ? 'Add a product to preview catalog management. Preview records are temporary and not saved to the backend.' : 'Create your first product to populate the catalog.'} />}
    </Card>

    <Modal open={editorOpen} onClose={() => { if (!saving) setEditorOpen(false) }} title={editing ? 'Edit product' : 'Add product'} description="Product details and any purchasable variants." className="sm:max-w-2xl">
      <form onSubmit={save} noValidate className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Product name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} error={fieldErrors.name} placeholder="e.g. Professional support" autoFocus /><label className="space-y-1.5"><span className="block text-sm font-medium text-slate-700">Product type</span><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as ProductType }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="service">Service</option><option value="physical">Physical</option><option value="digital">Digital</option></select></label>
          <FormField label="Sales price (INR)" type="number" min="0" step="0.01" value={Number.isNaN(draft.salesPrice) ? '' : draft.salesPrice} onChange={(event) => setDraft((current) => ({ ...current, salesPrice: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.salesPrice} placeholder="0.00" />
          <FormField label="Cost price (INR)" type="number" min="0" step="0.01" value={Number.isNaN(draft.costPrice) ? '' : draft.costPrice} onChange={(event) => setDraft((current) => ({ ...current, costPrice: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.costPrice} placeholder="0.00" />
        </div>
        <label className="block space-y-1.5"><span className="block text-sm font-medium text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Add internal product notes..." className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
        <section className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">Variants</h3><p className="mt-0.5 text-xs text-slate-500">Optional options with prices added to the base sales price.</p></div><Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus size={14} />Add variant</Button></div>
          {draft.variants.length ? <div className="space-y-3">{draft.variants.map((variant, index) => <div key={variant.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_150px_36px] sm:items-end"><FormField label={`Variant ${index + 1} name`} value={variant.name} onChange={(event) => updateVariant(variant.id, { name: event.target.value })} error={fieldErrors[`variant-${variant.id}-name`]} placeholder="e.g. Extra seat" /><FormField label="SKU (optional)" value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value })} placeholder="SKU" /><FormField label="Additional (INR)" type="number" min="0" step="0.01" value={Number.isNaN(variant.additionalPrice) ? '' : variant.additionalPrice} onChange={(event) => updateVariant(variant.id, { additionalPrice: event.target.value === '' ? Number.NaN : Number(event.target.value) })} error={fieldErrors[`variant-${variant.id}-price`]} placeholder="0.00" /><Button type="button" variant="ghost" size="icon" className="size-10 text-slate-500 hover:text-rose-600" aria-label={`Remove variant ${variant.name || index + 1}`} onClick={() => removeVariant(variant.id)}><X size={16} /></Button><p className="text-xs text-slate-500 sm:col-span-4">Displayed price: {formatINR.format((Number.isNaN(draft.salesPrice) ? 0 : draft.salesPrice) + (Number.isNaN(variant.additionalPrice) ? 0 : variant.additionalPrice))}</p></div>)}</div> : <p className="text-xs text-slate-400">No variants added.</p>}
        </section>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => { if (!deleteBusy) setDeleting(null) }} onConfirm={() => void confirmDelete()} busy={deleteBusy} title="Delete product?" description={`“${deleting?.name ?? 'This product'}” will be removed from the catalog. This action cannot be undone.`} confirmLabel="Delete product" />
  </PageContainer>
}
