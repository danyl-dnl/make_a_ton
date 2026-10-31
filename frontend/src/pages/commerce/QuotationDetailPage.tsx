import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react'
import { ApiDependencyNotice } from '../../components/commerce/ApiDependencyNotice'
import { LineItemsTable } from '../../components/commerce/LineItemsTable'
import { StatusBadge } from '../../components/commerce/StatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle } from '../../components/ui/card'
import { StatePanel } from '../../components/ui/StatePanel'
import { commerceApi, commerceApiConfigured } from '../../lib/commerce-api'
import { formatINR } from '../../lib/format'
import type { Quotation } from '../../lib/commerce-types'

export function QuotationDetailPage() {
  const { quotationId = '' } = useParams()
  const [item, setItem] = useState<Quotation | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItem(await commerceApi.getQuotation(quotationId)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Quotation could not be loaded.') } finally { setLoading(false) } }, [quotationId])
  useEffect(() => { void load() }, [load])
  return <PageContainer title={item ? item.number : 'Quotation details'} description="Review quotation terms, validity, and line item pricing." actions={<Link to="/quotations" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} />All quotations</Link>}>
    {!commerceApiConfigured ? <ApiDependencyNotice /> : null}
    {loading ? <Card><StatePanel kind="loading" title="Loading quotation" description="Fetching quotation details from the backend." /></Card> : error || !item ? <Card><StatePanel kind="error" title="Quotation details unavailable" description={error || 'No quotation was returned for this ID.'} action={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></Card> : <div className="space-y-5">
      <Card><CardHeader className="flex-row flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quotation</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{item.number}</h2></div><StatusBadge status={item.status} /></CardHeader></Card>
      <div className="grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Customer and validity</CardTitle></CardHeader><div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6"><Info label="Customer" value={item.customerName} icon={<UserRound size={16} />} /><Info label="Email" value={item.customerEmail || '—'} /><Info label="Created" value={formatDate(item.createdAt)} icon={<CalendarDays size={16} />} /><Info label="Valid until" value={formatDate(item.validUntil)} icon={<CalendarDays size={16} />} /><Info label="Payment terms" value={item.paymentTerms || 'Not specified'} /><Info label="Template" value={item.templateName || 'Custom quotation'} /></div></Card><Card><CardHeader><CardTitle>Quotation amount</CardTitle></CardHeader><div className="px-5 pb-6 sm:px-6"><p className="text-3xl font-semibold tracking-tight text-slate-950">{formatINR.format(item.amount)}</p><p className="mt-2 text-xs text-slate-500">Amount from the quotation record.</p></div></Card></div>
      <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><CardTitle>Products and plans</CardTitle><p className="text-sm text-slate-500">Quantities, unit prices, tax, and line totals.</p></CardHeader><div className="p-0"><LineItemsTable lines={item.lines} /></div></Card>
    </div>}
  </PageContainer>
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="flex gap-2.5">{icon ? <span className="mt-0.5 text-slate-400">{icon}</span> : null}<div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div></div> }
function formatDate(value: string) { if (!value) return '—'; const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) }
