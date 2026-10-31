import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { ApiDependencyNotice } from '../../components/commerce/ApiDependencyNotice'
import { StatusBadge } from '../../components/commerce/StatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { StatePanel } from '../../components/ui/StatePanel'
import { commerceApi, commerceApiConfigured } from '../../lib/commerce-api'
import { formatINR } from '../../lib/format'
import type { Subscription, SubscriptionStatus } from '../../lib/commerce-types'

export function SubscriptionsPage() {
  const [items, setItems] = useState<Subscription[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | SubscriptionStatus>('all')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await commerceApi.listSubscriptions()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Subscriptions could not be loaded.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => items.filter((item) => `${item.number} ${item.customerName} ${item.customerEmail} ${item.planName}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || item.status === filter)), [items, query, filter])
  const columns: DataTableColumn<Subscription>[] = [
    { key: 'number', header: 'Subscription', render: (item) => <Link to={`/subscriptions/${encodeURIComponent(item.id)}`} className="font-semibold text-blue-700 hover:text-blue-800">{item.number}</Link> },
    { key: 'customer', header: 'Customer', render: (item) => <div><p className="font-medium text-slate-800">{item.customerName}</p><p className="mt-0.5 text-xs text-slate-500">{item.customerEmail}</p></div> },
    { key: 'plan', header: 'Plan', render: (item) => item.planName },
    { key: 'expiry', header: 'Expiry date', render: (item) => formatDate(item.expiryDate) },
    { key: 'amount', header: 'Amount', className: 'font-semibold', render: (item) => formatINR.format(item.amount) },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'open', header: '', className: 'text-right', render: (item) => <Link aria-label={`View subscription ${item.number}`} to={`/subscriptions/${encodeURIComponent(item.id)}`} className="inline-grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ArrowUpRight size={16} /></Link> },
  ]
  return <PageContainer title="Subscriptions" description="Track customer subscriptions, billing terms, and lifecycle status.">
    {!commerceApiConfigured ? <ApiDependencyNotice /> : null}
    {error && items.length > 0 ? <div className="mb-5 rounded-2xl border border-rose-200 bg-white"><StatePanel kind="error" title="Subscription request failed" description={error} compact action={<Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>} /></div> : null}
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-slate-900">All subscriptions</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Loading…' : `${filtered.length} records`}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search subscriptions</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search number, customer, plan..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" /></label><select aria-label="Filter subscriptions by status" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | SubscriptionStatus)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option><option value="pending_confirmation">Pending confirmation</option><option value="confirmed">Confirmed</option><option value="active">Active</option><option value="paused">Paused</option><option value="expired">Expired</option><option value="closed">Closed</option></select></div></div>
      {loading ? <StatePanel kind="loading" title="Loading subscriptions" description="Fetching subscription records from the backend." /> : error && !items.length ? <StatePanel kind="error" title="Subscriptions unavailable" description={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>} /> : <DataTable columns={columns} rows={filtered} getRowKey={(item) => item.id} emptyTitle={query || filter !== 'all' ? 'No matching subscriptions' : 'No subscriptions yet'} emptyDescription={commerceApiConfigured ? 'No subscriptions were returned by the backend.' : 'Subscription records will appear after the subscription API is configured.'} />}
    </Card>
  </PageContainer>
}

function formatDate(value: string) { if (!value) return '—'; const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) }
