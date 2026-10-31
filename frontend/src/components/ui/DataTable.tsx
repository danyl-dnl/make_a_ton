import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { StatePanel } from './StatePanel'

export type DataTableColumn<T> = { key: string; header: string; render: (row: T) => ReactNode; className?: string; headerClassName?: string; sortValue?: (row: T) => string | number | null | undefined }
type DataTableProps<T> = { columns: DataTableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string | number; emptyTitle?: string; emptyDescription?: string; className?: string; label?: string }

export function DataTable<T>({ columns, rows, getRowKey, emptyTitle, emptyDescription, className, label = 'Records' }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null)
  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sortValue) return rows
    const direction = sort.direction === 'ascending' ? 1 : -1
    return [...rows].sort((left, right) => {
      const a = column.sortValue?.(left)
      const b = column.sortValue?.(right)
      if (a == null) return b == null ? 0 : 1
      if (b == null) return -1
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * direction
    })
  }, [columns, rows, sort])
  if (rows.length === 0) return <StatePanel kind="empty" title={emptyTitle} description={emptyDescription} className={className} />
  return (
    <div role="region" aria-label={`${label} table`} tabIndex={0} className={cn('w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead><tr className="border-b border-slate-100 bg-slate-50/70">{columns.map((column) => {
          const active = sort?.key === column.key
          const ariaSort = active ? sort.direction : 'none'
          const Icon = active ? sort.direction === 'ascending' ? ArrowUp : ArrowDown : ArrowUpDown
          return <th key={column.key} scope="col" aria-sort={column.sortValue ? ariaSort : undefined} className={cn('px-5 py-3 text-xs font-semibold text-slate-500', column.headerClassName)}>{column.sortValue ? <button type="button" onClick={() => setSort((current) => current?.key === column.key ? { key: column.key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' } : { key: column.key, direction: 'ascending' })} className="inline-flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{column.header}<Icon size={13} aria-hidden="true" /></button> : column.header}</th>
        })}</tr></thead>
        <tbody className="divide-y divide-slate-100">{sortedRows.map((row) => <tr key={getRowKey(row)} className="hover:bg-slate-50/60">{columns.map((column) => <td key={column.key} className={cn('px-5 py-4 text-slate-700', column.className)}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
