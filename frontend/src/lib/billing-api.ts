import { ApiError } from './api'
import type { Discount, DiscountInput, DiscountTarget, Invoice } from './billing-types'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
export const billingApiConfigured = Boolean(baseUrl)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new ApiError('Invoice and discount APIs are not configured. Confirm the backend contract and set VITE_API_BASE_URL.')
  let response: Response
  try { response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }) }
  catch { throw new ApiError('Could not reach the invoice and discount service. Check your connection and try again.') }
  if (!response.ok) {
    let message = 'The request could not be completed. Please try again.'
    try { const body: unknown = await response.json(); if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') message = body.message } catch { /* Use the fallback for non-JSON errors. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (value: unknown) => JSON.stringify(value)
const idPath = (id: string) => encodeURIComponent(id)

/** Provisional route names only; verify against the backend contract before integration. */
export const billingApi = {
  listInvoices: () => request<Invoice[]>('/invoices'),
  getInvoice: (id: string) => request<Invoice>(`/invoices/${idPath(id)}`),
  confirmInvoice: (id: string) => request<Invoice>(`/invoices/${idPath(id)}/confirm`, { method: 'POST' }),
  cancelInvoice: (id: string) => request<Invoice>(`/invoices/${idPath(id)}/cancel`, { method: 'POST' }),
  sendInvoice: (id: string) => request<Invoice>(`/invoices/${idPath(id)}/send`, { method: 'POST' }),
  listDiscounts: () => request<Discount[]>('/discounts'),
  createDiscount: (input: DiscountInput) => request<Discount>('/discounts', { method: 'POST', body: json(input) }),
  updateDiscount: (id: string, input: DiscountInput) => request<Discount>(`/discounts/${idPath(id)}`, { method: 'PUT', body: json(input) }),
  listDiscountTargets: () => request<DiscountTarget[]>('/discount-targets'),
}
