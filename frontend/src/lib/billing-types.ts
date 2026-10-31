export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
export type InvoiceLine = { id: string; description: string; quantity: number; unitPrice: number; taxRate: number; amount: number }
export type InvoiceDiscount = { id: string; name: string; amount: number }
export type InvoiceTax = { id: string; name: string; rate: number; amount: number }
export type Invoice = {
  id: string
  number: string
  customerName: string
  customerEmail: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  lines: InvoiceLine[]
  subtotal: number
  discounts: InvoiceDiscount[]
  taxBreakdown: InvoiceTax[]
  total: number
  capabilities?: { send?: boolean }
}

export type DiscountType = 'fixed' | 'percentage'
export type DiscountStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'disabled'
export type DiscountTargetType = 'product' | 'subscription'
export type DiscountTarget = { id: string; name: string; type: DiscountTargetType }
export type Discount = {
  id: string
  name: string
  code: string
  description: string
  type: DiscountType
  value: number
  minimumPurchase: number | null
  minimumQuantity: number | null
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usageCount: number
  applicableTo: DiscountTarget[]
  status: DiscountStatus
  currency: string
}
export type DiscountInput = Omit<Discount, 'id' | 'usageCount' | 'status'>
