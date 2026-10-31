/**
 * TEMPORARY API ADAPTER: docs/api-contract.md is not present yet.
 * Confirm endpoint paths, payloads, response envelopes, and auth/session strategy with Person A
 * before connecting the backend. Set VITE_API_BASE_URL when the contract is agreed.
 */
export type AuthCredentials = { email: string; password: string }
export type RegisterCustomerInput = AuthCredentials & { name: string }
export type AuthResponse = { accessToken: string; refreshToken?: string; user: { id: string; email: string; name?: string } }

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!baseUrl) throw new ApiError('Authentication service is not configured yet. Please try again later.')
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError('Could not reach the authentication service. Check your connection and try again.')
  }
  if (!response.ok) {
    let message = 'The request could not be completed. Please try again.'
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') message = body.message
    } catch { /* Use the generic error when the server returns no JSON message. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// Paths and envelopes below are placeholders pending agreement with Person A.
export const authApi = {
  login: (input: AuthCredentials) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: RegisterCustomerInput) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  forgotPassword: (email: string) => request<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
}
