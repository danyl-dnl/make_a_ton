import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { BillingApiNotice } from '../../components/billing/BillingApiNotice'
import { InvoicePaymentBadge, PaymentStatusBadge } from '../../components/finance/PaymentStatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatePanel } from '../../components/ui/StatePanel'
import { financeApi, financeApiConfigured } from '../../lib/finance-api'
import { formatDate, formatMoney } from '../../lib/billing-format'
import type { InvoicePaymentStatus, Payment, PaymentInput, PaymentMethod, PaymentStatus, PaymentInvoiceOption } from '../../lib/finance-types'

const methodLabels: Record<PaymentMethod, string> = { cash: 'Cash', bank_transfer: 'Bank transfer', card: 'Card', upi: 'UPI', cheque: 'Cheque', other: 'Other' }
const paymentStatuses: { value: 'all' | PaymentStatus; label: string }[] = [{ value: 'all', label: 'All payment statuses' }, { value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }]
const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [query, setQuery] = useState(''); const [status, setStatus] = useState<'all' | PaymentStatus>('all'); const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [modalOpen, setModalOpen] = useState(false); const [invoiceOptions, setInvoiceOptions] = useState<PaymentInvoiceOption[]>([]); const [invoiceLoading, setInvoiceLoading] = useState(false); const [invoiceError, setInvoiceError] = useState('')
  const [draft, setDraft] = useState<PaymentInput>({ invoiceId: '', method: 'bank_transfer', amount: 0, date: today(), note: '' }); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); const [formError, setFormError] = useState(''); const [saving, setSaving] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<Payment[]>([]); const [historyLoading, setHistoryLoading] = useState(false); const [historyError, setHistoryError] = useState(''); const [success, setSuccess] = useState<{ invoiceNumber: string; invoiceStatus: InvoicePaymentStatus } | null>(null)

  const load = useCallback(async () => { setLoading(true); setError(''); if (from && to && from > to) { setPayments([]); setError('The start date must be on or before the end date.'); setLoading(false); return } try { setPayments(await financeApi.listPayments({ from: from || undefined, to: to || undefined, status })) } catch (cause) { setPayments([]); setError(cause instanceof Error ? cause.message : 'Payments could not be loaded.') } finally { setLoading(false) } }, [from, to, status])
  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => payments.filter((payment) => `${payment.invoiceNumber} ${payment.customerName} ${payment.note}`.toLowerCase().includes(query.trim().toLowerCase()) && (!from || payment.date.slice(0, 10) >= from) && (!to || payment.date.slice(0, 10) <= to) && (status === 'all' || payment.status === status)), [payments, query, from, to, status])

  async function openPaymentForm() {
    setDraft({ invoiceId: '', method: 'bank_transfer', amount: 0, date: today(), note: '' }); setFieldErrors({}); setFormError(''); setInvoiceError(''); setInvoiceOptions([]); setSelectedHistory([]); setHistoryError(''); setSuccess(null); setModalOpen(true); setInvoiceLoading(true)
    try { setInvoiceOptions(await financeApi.payableInvoices()) } catch (cause) { setInvoiceError(cause instanceof Error ? cause.message : 'Invoices could not be loaded.') }
    finally { setInvoiceLoading(false) }
  }

  async function chooseInvoice(invoiceId: string) {
    setDraft((current) => ({ ...current, invoiceId })); setSelectedHistory([]); setHistoryError('')
    if (!invoiceId) return
    setHistoryLoading(true)
    try { setSelectedHistory(await financeApi.invoicePayments(invoiceId)) } catch (cause) { setHistoryError(cause instanceof Error ? cause.message : 'Invoice payment history could not be loaded.') }
    finally { setHistoryLoading(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFieldErrors({}); setFormError('')
    const nextErrors: Record<string, string> = {}
    if (!draft.invoiceId) nextErrors.invoiceId = 'Select an invoice.'
    if (!Number.isFinite(draft.amount) || draft.amount <= 0) nextErrors.amount = 'Enter a payment amount greater than zero.'
    if (!draft.date) nextErrors.date = 'Select the payment date.'
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); return }
    setSaving(true)
    try {
      const result = await financeApi.recordPayment({ ...draft, note: draft.note.trim() })
      setSuccess({ invoiceNumber: result.invoiceNumber, invoiceStatus: result.invoicePaymentStatus })
      setModalOpen(false)
      await load()
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Payment could not be recorded.') }
    finally { setSaving(false) }
  }

  const columns: DataTableColumn<Payment>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'invoice', header: 'Invoice', render: (row) => <Link to={`/invoices/${encodeURIComponent(row.invoiceId)}`} className="font-semibold text-blue-700 hover:text-blue-800">{row.invoiceNumber}</Link> },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'method', header: 'Method', render: (row) => methodLabels[row.method] },
    { key: 'amount', header: 'Payment amount', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (row) => formatMoney(row.amount, row.currency) },
    { key: 'status', header: 'Payment status', render: (row) => <PaymentStatusBadge status={row.status} /> },
    { key: 'invoiceStatus', header: 'Invoice balance', render: (row) => <InvoicePaymentBadge status={row.invoicePaymentStatus} /> },
  ]

  const selectedInvoice = invoiceOptions.find((invoice) => invoice.id === draft.invoiceId)

  return <PageContainer title="Payments" description="Review payment activity or record a payment against an outstanding invoice." actions={<Button onClick={() => void openPaymentForm()}><Plus size={16} />Record payment</Button>}>
    {!financeApiConfigured ? <BillingApiNotice /> : null}
    {success ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-white"><StatePanel kind="success" title="Payment recorded" description={`Payment for ${success.invoiceNumber} was accepted by the backend. The invoice is now reported as ${success.invoiceStatus === 'paid' ? 'paid in full' : success.invoiceStatus === 'partially_paid' ? 'partially paid' : 'unpaid'} by the backend.`} compact action={<InvoicePaymentBadge status={success.invoiceStatus} />} /></div> : null}
    {error && payments.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Payment request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-slate-900">Payment records</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading…' : `${visible.length} records`}</p></div><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><label className="relative"><span className="sr-only">Search payments</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice or customer..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56" /></label><label className="flex items-center gap-1.5 text-xs text-slate-500">From<input aria-label="Payment start date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs" /></label><label className="flex items-center gap-1.5 text-xs text-slate-500">To<input aria-label="Payment end date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs" /></label><select aria-label="Filter payment status" value={status} onChange={(event) => setStatus(event.target.value as 'all' | PaymentStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs">{paymentStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
      {loading ? <PaymentTableSkeleton /> : error && !payments.length ? <StatePanel kind="error" title="Payments unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={visible} getRowKey={(row) => row.id} emptyTitle="No payments found" emptyDescription={query || status !== 'all' || from || to ? 'No records match the selected search, date, and status filters.' : 'Payment records will appear here when returned by the backend.'} />}
    </Card>

    <Modal open={modalOpen} onClose={() => { if (!saving) setModalOpen(false) }} title="Record payment" description="Record an incoming payment against an outstanding invoice." className="sm:max-w-xl">
      <form onSubmit={submit} noValidate className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
        <div className="space-y-1.5"><label htmlFor="payment-invoice" className="block text-sm font-medium text-slate-700">Invoice</label><select id="payment-invoice" value={draft.invoiceId} onChange={(event) => { setFieldErrors((current) => ({ ...current, invoiceId: '' })); void chooseInvoice(event.target.value) }} disabled={invoiceLoading || saving} aria-invalid={Boolean(fieldErrors.invoiceId)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="">{invoiceLoading ? 'Loading payable invoices…' : 'Select an invoice'}</option>{invoiceOptions.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} · {invoice.customerName} · due {formatMoney(invoice.amountDue, invoice.currency)}</option>)}</select>{fieldErrors.invoiceId ? <p className="text-xs text-rose-600">{fieldErrors.invoiceId}</p> : null}{invoiceError ? <p role="alert" className="text-xs text-rose-600">{invoiceError}</p> : null}{!invoiceLoading && !invoiceOptions.length && !invoiceError ? <p className="text-xs text-slate-500">No payable invoices were returned by the backend.</p> : null}{selectedInvoice ? <p className="text-xs text-slate-500">Outstanding amount reported by the backend: <span className="font-semibold text-slate-700">{formatMoney(selectedInvoice.amountDue, selectedInvoice.currency)}</span></p> : null}</div>
        {draft.invoiceId ? <section className="rounded-xl border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment history for this invoice</h3>{historyLoading ? <span className="text-[11px] text-slate-400">Loading…</span> : null}</div>{historyError ? <p role="alert" className="text-xs text-rose-600">{historyError}</p> : historyLoading ? <Skeleton className="h-8 w-full" /> : selectedHistory.length ? <div className="space-y-2">{selectedHistory.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-600">{formatDate(payment.date)} · {methodLabels[payment.method]}</span><span className="font-medium tabular-nums text-slate-800">{formatMoney(payment.amount, payment.currency)} <PaymentStatusBadge status={payment.status} /></span></div>)}</div> : <p className="text-xs text-slate-500">No previous payments returned.</p>}</section> : null}
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="block text-sm font-medium text-slate-700">Payment method</span><select value={draft.method} onChange={(event) => setDraft((current) => ({ ...current, method: event.target.value as PaymentMethod }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm"><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="upi">UPI</option><option value="cheque">Cheque</option><option value="other">Other</option></select></label><FormField label="Payment amount" type="number" min="0.01" step="0.01" value={Number.isNaN(draft.amount) ? '' : draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value === '' ? Number.NaN : Number(event.target.value) }))} error={fieldErrors.amount} placeholder="0.00" />
          <FormField label="Payment date" type="date" value={draft.date} onChange={(event) => { setFieldErrors((current) => ({ ...current, date: '' })); setDraft((current) => ({ ...current, date: event.target.value })) }} error={fieldErrors.date} />
        </div>
        <label className="block space-y-1.5"><span className="block text-sm font-medium text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={2} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Reference or payment note" /></label>
        {formError ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{formError}</p> : null}
        {!financeApiConfigured ? <p className="text-xs text-amber-800">Payment recording is unavailable until the backend API is configured. Nothing is stored locally.</p> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving || invoiceLoading || !invoiceOptions.length}>{saving ? 'Recording…' : 'Record payment'}</Button></div>
      </form>
    </Modal>
  </PageContainer>
}

function PaymentTableSkeleton() { return <div className="space-y-5 p-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex gap-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /></div>)}</div> }
