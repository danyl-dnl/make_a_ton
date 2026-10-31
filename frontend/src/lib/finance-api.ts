import { ApiError } from './api'
import type { FinanceDashboard, FinanceFilters, Payment, PaymentInput, PaymentInvoiceOption, PaymentStatus } from './finance-types'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
export const financeApiConfigured = Boolean(baseUrl)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new ApiError('Finance APIs are not configured. Confirm the backend contract and set VITE_API_BASE_URL.')
  let response: Response
  try { response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }) }
  catch { throw new ApiError('Could not reach the finance service. Check your connection and try again.') }
  if (!response.ok) {
    let message = 'The request could not be completed. Please try again.'
    try { const body: unknown = await response.json(); if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') message = body.message } catch { /* Keep a readable fallback for non-JSON errors. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value) })
  const value = search.toString()
  return value ? `?${value}` : ''
}

const idPath = (id: string) => encodeURIComponent(id)

/** Proposed finance routes only; confirm against docs/api-contract.md / Person A. */
export const financeApi = {
  dashboard: (filters: FinanceFilters) => request<FinanceDashboard>(`/dashboard/finance${queryString({ from: filters.from, to: filters.to, invoiceStatus: filters.invoiceStatus === 'all' ? undefined : filters.invoiceStatus, paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus })}`),
  listPayments: (filters: { from?: string; to?: string; status?: PaymentStatus | 'all'; query?: string }) => request<Payment[]>(`/payments${queryString({ from: filters.from, to: filters.to, status: filters.status === 'all' ? undefined : filters.status, q: filters.query })}`),
  payableInvoices: () => request<PaymentInvoiceOption[]>('/invoices/payable'),
  recordPayment: (input: PaymentInput) => request<Payment>('/payments', { method: 'POST', body: JSON.stringify(input) }),
  invoicePayments: (invoiceId: string) => request<Payment[]>(`/invoices/${idPath(invoiceId)}/payments`),
}
