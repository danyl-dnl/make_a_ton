import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, Mail, Printer, UserRound } from 'lucide-react'
import { InvoiceStatusBadge } from '../../components/billing/InvoiceStatusBadge'
import { BillingApiNotice } from '../../components/billing/BillingApiNotice'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { StatePanel } from '../../components/ui/StatePanel'
import { billingApi, billingApiConfigured } from '../../lib/billing-api'
import type { Invoice, InvoiceLine } from '../../lib/billing-types'
import { formatDate, formatMoney } from '../../lib/billing-format'
import { financeApi } from '../../lib/finance-api'
import type { Payment } from '../../lib/finance-types'
import { PaymentStatusBadge, InvoicePaymentBadge } from '../../components/finance/PaymentStatusBadge'

export function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState<'confirm' | 'cancel' | 'send' | null>(null); const [confirmCancel, setConfirmCancel] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([]); const [paymentsLoading, setPaymentsLoading] = useState(true); const [paymentsError, setPaymentsError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { const record = await billingApi.getInvoice(invoiceId); setInvoice(record); setPaymentsLoading(true); setPaymentsError(''); try { setPayments(await financeApi.invoicePayments(invoiceId)) } catch (cause) { setPaymentsError(cause instanceof Error ? cause.message : 'Payment history could not be loaded.') } finally { setPaymentsLoading(false) } } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invoice could not be loaded.'); setPaymentsLoading(false) } finally { setLoading(false) } }, [invoiceId])
  useEffect(() => { void load() }, [load])

  async function perform(action: 'confirm' | 'cancel' | 'send') {
    if (!invoice || !billingApiConfigured || busy) return
    setBusy(action); setError(''); setSuccess('')
    try {
      if (action === 'confirm') await billingApi.confirmInvoice(invoice.id)
      if (action === 'cancel') await billingApi.cancelInvoice(invoice.id)
      if (action === 'send') await billingApi.sendInvoice(invoice.id)
      if (action === 'cancel') setConfirmCancel(false)
      setSuccess(action === 'confirm' ? 'Invoice confirmed.' : action === 'cancel' ? 'Invoice cancelled.' : 'Invoice sent.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Invoice could not be ${action === 'send' ? 'sent' : `${action}ed`}.`); if (action === 'cancel') setConfirmCancel(false) }
    finally { setBusy(null) }
  }

  const lineColumns: DataTableColumn<InvoiceLine>[] = [
    { key: 'description', header: 'Invoice line', render: (line) => <span className="font-medium text-slate-800">{line.description}</span> },
    { key: 'quantity', header: 'Quantity', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => line.quantity },
    { key: 'unitPrice', header: 'Unit price', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => formatMoney(line.unitPrice, invoice?.currency ?? 'INR') },
    { key: 'taxRate', header: 'Tax rate', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => `${line.taxRate}%` },
    { key: 'amount', header: 'Line amount', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (line) => formatMoney(line.amount, invoice?.currency ?? 'INR') },
  ]

  return <PageContainer title={invoice ? invoice.number : 'Invoice details'} description="Review invoice lines and the backend-provided amount breakdown." actions={<Link to="/invoices" className="no-print inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} />All invoices</Link>}>
    {!billingApiConfigured ? <div className="no-print"><BillingApiNotice /></div> : null}
    {success ? <div className="no-print mb-5 rounded-2xl border border-emerald-200 bg-white"><StatePanel kind="success" title="Invoice action completed" description={success} compact /></div> : null}
    {error && invoice ? <div className="no-print mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Invoice action failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Refresh invoice</Button>} /></div> : null}
    {loading ? <Card><StatePanel kind="loading" title="Loading invoice" description="Fetching invoice and amount breakdown from the backend." /></Card> : error && !invoice ? <Card><StatePanel kind="error" title="Invoice unavailable" description={error} action={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></Card> : invoice ? <div id="invoice-print-area" className="space-y-5">
      <Card><CardHeader className="flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{invoice.number}</h2></div><InvoiceStatusBadge status={invoice.status} /></div><div className="no-print flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} />Print / Save as PDF</Button>{invoice.status === 'draft' ? <Button size="sm" disabled={!billingApiConfigured || busy !== null} onClick={() => void perform('confirm')}><Check size={14} />{busy === 'confirm' ? 'Confirming…' : 'Confirm invoice'}</Button> : null}{invoice.capabilities?.send === true ? <Button variant="outline" size="sm" disabled={!billingApiConfigured || busy !== null} onClick={() => void perform('send')}><Mail size={14} />{busy === 'send' ? 'Sending…' : 'Send invoice'}</Button> : null}{invoice.status !== 'cancelled' && invoice.status !== 'paid' ? <Button variant="outline" size="sm" className="text-rose-700 hover:bg-rose-50" disabled={!billingApiConfigured || busy !== null} onClick={() => setConfirmCancel(true)}>Cancel invoice</Button> : null}</div></CardHeader><div className="no-print border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">Invoice actions are submitted to the billing API. Displayed values remain the backend response values.{invoice.capabilities?.send !== true ? ' Sending is not enabled by this invoice response.' : ''}</div></Card>
      <div className="grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Invoice and customer</CardTitle></CardHeader><div className="grid gap-x-6 gap-y-5 px-5 pb-6 sm:grid-cols-2 sm:px-6"><Info label="Customer" value={invoice.customerName} icon={<UserRound size={16} />} /><Info label="Email" value={invoice.customerEmail || '—'} /><Info label="Issue date" value={formatDate(invoice.issueDate)} icon={<CalendarDays size={16} />} /><Info label="Due date" value={formatDate(invoice.dueDate)} icon={<CalendarDays size={16} />} /></div></Card><Card><CardHeader><CardTitle>Invoice total</CardTitle></CardHeader><div className="px-5 pb-6 sm:px-6"><p className="text-3xl font-semibold tracking-tight text-slate-950">{formatMoney(invoice.total, invoice.currency)}</p><p className="mt-2 text-xs text-slate-500">Payable total supplied by the billing backend.</p></div></Card></div>
      <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><CardTitle>Invoice lines</CardTitle><p className="text-sm text-slate-500">Line quantities, unit rates, tax rates, and backend line amounts.</p></CardHeader><DataTable columns={lineColumns} rows={invoice.lines} getRowKey={(line) => line.id} emptyTitle="No invoice lines" emptyDescription="This invoice has no line items." /><div className="ml-auto w-full max-w-md border-t border-slate-100 px-5 py-5 sm:px-6"><div className="space-y-3 text-sm"><BreakdownRow label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} /><div className="border-t border-slate-100 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Discounts</p>{invoice.discounts.length ? <div className="space-y-2">{invoice.discounts.map((discount) => <BreakdownRow key={discount.id} label={discount.name} value={`−${formatMoney(discount.amount, invoice.currency)}`} tone="green" />)}</div> : <p className="text-xs text-slate-400">No discounts applied.</p>}</div><div className="border-t border-slate-100 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tax breakdown</p>{invoice.taxBreakdown.length ? <div className="space-y-2">{invoice.taxBreakdown.map((tax) => <BreakdownRow key={tax.id} label={`${tax.name} (${tax.rate}%)`} value={formatMoney(tax.amount, invoice.currency)} />)}</div> : <p className="text-xs text-slate-400">No tax entries returned.</p>}</div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950"><span>Total payable</span><span>{formatMoney(invoice.total, invoice.currency)}</span></div><p className="text-right text-[11px] text-slate-400">Totals are displayed as returned by the backend.</p></div></div></Card>
      <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><CardTitle>Payment history</CardTitle><p className="text-sm text-slate-500">Recorded payments and the invoice balance status reported by the backend.</p></CardHeader>{paymentsLoading ? <div className="space-y-4 p-5"><div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" /><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" /></div> : paymentsError ? <StatePanel kind="error" title="Payment history unavailable" description={paymentsError} compact /> : payments.length ? <DataTable columns={paymentColumns} rows={payments} getRowKey={(payment) => payment.id} emptyTitle="No payments" /> : <StatePanel kind="empty" title="No payments recorded" description="The backend returned no payment records for this invoice." compact />}</Card>
      <div className="hidden print:block pt-8 text-xs text-slate-500">Invoice {invoice.number} · Generated from Brightloop</div>
    </div> : null}
    <ConfirmDialog open={confirmCancel} onClose={() => { if (!busy) setConfirmCancel(false) }} onConfirm={() => void perform('cancel')} busy={busy === 'cancel'} title="Cancel invoice?" description={`Cancel invoice “${invoice?.number ?? ''}”? The billing backend will process the cancellation.`} confirmLabel="Cancel invoice" />
  </PageContainer>
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="flex gap-2.5">{icon ? <span className="mt-0.5 text-slate-400">{icon}</span> : null}<div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div></div> }
function BreakdownRow({ label, value, tone }: { label: string; value: string; tone?: 'green' }) { return <div className={`flex justify-between gap-5 ${tone === 'green' ? 'text-emerald-700' : 'text-slate-600'}`}><span>{label}</span><span className="tabular-nums">{value}</span></div> }
const paymentColumns: DataTableColumn<Payment>[] = [
  { key: 'date', header: 'Date', render: (payment) => formatDate(payment.date) },
  { key: 'method', header: 'Method', render: (payment) => payment.method.replace('_', ' ') },
  { key: 'amount', header: 'Amount', className: 'font-semibold tabular-nums', render: (payment) => formatMoney(payment.amount, payment.currency) },
  { key: 'status', header: 'Payment status', render: (payment) => <PaymentStatusBadge status={payment.status} /> },
  { key: 'invoiceStatus', header: 'Invoice status', render: (payment) => <InvoicePaymentBadge status={payment.invoicePaymentStatus} /> },
]
