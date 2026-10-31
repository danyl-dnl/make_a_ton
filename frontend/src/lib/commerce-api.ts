import { ApiError } from './api'
import type { LifecycleAction, Quotation, QuoteTemplate, QuoteTemplateInput, Subscription } from './commerce-types'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
export const commerceApiConfigured = Boolean(baseUrl)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new ApiError('Quotation and subscription APIs are not configured. Confirm the backend contract and set VITE_API_BASE_URL.')
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  } catch {
    throw new ApiError('Could not reach the quotation and subscription service. Check your connection and try again.')
  }
  if (!response.ok) {
    let message = 'The request could not be completed. Please try again.'
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') message = body.message
    } catch { /* Fall back when the server does not return JSON. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (value: unknown) => JSON.stringify(value)
const idPath = (id: string) => encodeURIComponent(id)

/**
 * PROVISIONAL endpoints only. No docs/api-contract.md or backend routes exist in this checkout.
 * Confirm route names and payload/response envelopes with Person A before enabling integration.
 */
export const commerceApi = {
  listTemplates: () => request<QuoteTemplate[]>('/quotation-templates'),
  createTemplate: (input: QuoteTemplateInput) => request<QuoteTemplate>('/quotation-templates', { method: 'POST', body: json(input) }),
  updateTemplate: (id: string, input: QuoteTemplateInput) => request<QuoteTemplate>(`/quotation-templates/${idPath(id)}`, { method: 'PUT', body: json(input) }),
  deleteTemplate: (id: string) => request<void>(`/quotation-templates/${idPath(id)}`, { method: 'DELETE' }),
  listQuotations: () => request<Quotation[]>('/quotations'),
  getQuotation: (id: string) => request<Quotation>(`/quotations/${idPath(id)}`),
  listSubscriptions: () => request<Subscription[]>('/subscriptions'),
  getSubscription: (id: string) => request<Subscription>(`/subscriptions/${idPath(id)}`),
  lifecycle: (id: string, action: LifecycleAction) => request<Subscription>(`/subscriptions/${idPath(id)}/${action}`, { method: 'POST' }),
}
