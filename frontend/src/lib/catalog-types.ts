export type ProductType = 'service' | 'physical' | 'digital'
export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type ProductVariant = { id: string; name: string; sku: string; additionalPrice: number }
export type Product = { id: string; name: string; type: ProductType; salesPrice: number; costPrice: number; notes: string; variants: ProductVariant[]; createdAt: string }
export type ProductInput = Omit<Product, 'id' | 'createdAt'>

export type Plan = {
  id: string
  name: string
  description: string
  price: number
  interval: BillingInterval
  minimumQuantity: number
  availableFrom: string
  availableUntil: string
  autoClose: boolean
  autoCloseAfterDays: number | null
  allowPause: boolean
  allowEarlyClose: boolean
  renewAutomatically: boolean
  createdAt: string
}
export type PlanInput = Omit<Plan, 'id' | 'createdAt'>

export type CatalogPage<T> = { items: T[]; source: 'preview' | 'api' }
