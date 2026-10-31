import type { Plan, PlanInput, Product, ProductInput } from './catalog-types'
import { ApiError } from './api'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new ApiError('Catalog API is not configured.')
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Could not reach the catalog API. Check your connection and try again.')
  }
  if (!response.ok) {
    let message = 'The catalog request could not be completed. Please try again.'
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') message = body.message
    } catch { /* Keep the readable fallback for non-JSON server responses. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (value: unknown) => JSON.stringify(value)

/** Proposed endpoint mapping only; confirm paths and response envelopes with Person A. */
export const catalogApi = {
  listProducts: () => request<Product[]>('/products'),
  createProduct: (input: ProductInput) => request<Product>('/products', { method: 'POST', body: json(input) }),
  updateProduct: (id: string, input: ProductInput) => request<Product>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: json(input) }),
  deleteProduct: (id: string) => request<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listPlans: () => request<Plan[]>('/plans'),
  createPlan: (input: PlanInput) => request<Plan>('/plans', { method: 'POST', body: json(input) }),
  updatePlan: (id: string, input: PlanInput) => request<Plan>(`/plans/${encodeURIComponent(id)}`, { method: 'PUT', body: json(input) }),
  deletePlan: (id: string) => request<void>(`/plans/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
