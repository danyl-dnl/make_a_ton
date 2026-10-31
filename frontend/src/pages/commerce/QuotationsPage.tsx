import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { PageContainer } from '../../components/layout/PageContainer'
import { ApiDependencyNotice } from '../../components/commerce/ApiDependencyNotice'
import { StatusBadge } from '../../components/commerce/StatusBadge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { StatePanel } from '../../components/ui/StatePanel'
import { commerceApi, commerceApiConfigured } from '../../lib/commerce-api'
import { formatINR } from '../../lib/format'
import type { Quotation, QuotationStatus } from '../../lib/commerce-types'

export function QuotationsPage() {
  const [items, setItems] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | QuotationStatus>('all')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await commerceApi.listQuotations()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Quotations could not be loaded.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => items.filter((item) => `${item.number} ${item.customerName} ${item.customerEmail}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || item.status === filter)), [items, query, filter])
  const columns: DataTableColumn<Quotation>[] = [
    { key: 'number', header: 'Quotation', render: (item) => <Link to={`/quotations/${encodeURIComponent(item.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{item.number}</Link> },
    { key: 'customer', header: 'Customer', render: (item) => <div><p className="font-medium text-slate-800">{item.customerName}</p><p className="mt-0.5 text-xs text-slate-500">{item.customerEmail}</p></div> },
    { key: 'valid', header: 'Valid until', render: (item) => formatDate(item.validUntil) },
    { key: 'amount', header: 'Amount', className: 'font-semibold', render: (item) => formatINR.format(item.amount) },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'open', header: '', className: 'text-right', render: (item) => <Link aria-label={`View quotation ${item.number}`} to={`/quotations/${encodeURIComponent(item.id)}`} className="inline-grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ArrowUpRight size={16} /></Link> },
  ]
  return <PageContainer title="Quotations" description="Review customer quotations, validity, line items, and current status." actions={<Link to="/quotation-templates" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Quotation templates</Link>}>
    {!commerceApiConfigured ? <ApiDependencyNotice /> : null}
    {error && items.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Quotation request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-slate-900">All quotations</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading…' : `${filtered.length} records`}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search quotations</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search number or customer..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" /></label><select aria-label="Filter quotations by status" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | QuotationStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="confirmed">Confirmed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></div></div>
      {loading ? <StatePanel kind="loading" title="Loading quotations" description="Fetching quotation records from the backend." /> : error && !items.length ? <StatePanel kind="error" title="Quotations unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query || filter !== 'all' ? 'No matching quotations' : 'No quotations yet'} emptyDescription={commerceApiConfigured ? 'No quotations were returned by the backend.' : 'Quotation records will appear after the quotation API is configured.'} />}
    </Card>
  </PageContainer>
}

function formatDate(value: string) { if (!value) return '—'; const date = new Date(`${value.slice(0, 10)}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) }
