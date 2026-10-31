import type { InvoiceStatus } from './billing-types'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type InvoicePaymentStatus = 'unpaid' | 'partially_paid' | 'paid'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'upi' | 'cheque' | 'other'
export type FinanceFilters = { from: string; to: string; invoiceStatus: 'all' | InvoiceStatus; paymentStatus: 'all' | PaymentStatus }

export type FinanceDashboard = {
  currency: string
  kpis: { activeSubscriptions: number; revenueCollected: number; outstandingReceivables: number; overdueInvoiceCount: number }
  revenueTrend: { date: string; amount: number }[]
  paymentSummary: { status: PaymentStatus; count: number; amount: number }[]
  recentInvoices: { id: string; number: string; customerName: string; issueDate: string; dueDate: string; total: number; status: InvoiceStatus }[]
  overdueInvoices: { id: string; number: string; customerName: string; dueDate: string; amountDue: number; status: InvoiceStatus }[]
  activeSubscriptions: { id: string; number: string; customerName: string; planName: string; startDate: string; expiryDate: string; amount: number; currency: string }[]
}

export type PaymentInvoiceOption = { id: string; number: string; customerName: string; amountDue: number; currency: string }
export type Payment = { id: string; invoiceId: string; invoiceNumber: string; customerName: string; amount: number; currency: string; method: PaymentMethod; date: string; note: string; status: PaymentStatus; invoicePaymentStatus: InvoicePaymentStatus }
export type PaymentInput = { invoiceId: string; method: PaymentMethod; amount: number; date: string; note: string }
