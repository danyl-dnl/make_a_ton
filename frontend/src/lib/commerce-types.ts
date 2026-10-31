export type QuoteLine = { id?: string; kind: 'product' | 'plan'; referenceId?: string; name: string; quantity: number; unitPrice: number; taxRate: number }
export type QuoteTemplate = { id: string; name: string; description: string; validityDays: number; lines: QuoteLine[]; updatedAt: string }
export type QuoteTemplateInput = Omit<QuoteTemplate, 'id' | 'updatedAt'>
export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'expired' | 'cancelled'
export type Quotation = { id: string; number: string; customerName: string; customerEmail: string; templateName?: string; createdAt: string; validUntil: string; paymentTerms: string; lines: QuoteLine[]; amount: number; status: QuotationStatus }
export type SubscriptionStatus = 'pending_confirmation' | 'confirmed' | 'active' | 'paused' | 'expired' | 'closed'
export type Subscription = { id: string; number: string; customerName: string; customerEmail: string; planName: string; startDate: string; expiryDate: string; paymentTerms: string; lines: QuoteLine[]; amount: number; status: SubscriptionStatus }
export type LifecycleAction = 'confirm' | 'activate' | 'pause' | 'resume' | 'renew' | 'close'
