import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { StatePanel } from './StatePanel'

export type DataTableColumn<T> = { key: string; header: string; render: (row: T) => ReactNode; className?: string; headerClassName?: string }
type DataTableProps<T> = { columns: DataTableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string | number; emptyTitle?: string; emptyDescription?: string; className?: string }

export function DataTable<T>({ columns, rows, getRowKey, emptyTitle, emptyDescription, className }: DataTableProps<T>) {
  if (rows.length === 0) return <StatePanel kind="empty" title={emptyTitle} description={emptyDescription} className={className} />
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead><tr className="border-b border-slate-100 bg-slate-50/70">{columns.map((column) => <th key={column.key} scope="col" className={cn('px-5 py-3 text-xs font-semibold text-slate-500', column.headerClassName)}>{column.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={getRowKey(row)} className="hover:bg-slate-50/60">{columns.map((column) => <td key={column.key} className={cn('px-5 py-4 text-slate-700', column.className)}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
