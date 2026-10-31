export function formatMoney(value: number, currency: string) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(value) }
  catch { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value) }
}

export function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
