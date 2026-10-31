import { formatINR } from '../../lib/format'
import type { QuoteLine } from '../../lib/commerce-types'
import { DataTable, type DataTableColumn } from '../ui/DataTable'

const columns: DataTableColumn<QuoteLine>[] = [
  { key: 'kind', header: 'Type', render: (line) => <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">{line.kind}</span> },
  { key: 'name', header: 'Item', render: (line) => <span className="font-medium text-slate-800">{line.name}</span> },
  { key: 'quantity', header: 'Qty', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => line.quantity },
  { key: 'unit', header: 'Unit price', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => formatINR.format(line.unitPrice) },
  { key: 'tax', header: 'Tax', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (line) => `${line.taxRate}%` },
  { key: 'amount', header: 'Amount', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (line) => formatINR.format(line.quantity * line.unitPrice * (1 + line.taxRate / 100)) },
]

export function LineItemsTable({ lines }: { lines: QuoteLine[] }) {
  const rows = lines.map((line, index) => ({ ...line, id: line.id ?? `line-${index}` }))
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * line.taxRate / 100, 0)
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  return <div><DataTable columns={columns} rows={rows} getRowKey={(line) => line.id} emptyTitle="No line items" emptyDescription="No products or plans are associated with this record." /><div className="ml-auto mt-4 w-full max-w-xs space-y-2 border-t border-slate-100 pt-4 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatINR.format(subtotal)}</span></div><div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatINR.format(tax)}</span></div><div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900"><span>Total</span><span>{formatINR.format(subtotal + tax)}</span></div></div></div>
}
