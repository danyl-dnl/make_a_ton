import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Banknote, CalendarDays, CircleAlert, CreditCard, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { InvoiceStatusBadge } from '../components/billing/InvoiceStatusBadge'
import { PaymentStatusBadge } from '../components/finance/PaymentStatusBadge'
import { BillingApiNotice } from '../components/billing/BillingApiNotice'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { MetricSkeleton, Skeleton } from '../components/ui/Skeleton'
import { StatePanel } from '../components/ui/StatePanel'
import { financeApi, financeApiConfigured } from '../lib/finance-api'
import type { FinanceDashboard, FinanceFilters, PaymentStatus } from '../lib/finance-types'
import type { InvoiceStatus } from '../lib/billing-types'
import { formatDate, formatMoney } from '../lib/billing-format'

type DatePreset = '7d' | '30d' | '90d' | 'custom'
const invoiceStatuses: { value: 'all' | InvoiceStatus; label: string }[] = [{ value: 'all', label: 'All invoice statuses' }, { value: 'draft', label: 'Draft' }, { value: 'issued', label: 'Issued' }, { value: 'partially_paid', label: 'Partially paid' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }, { value: 'cancelled', label: 'Cancelled' }]
const paymentStatuses: { value: 'all' | PaymentStatus; label: string }[] = [{ value: 'all', label: 'All payment statuses' }, { value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }]

function dateString(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}` }
function rangeFor(days: number) { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - (days - 1)); return { from: dateString(start), to: dateString(end) } }
function withinRange(value: string, from: string, to: string) { const date = value?.slice(0, 10); return Boolean(date && (!from || date >= from) && (!to || date <= to)) }

export function DashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [dates, setDates] = useState(() => rangeFor(30))
  const [invoiceStatus, setInvoiceStatus] = useState<'all' | InvoiceStatus>('all')
  const [paymentStatus, setPaymentStatus] = useState<'all' | PaymentStatus>('all')
  const [data, setData] = useState<FinanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const filters: FinanceFilters = { ...dates, invoiceStatus, paymentStatus }

  useEffect(() => {
    let current = true
    setData(null); setError('')
    if (dates.from && dates.to && dates.from > dates.to) { setError('The start date must be on or before the end date.'); setLoading(false); return () => { current = false } }
    setLoading(true)
    void financeApi.dashboard(filters).then((result) => { if (current) setData(result) }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Finance dashboard could not be loaded.') }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [dates.from, dates.to, invoiceStatus, paymentStatus, reloadKey])

  const chartData = useMemo(() => (data?.revenueTrend ?? []).filter((point) => withinRange(point.date, dates.from, dates.to)), [data, dates])
  const recentInvoices = useMemo(() => (data?.recentInvoices ?? []).filter((invoice) => withinRange(invoice.issueDate, dates.from, dates.to) && (invoiceStatus === 'all' || invoice.status === invoiceStatus)), [data, dates, invoiceStatus])
  const overdueInvoices = useMemo(() => (data?.overdueInvoices ?? []).filter((invoice) => withinRange(invoice.dueDate, dates.from, dates.to) && (invoiceStatus === 'all' || invoice.status === invoiceStatus)), [data, dates, invoiceStatus])
  const paymentsSummary = useMemo(() => (data?.paymentSummary ?? []).filter((row) => paymentStatus === 'all' || row.status === paymentStatus), [data, paymentStatus])

  function choosePreset(value: '7d' | '30d' | '90d') { setPreset(value); setDates(rangeFor(Number(value.slice(0, -1)))) }
  const recentColumns: DataTableColumn<NonNullable<FinanceDashboard['recentInvoices']>[number]>[] = [
    { key: 'invoice', header: 'Invoice', render: (row) => <Link to={`/invoices/${encodeURIComponent(row.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{row.number}</Link> },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'due', header: 'Due date', render: (row) => formatDate(row.dueDate) },
    { key: 'total', header: 'Total', className: 'font-medium tabular-nums', render: (row) => formatMoney(row.total, data?.currency ?? 'INR') },
    { key: 'status', header: 'Status', render: (row) => <InvoiceStatusBadge status={row.status} /> },
  ]
  const overdueColumns: DataTableColumn<NonNullable<FinanceDashboard['overdueInvoices']>[number]>[] = [
    { key: 'invoice', header: 'Invoice', render: (row) => <Link to={`/invoices/${encodeURIComponent(row.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{row.number}</Link> },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'due', header: 'Due date', render: (row) => formatDate(row.dueDate) },
    { key: 'balance', header: 'Amount due', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (row) => formatMoney(row.amountDue, data?.currency ?? 'INR') },
  ]

  return <PageContainer title="Finance dashboard" description="A live view of revenue, receivables, invoices, and subscription activity." className="max-w-[1600px]">
    {!financeApiConfigured ? <BillingApiNotice /> : null}
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{(['7d', '30d', '90d'] as const).map((item) => <button key={item} onClick={() => choosePreset(item)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${preset === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Last {item.slice(0, -1)} days</button>)}<button onClick={() => setPreset('custom')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${preset === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Custom</button></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><label className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} /><span>From</span><input aria-label="From date" type="date" value={dates.from} onChange={(event) => { setPreset('custom'); setDates((current) => ({ ...current, from: event.target.value })) }} className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-700" /></label><label className="flex items-center gap-2 text-xs text-slate-500"><span>To</span><input aria-label="To date" type="date" value={dates.to} onChange={(event) => { setPreset('custom'); setDates((current) => ({ ...current, to: event.target.value })) }} className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-700" /></label><select aria-label="Filter invoice status" value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value as 'all' | InvoiceStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700">{invoiceStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select aria-label="Filter payment status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as 'all' | PaymentStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700">{paymentStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    </div>
    {dates.from && dates.to && dates.from > dates.to ? <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">The start date must be on or before the end date.</div> : null}
    {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Dashboard data unavailable" description={error} compact action={<Button variant="outline" size="sm" onClick={() => setReloadKey((current) => current + 1)}>Retry</Button>} /></div> : null}

    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {loading ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />) : data ? <>
        <KpiCard label="Active subscriptions" value={data.kpis.activeSubscriptions.toLocaleString('en-IN')} detail="Current active records" icon={<Users size={18} />} tone="blue" />
        <KpiCard label="Revenue collected" value={formatMoney(data.kpis.revenueCollected, data.currency)} detail="Payments recorded in range" icon={<Banknote size={18} />} tone="green" />
        <KpiCard label="Outstanding receivables" value={formatMoney(data.kpis.outstandingReceivables, data.currency)} detail="Unpaid invoice balance" icon={<CreditCard size={18} />} tone="amber" />
        <KpiCard label="Overdue invoices" value={data.kpis.overdueInvoiceCount.toLocaleString('en-IN')} detail="Past their due date" icon={<CircleAlert size={18} />} tone="rose" />
      </> : error ? <Card className="sm:col-span-2 2xl:col-span-4"><StatePanel kind="error" title="Finance KPIs unavailable" description="No metrics are shown because the backend request failed." compact /></Card> : null}
    </div>

    <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.75fr)]">
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Revenue trend</CardTitle><p className="mt-1 text-sm text-slate-500">Collected revenue during the selected period</p></div><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Activity size={17} /></span></CardHeader><CardContent>
        {loading ? <Skeleton className="h-[280px] w-full rounded-xl" /> : error ? <StatePanel kind="error" title="Revenue unavailable" description="Revenue data could not be loaded for these filters." compact /> : chartData.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 10, left: 2, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tickFormatter={(value: string) => formatDate(value).replace(/\s\d{4}$/, '')} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={24} /><YAxis tickFormatter={(value: number) => compactMoney(value, data?.currency ?? 'INR')} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} /><Tooltip formatter={(value) => formatMoney(Number(value ?? 0), data?.currency ?? 'INR')} labelFormatter={(value) => formatDate(String(value))} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} /><Area type="monotone" dataKey="amount" name="Revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 4, strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div> : <StatePanel kind="empty" title="No revenue data for this period" description="The backend returned no revenue points for the selected filters." compact />}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Payment summary</CardTitle><p className="mt-1 text-sm text-slate-500">Payment records by status</p></CardHeader><CardContent>{loading ? <div className="space-y-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : error ? <StatePanel kind="error" title="Payment summary unavailable" description="Payment summary could not be loaded." compact /> : paymentsSummary.length ? <div className="divide-y divide-slate-100">{paymentsSummary.map((row) => <div key={row.status} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="flex items-center gap-3"><PaymentStatusBadge status={row.status} /><span className="text-xs text-slate-500">{row.count.toLocaleString('en-IN')} payments</span></div><span className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(row.amount, data?.currency ?? 'INR')}</span></div>)}</div> : <StatePanel kind="empty" title="No payment summary" description="No payments match the selected date and status filters." compact />}</CardContent></Card>
    </div>

    <div className="mt-5 grid gap-5 2xl:grid-cols-2">
      <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-slate-100"><div><CardTitle>Recent invoices</CardTitle><p className="mt-1 text-sm text-slate-500">Filtered by selected period and invoice status</p></div><Link to="/invoices" className="text-xs font-semibold text-blue-700 hover:text-blue-800">View all</Link></CardHeader>{loading ? <TableSkeleton rows={4} /> : error ? <StatePanel kind="error" title="Invoice records unavailable" description="Retry the finance request to load invoice rows." compact /> : data ? <DataTable columns={recentColumns} rows={recentInvoices} getRowKey={(row) => row.id} emptyTitle="No recent invoices" emptyDescription="No invoices match the current date and status filters." /> : null}</Card>
      <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-slate-100"><div><CardTitle>Overdue invoices</CardTitle><p className="mt-1 text-sm text-slate-500">Backend-reported past-due balances</p></div><span className="text-xs font-semibold text-rose-600">{loading ? ' ' : error ? 'unavailable' : data?.kpis.overdueInvoiceCount.toLocaleString('en-IN') ?? '—'}{!error ? ' overdue' : ''}</span></CardHeader>{loading ? <TableSkeleton rows={4} /> : error ? <StatePanel kind="error" title="Overdue records unavailable" description="Retry the finance request to load overdue invoices." compact /> : data ? <DataTable columns={overdueColumns} rows={overdueInvoices} getRowKey={(row) => row.id} emptyTitle="No overdue invoices" emptyDescription="No overdue invoices match the current filters." /> : null}</Card>
    </div>

    <Card className="mt-5 overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-slate-100"><div><CardTitle>Active subscription summary</CardTitle><p className="mt-1 text-sm text-slate-500">Current active contracts returned by the backend</p></div><Link to="/subscriptions" className="text-xs font-semibold text-blue-700 hover:text-blue-800">View subscriptions</Link></CardHeader>{loading ? <TableSkeleton rows={3} /> : error ? <StatePanel kind="error" title="Subscription summary unavailable" description="Retry the finance request to load active subscriptions." compact /> : data?.activeSubscriptions.length ? <DataTable columns={subscriptionColumns(data.currency)} rows={data.activeSubscriptions} getRowKey={(row) => row.id} /> : <StatePanel kind="empty" title="No active subscriptions" description="The backend returned no active subscriptions for the selected date range." />}</Card>
  </PageContainer>
}

function KpiCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'amber' | 'rose' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-600' }
  return <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-5 truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">{value}</p><p className="mt-1.5 text-xs text-slate-500">{detail}</p></Card>
}
function TableSkeleton({ rows }: { rows: number }) { return <div className="space-y-4 p-5">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex gap-5"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 flex-1" /></div>)}</div> }
function compactMoney(value: number, currency: string) { try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value) } catch { return formatMoney(value, 'INR') } }
function subscriptionColumns(currency: string): DataTableColumn<NonNullable<FinanceDashboard['activeSubscriptions']>[number]>[] {
  return [
    { key: 'number', header: 'Subscription', render: (row) => <Link to={`/subscriptions/${encodeURIComponent(row.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{row.number}</Link> },
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'plan', header: 'Plan', render: (row) => row.planName },
    { key: 'expiry', header: 'Expires', render: (row) => formatDate(row.expiryDate) },
    { key: 'amount', header: 'Amount', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (row) => formatMoney(row.amount, row.currency || currency) },
  ]
}
