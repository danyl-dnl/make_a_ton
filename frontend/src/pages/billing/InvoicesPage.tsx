import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { InvoiceStatusBadge } from '../../components/billing/InvoiceStatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { BillingApiNotice } from '../../components/billing/BillingApiNotice'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { StatePanel } from '../../components/ui/StatePanel'
import { billingApi, billingApiConfigured } from '../../lib/billing-api'
import type { Invoice, InvoiceStatus } from '../../lib/billing-types'
import { formatDate, formatMoney } from '../../lib/billing-format'

export function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | InvoiceStatus>('all')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await billingApi.listInvoices()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invoices could not be loaded.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => items.filter((item) => `${item.number} ${item.customerName} ${item.customerEmail}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || item.status === filter)), [items, query, filter])
  const columns: DataTableColumn<Invoice>[] = [
    { key: 'number', header: 'Invoice', render: (item) => <Link to={`/invoices/${encodeURIComponent(item.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{item.number}</Link> },
    { key: 'customer', header: 'Customer', render: (item) => <div><p className="font-medium text-slate-800">{item.customerName}</p><p className="mt-0.5 text-xs text-slate-500">{item.customerEmail}</p></div> },
    { key: 'due', header: 'Due date', render: (item) => formatDate(item.dueDate) },
    { key: 'total', header: 'Total', className: 'font-semibold tabular-nums', render: (item) => formatMoney(item.total, item.currency) },
    { key: 'status', header: 'Status', render: (item) => <InvoiceStatusBadge status={item.status} /> },
    { key: 'open', header: '', className: 'text-right', render: (item) => <Link aria-label={`View invoice ${item.number}`} to={`/invoices/${encodeURIComponent(item.id)}`} className="inline-grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ArrowUpRight size={16} /></Link> },
  ]
  return <PageContainer title="Invoices" description="Review invoice balances, due dates, and payment status.">
    {!billingApiConfigured ? <BillingApiNotice /> : null}
    {error && items.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Invoice request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-slate-900">All invoices</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading…' : `${filtered.length} records`}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search invoices</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice or customer..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" /></label><select aria-label="Filter invoices by status" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | InvoiceStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="issued">Issued</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div></div>
      {loading ? <StatePanel kind="loading" title="Loading invoices" description="Fetching invoice records from the backend." /> : error && !items.length ? <StatePanel kind="error" title="Invoices unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query || filter !== 'all' ? 'No matching invoices' : 'No invoices yet'} emptyDescription={billingApiConfigured ? 'No invoices were returned by the backend.' : 'Invoice records will appear here after the invoice API is configured.'} />}
    </Card>
  </PageContainer>
}
